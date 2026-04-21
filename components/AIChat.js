"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Markdown-lite: bold between ** ** ─────────────────── */
function Md({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/* ─── Typing indicator ──────────────────────────────────── */
function TypingDots() {
  return (
    <div className="ai-typing">
      <span /><span /><span />
    </div>
  );
}

/* ─── Single mini listing card ──────────────────────────── */
function MiniCard({ item }) {
  return (
    <Link href={`/listing/${item._id}`} className="ai-mini-card">
      <div className="ai-mini-card-img">
        <Image
          src={item.images?.[0] || "https://placehold.co/80x60"}
          alt={item.title}
          width={80}
          height={60}
          unoptimized
          className="w-full h-full object-cover"
        />
      </div>
      <div className="ai-mini-card-body">
        <p className="ai-mini-card-title">{item.title}</p>
        <p className="ai-mini-card-price">₹{Number(item.price).toLocaleString()}</p>
        {item.location?.address && (
          <p className="ai-mini-card-loc">📍 {item.location.address}</p>
        )}
      </div>
    </Link>
  );
}

/* ─── QUICK SUGGESTIONS ─────────────────────────────────── */
const DEFAULT_SUGGESTIONS = [
  "Buffalo under ₹50,000",
  "Cheap goat near Hyderabad",
  "Sheep between ₹10k and ₹30k",
  "Young cow for sale",
];

/* ─── MAIN COMPONENT ────────────────────────────────────── */
export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Hi! I'm your **AI livestock assistant**. Ask me anything like:\n\n*\"Show buffalo under 50k near Hyderabad\"*",
      listings: [],
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Focus input on open */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  /* Send message */
  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply || "Here's what I found:",
          listings: data.listings || [],
          suggestions: data.suggestions || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Network error. Please try again.", listings: [], suggestions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        /* FAB */
        .ai-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #232f3e 0%, #e88c0a 100%);
          box-shadow: 0 8px 32px rgba(232,140,10,.45), 0 2px 8px rgba(0,0,0,.25);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: transform .2s, box-shadow .2s;
        }
        .ai-fab:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(232,140,10,.55); }
        .ai-fab-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #e53e3e;
          color: #fff;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }

        /* Panel */
        .ai-panel {
          position: fixed;
          bottom: 92px;
          right: 24px;
          z-index: 999;
          width: 360px;
          max-height: 580px;
          border-radius: 20px;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(24px);
          box-shadow: 0 24px 80px rgba(0,0,0,.22), 0 4px 16px rgba(0,0,0,.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: aiSlideUp .25s cubic-bezier(.22,.68,0,1.2) both;
        }
        @keyframes aiSlideUp {
          from { opacity:0; transform:translateY(24px) scale(.96); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        @media(max-width:420px){
          .ai-panel { width:calc(100vw - 16px); right:8px; bottom:84px; }
        }

        /* Header */
        .ai-header {
          background: linear-gradient(135deg, #232f3e 0%, #37475a 100%);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ai-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg,#febd69,#e88c0a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .ai-header-info { flex:1; }
        .ai-header-name { color:#fff; font-weight:700; font-size:14px; }
        .ai-header-status { display:flex; align-items:center; gap:4px; margin-top:2px; }
        .ai-status-dot { width:7px;height:7px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:.5;} }
        .ai-header-status span { color:rgba(255,255,255,.7);font-size:11px; }
        .ai-close-btn {
          background:rgba(255,255,255,.15);
          border:none;
          border-radius:8px;
          width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
          color:#fff;
          font-size:14px;
          transition:background .15s;
        }
        .ai-close-btn:hover { background:rgba(255,255,255,.25); }

        /* Messages */
        .ai-messages {
          flex:1;
          overflow-y:auto;
          padding:14px;
          display:flex;
          flex-direction:column;
          gap:12px;
          scroll-behavior:smooth;
        }
        .ai-messages::-webkit-scrollbar { width:4px; }
        .ai-messages::-webkit-scrollbar-track { background:transparent; }
        .ai-messages::-webkit-scrollbar-thumb { background:#ddd;border-radius:4px; }

        /* Bubble */
        .ai-bubble-row { display:flex; align-items:flex-end; gap:8px; }
        .ai-bubble-row.user { flex-direction:row-reverse; }
        .ai-bubble-avatar {
          width:26px;height:26px;
          border-radius:50%;
          background:linear-gradient(135deg,#febd69,#e88c0a);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;
          flex-shrink:0;
        }
        .ai-bubble {
          max-width:76%;
          padding:10px 13px;
          border-radius:16px;
          font-size:13.5px;
          line-height:1.5;
          animation:bubblePop .2s ease both;
        }
        @keyframes bubblePop { from{opacity:0;transform:scale(.95);}to{opacity:1;transform:scale(1);} }
        .ai-bubble.bot {
          background:#f0f4f8;
          color:#1a202c;
          border-bottom-left-radius:4px;
        }
        .ai-bubble.user {
          background:linear-gradient(135deg,#232f3e,#37475a);
          color:#fff;
          border-bottom-right-radius:4px;
        }

        /* Listing cards in bot messages */
        .ai-listings-grid {
          display:flex;
          flex-direction:column;
          gap:6px;
          margin-top:8px;
        }
        .ai-mini-card {
          display:flex;
          gap:8px;
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:10px;
          padding:7px;
          text-decoration:none;
          transition:box-shadow .15s, transform .15s;
          cursor:pointer;
        }
        .ai-mini-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1);transform:translateY(-1px); }
        .ai-mini-card-img {
          width:60px;height:48px;border-radius:6px;overflow:hidden;flex-shrink:0;background:#f3f4f6;
        }
        .ai-mini-card-body { flex:1;min-width:0; }
        .ai-mini-card-title {
          font-size:12px;font-weight:600;color:#1a202c;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .ai-mini-card-price { font-size:13px;font-weight:700;color:#007600;margin-top:2px; }
        .ai-mini-card-loc { font-size:10.5px;color:#718096;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }

        /* Suggestions */
        .ai-suggestions {
          display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;
        }
        .ai-suggestion-chip {
          background:#fff;
          border:1px solid #febd69;
          color:#7c5a00;
          border-radius:999px;
          padding:4px 10px;
          font-size:11.5px;
          font-weight:500;
          cursor:pointer;
          transition:background .15s,color .15s;
          white-space:nowrap;
        }
        .ai-suggestion-chip:hover { background:#febd69;color:#1a202c; }

        /* Typing */
        .ai-typing {
          display:flex;gap:4px;align-items:center;padding:2px 0;
        }
        .ai-typing span {
          width:7px;height:7px;border-radius:50%;background:#aaa;
          animation:typingBounce 1.2s infinite;
        }
        .ai-typing span:nth-child(2){animation-delay:.2s;}
        .ai-typing span:nth-child(3){animation-delay:.4s;}
        @keyframes typingBounce { 0%,80%,100%{transform:scale(.8);opacity:.6;}40%{transform:scale(1.1);opacity:1;} }

        /* Input bar */
        .ai-input-bar {
          padding:10px 12px;
          border-top:1px solid #e2e8f0;
          background:#f8fafc;
          display:flex;
          gap:8px;
          align-items:center;
        }
        .ai-input {
          flex:1;
          border:1.5px solid #e2e8f0;
          border-radius:999px;
          padding:8px 14px;
          font-size:13px;
          background:#fff;
          outline:none;
          transition:border-color .15s;
          color:#1a202c;
        }
        .ai-input:focus { border-color:#febd69; }
        .ai-input::placeholder { color:#a0aec0; }
        .ai-send-btn {
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#232f3e,#e88c0a);
          border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:16px;
          transition:transform .15s,opacity .15s;
          flex-shrink:0;
        }
        .ai-send-btn:disabled { opacity:.5;cursor:not-allowed; }
        .ai-send-btn:not(:disabled):hover { transform:scale(1.08); }

        /* Footer label */
        .ai-footer-label {
          text-align:center;
          font-size:10px;
          color:#a0aec0;
          padding:4px 0 6px;
        }
      `}</style>

      {/* ── Floating action button ──────────────────────────── */}
      <button
        className="ai-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI Chat"
        id="ai-chat-fab"
      >
        {open ? "✕" : "🤖"}
        {!open && <span className="ai-fab-badge">AI</span>}
      </button>

      {/* ── Chat Panel ─────────────────────────────────────── */}
      {open && (
        <div className="ai-panel" role="dialog" aria-label="AI Chat Assistant">
          {/* Header */}
          <div className="ai-header">
            <div className="ai-avatar">🤖</div>
            <div className="ai-header-info">
              <p className="ai-header-name">Livestock AI Assistant</p>
              <div className="ai-header-status">
                <span className="ai-status-dot" />
                <span>Online · Rule-based search</span>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="ai-messages" id="ai-messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-bubble-row ${msg.role}`}>
                {msg.role === "bot" && <div className="ai-bubble-avatar">🤖</div>}

                <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div className={`ai-bubble ${msg.role}`}>
                    <Md text={msg.text} />
                  </div>

                  {/* Listing cards */}
                  {msg.listings?.length > 0 && (
                    <div className="ai-listings-grid" style={{ width: "100%", marginTop: 6 }}>
                      {msg.listings.map((item) => (
                        <MiniCard key={item._id} item={item} />
                      ))}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {msg.suggestions?.length > 0 && (
                    <div className="ai-suggestions">
                      {msg.suggestions.map((s, si) => (
                        <button
                          key={si}
                          className="ai-suggestion-chip"
                          onClick={() => send(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="ai-bubble-row">
                <div className="ai-bubble-avatar">🤖</div>
                <div className="ai-bubble bot">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="ai-input-bar">
            <input
              ref={inputRef}
              className="ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. goat under 30k near Pune…"
              disabled={loading}
              id="ai-chat-input"
            />
            <button
              className="ai-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              id="ai-chat-send"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>

          <p className="ai-footer-label">Powered by Livestock AI · Rule-based</p>
        </div>
      )}
    </>
  );
}
