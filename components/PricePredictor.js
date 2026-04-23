"use client";
import { useState } from "react";

const ANIMAL_OPTIONS = [
  { label: "Buffalo 🐃", value: "buffalo", color: "#6366f1" },
  { label: "Cow 🐄",     value: "cow",     color: "#10b981" },
  { label: "Goat 🐐",    value: "goat",    color: "#f59e0b" },
  { label: "Sheep 🐑",   value: "sheep",   color: "#ec4899" },
  { label: "Poultry 🐓", value: "poultry", color: "#ef4444" },
];

const CITY_SUGGESTIONS = [
  "Hyderabad","Mumbai","Bangalore","Delhi","Chennai","Pune","Kolkata",
  "Jaipur","Lucknow","Ahmedabad","Nagpur","Visakhapatnam","Indore",
];

function fmt(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

export default function PricePredictor({ defaultAnimal = "", onUseSuggestion }) {
  const [animalType, setAnimalType] = useState(defaultAnimal);
  const [age,        setAge]        = useState(2);
  const [weight,     setWeight]     = useState("");
  const [milkingCapacity, setMilkingCapacity] = useState("");
  const [location,   setLocation]   = useState("");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [mlAvailable, setMlAvailable] = useState(true);

  const isDairyAnimal = ["cow", "buffalo", "goat"].includes(animalType);

  async function predict() {
    if (!animalType) { setError("Please select an animal type."); return; }
    if (!weight) { setError("Please enter the weight."); return; }
    if (isDairyAnimal && !milkingCapacity) { setError("Please enter the milking capacity."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const params = new URLSearchParams({ 
        animalType, age, weight, location, 
        ...(isDairyAnimal ? { milkingCapacity } : {}) 
      });
      const res    = await fetch(`/api/ai/predict?${params}`);
      const data   = await res.json();

      if (!res.ok) {
        const err = new Error(data.error || "Prediction failed");
        err.mlUnavailable = res.status === 503;
        throw err;
      }
      setResult(data);
    } catch (err) {
      if (err.mlUnavailable) {
        setMlAvailable(false);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedColor = ANIMAL_OPTIONS.find(a => a.value === animalType)?.color ?? "#febd69";

  return (
    <>
      <style>{`
        .pp-card {
          background: linear-gradient(135deg,#1a1f2e 0%,#232f3e 100%);
          border-radius: 18px;
          padding: 24px;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .pp-card::before {
          content:'';
          position:absolute;
          top:-60px;right:-60px;
          width:200px;height:200px;
          border-radius:50%;
          background:rgba(254,189,105,.07);
          pointer-events:none;
        }
        .pp-title {
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          color: #febd69;
        }
        .pp-animal-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        @media(max-width:480px){ .pp-animal-grid { grid-template-columns: repeat(3, 1fr); } }
        .pp-animal-btn {
          padding: 8px 4px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: rgba(255,255,255,.08);
          color: #ccc;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all .18s;
        }
        .pp-animal-btn:hover { background: rgba(255,255,255,.15); color:#fff; }
        .pp-animal-btn.active { color: #fff; background: rgba(255,255,255,.12); }

        .pp-inputs-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16px 14px; 
          margin-bottom: 16px; 
        }
        .pp-field { display: flex; flex-direction: column; justify-content: flex-end; }
        .pp-field.full-width { grid-column: minmax(auto, 1 / -1); }
        .pp-label { font-size:11px; color:rgba(255,255,255,.55); font-weight:600; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
        .pp-input {
          width:100%;
          padding: 9px 12px;
          border-radius: 9px;
          border: 1.5px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.07);
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color .15s;
          box-sizing: border-box;
        }
        .pp-input:focus { border-color: #febd69; }
        .pp-input::placeholder { color:rgba(255,255,255,.3); }
        .pp-input option { background:#232f3e; color:#fff; }

        .pp-age-row { display:flex; align-items:center; gap:10px; }
        .pp-age-display {
          min-width:40px;text-align:center;font-size:20px;font-weight:800;color:#febd69;
        }
        .pp-age-btn {
          width:30px;height:30px;border-radius:50%;
          border:1.5px solid rgba(255,255,255,.2);
          background:rgba(255,255,255,.1);
          color:#fff;font-size:16px;font-weight:700;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          transition:background .15s;
          flex-shrink:0;
        }
        .pp-age-btn:hover { background:rgba(255,255,255,.2); }
        .pp-age-btn:disabled { opacity:.3;cursor:not-allowed; }

        .pp-cities { display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }
        .pp-city-chip {
          background:rgba(255,255,255,.08);
          color:#bbb;
          border:1px solid rgba(255,255,255,.12);
          border-radius:999px;
          padding:3px 9px;
          font-size:11px;
          cursor:pointer;
          transition:all .15s;
        }
        .pp-city-chip:hover { background:rgba(254,189,105,.2); color:#febd69; border-color:#febd69; }

        .pp-predict-btn {
          width:100%;
          padding:11px;
          border-radius:10px;
          border:none;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          transition:transform .15s, opacity .15s;
          margin-top:4px;
          background:linear-gradient(135deg,#febd69,#e88c0a);
          color:#1a202c;
        }
        .pp-predict-btn:hover:not(:disabled) { transform:translateY(-1px); opacity:.92; }
        .pp-predict-btn:disabled { opacity:.5; cursor:not-allowed; }

        .pp-error { color:#fc8181; font-size:12px; margin-top:8px; text-align:center; }
        .pp-coming-soon {
          margin: 10px 0 0;
          padding: 14px;
          border-radius: 12px;
          background: rgba(254,189,105,.1);
          border: 1.5px solid rgba(254,189,105,.28);
          color: #febd69;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }

        /* Result panel */
        .pp-result {
          margin-top:16px;
          background:rgba(255,255,255,.06);
          border:1.5px solid rgba(254,189,105,.3);
          border-radius:14px;
          padding:16px;
          animation:ppFadeIn .3s ease;
        }
        @keyframes ppFadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        .pp-result-price {
          font-size:32px;
          font-weight:800;
          color:#febd69;
          text-align:center;
          letter-spacing:-.03em;
        }
        .pp-result-label {
          text-align:center;
          font-size:11px;
          color:rgba(255,255,255,.5);
          margin-top:2px;
          text-transform:uppercase;
          letter-spacing:.08em;
        }
        .pp-result-range {
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-top:12px;
          background:rgba(255,255,255,.05);
          border-radius:8px;
          padding:8px 12px;
          font-size:12.5px;
        }
        .pp-result-range span { color:rgba(255,255,255,.5); }
        .pp-result-range strong { color:#fff;font-weight:600; }
        .pp-use-btn {
          width:100%;margin-top:12px;padding:9px;border-radius:9px;
          border:1.5px solid rgba(254,189,105,.5);
          background:transparent;
          color:#febd69;font-size:13px;font-weight:600;cursor:pointer;
          transition:background .15s;
        }
        .pp-use-btn:hover { background:rgba(254,189,105,.1); }

        /* Skeleton shimmer */
        .pp-skeleton {
          background:linear-gradient(90deg,rgba(255,255,255,.06) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.06) 75%);
          background-size:400% 100%;
          animation:ppShimmer 1.2s infinite;
          border-radius:8px;
          height:60px;
          margin-top:16px;
        }
        @keyframes ppShimmer {
          0%{background-position:200% 0;}
          100%{background-position:-200% 0;}
        }
      `}</style>

      <div className="pp-card">
        <p className="pp-title">
          <span style={{ fontSize: 20 }}>🧠</span>
          AI Price Predictor
        </p>

        {!mlAvailable && (
          <p className="pp-coming-soon">Estimated price feature coming soon</p>
        )}

        {mlAvailable && (
          <>
        {/* Animal selector */}
        <div>
          <p className="pp-label">Animal Type</p>
          <div className="pp-animal-grid">
            {ANIMAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`pp-animal-btn${animalType === opt.value ? " active" : ""}`}
                style={animalType === opt.value ? { borderColor: opt.color, color: opt.color } : {}}
                onClick={() => setAnimalType(opt.value)}
              >
                {opt.label.split(" ")[1]}<br />
                <span style={{ fontSize: 10 }}>{opt.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="pp-inputs-grid">
          {/* Age stepper */}
          <div className="pp-field">
            <p className="pp-label">Age (years)</p>
            <div className="pp-age-row">
              <button
                className="pp-age-btn"
                onClick={() => setAge(a => Math.max(0.5, a - 0.5))}
                disabled={age <= 0.5}
              >−</button>
              <span className="pp-age-display">{age}</span>
              <button
                className="pp-age-btn"
                onClick={() => setAge(a => Math.min(20, a + 0.5))}
                disabled={age >= 20}
              >+</button>
            </div>
          </div>

          {/* Weight */}
          <div className="pp-field">
            <p className="pp-label">Weight (kg)</p>
            <input
              type="number"
              className="pp-input"
              placeholder="e.g. 50"
              value={weight}
              onChange={e => setWeight(e.target.value)}
            />
          </div>

          {/* Milking Capacity (Show only for dairy animals) */}
          {isDairyAnimal && (
            <div className="pp-field">
              <p className="pp-label">Milk (L/day)</p>
              <input
                type="number"
                className="pp-input"
                placeholder="e.g. 10"
                value={milkingCapacity}
                onChange={e => setMilkingCapacity(e.target.value)}
              />
            </div>
          )}

          {/* Location */}
          <div className={`pp-field ${isDairyAnimal ? "" : "full-width"}`}>
            <p className="pp-label">Location (city)</p>
            <input
              className="pp-input"
              placeholder="e.g. Hyderabad"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* City shortcuts */}
        <div className="pp-cities">
          {CITY_SUGGESTIONS.slice(0, 7).map(city => (
            <button key={city} className="pp-city-chip" onClick={() => setLocation(city)}>
              {city}
            </button>
          ))}
        </div>

        {/* Predict button */}
        <button
          className="pp-predict-btn"
          id="predict-price-btn"
          style={{ marginTop: 14 }}
          onClick={predict}
          disabled={loading || !animalType}
        >
          {loading ? "🤖 Predicting…" : "✨ Predict Fair Price"}
        </button>

        {error && <p className="pp-error">⚠️ {error}</p>}

        {/* Loading skeleton */}
        {loading && <div className="pp-skeleton" />}

        {/* Result */}
        {result && !loading && (
          <div className="pp-result">
            <p className="pp-result-price">{fmt(result.predicted_price)}</p>
            <p className="pp-result-label">Recommended Fair Price</p>

            <div className="pp-result-range">
              <div>
                <span>Low estimate</span><br />
                <strong>{fmt(result.range_low)}</strong>
              </div>
              <div style={{ color: "rgba(255,255,255,.25)", fontSize: 20 }}>—</div>
              <div style={{ textAlign: "right" }}>
                <span>High estimate</span><br />
                <strong>{fmt(result.range_high)}</strong>
              </div>
            </div>

            {onUseSuggestion && (
              <button
                className="pp-use-btn"
                onClick={() => onUseSuggestion(result.predicted_price)}
                id="use-predicted-price-btn"
              >
                ↑ Use this price in listing
              </button>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
