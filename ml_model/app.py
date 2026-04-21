"""
FastAPI — Livestock Price Prediction Microservice
Run:  uvicorn app:app --reload --port 8000
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pickle, os, numpy as np

app = FastAPI(title="Livestock Price Predictor", version="1.0.0")

# ── CORS — allow Next.js dev + prod origins ───────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://livestock-marketplace.vercel.app"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Load model once at startup ────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

if not os.path.exists(MODEL_PATH):
    raise RuntimeError("model.pkl not found — run train_model.py first!")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# ── Encodings ─────────────────────────────────────────────────
ANIMAL_MAP = {
    "buffalo": 0,
    "cow":     1,
    "goat":    2,
    "sheep":   3,
    "poultry": 4,
}

# Metro cities → tier 2, small cities → tier 1, rest → tier 0
METRO_CITIES = {
    "mumbai","delhi","bangalore","bengaluru","kolkata","chennai",
    "hyderabad","pune","ahmedabad",
}
SMALL_CITIES = {
    "jaipur","lucknow","surat","kanpur","nagpur","visakhapatnam","bhopal",
    "patna","ludhiana","agra","nashik","vadodara","rajkot","meerut",
    "varanasi","amritsar","allahabad","ranchi","coimbatore","jodhpur",
    "indore","guwahati","chandigarh","kochi","vijayawada","tirupati",
    "warangal","guntur",
}

def location_tier(city: str) -> int:
    c = city.strip().lower()
    if c in METRO_CITIES:   return 2
    if c in SMALL_CITIES:   return 1
    return 0

# ── Price band helper ─────────────────────────────────────────
PRICE_RANGES = {
    0: (30000,  150000),  # buffalo
    1: (20000,  100000),  # cow
    2: (5000,    50000),  # goat
    3: (5000,    40000),  # sheep
    4: (200,      2000),  # poultry
}

# ── Health check ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Livestock Price Predictor is running 🐄"}

# ── Predict endpoint ──────────────────────────────────────────
@app.get("/predict")
def predict(
    animalType:       str = Query(..., description="buffalo | cow | goat | sheep | poultry"),
    age:              float = Query(..., ge=0, le=20, description="Age in years"),
    weight:           float = Query(..., ge=0.5, le=1200, description="Weight in kg"),
    milking_capacity: float = Query(0.0, ge=0, le=50, description="Milking capacity in L/day"),
    location:         str = Query("",  description="City name (optional)"),
):
    animal_key = animalType.strip().lower()
    if animal_key not in ANIMAL_MAP:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown animalType '{animalType}'. Choose from: {list(ANIMAL_MAP.keys())}",
        )

    animal_enc = ANIMAL_MAP[animal_key]
    loc_tier   = location_tier(location) if location else 1

    X = np.array([[animal_enc, age, weight, milking_capacity, loc_tier]])
    raw = model.predict(X)[0]

    # Clamp to realistic price band
    lo, hi = PRICE_RANGES[animal_enc]
    predicted = int(max(lo, min(hi, round(raw / 500) * 500)))  # round to ₹500

    # Confidence band: ±12%
    low  = int(predicted * 0.88)
    high = int(predicted * 1.12)

    # Clamp band too
    low  = max(lo, low)
    high = min(hi, high)

    return {
        "animalType":    animal_key,
        "age":           age,
        "location":      location or "general",
        "location_tier": loc_tier,
        "predicted_price": predicted,
        "range_low":     low,
        "range_high":    high,
        "currency":      "INR",
    }
