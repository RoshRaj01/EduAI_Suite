import React, { useState, useEffect, useMemo } from "react";
import { GlassCard } from "../../shared/components/GlassCard";
import { BarChart, Share2, ArrowLeft } from "lucide-react";

interface WordData {
  text: string;
  value: number;
}

interface WordCloudHostProps {
  onBack?: () => void;
  initialPin?: string;
}

/* ── Custom CSS Word Cloud ────────────────────────────────── */
const CLOUD_COLORS = ["#264796", "#2a4fa7", "#d0ae61", "#ddb867", "#16a34a", "#7c3aed", "#dc2626", "#0891b2"];

const SimpleWordCloud: React.FC<{ words: WordData[] }> = ({ words }) => {
  const maxValue = Math.max(...words.map(w => w.value), 1);

  // Deterministic rotation from word text
  const hashRotation = (text: string) => {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    const bucket = Math.abs(h) % 10;
    if (bucket < 6) return 0;
    return bucket < 8 ? 12 : -12;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 p-6 w-full h-full content-center">
      {words.map((word, i) => {
        const ratio = maxValue <= 1 ? 1 : word.value / maxValue;
        const fontSize = 18 + ratio * 46;
        const color = CLOUD_COLORS[i % CLOUD_COLORS.length];
        const rotation = hashRotation(word.text);

        return (
          <span
            key={word.text}
            className="inline-block transition-all duration-500 ease-out select-none"
            style={{
              fontSize: `${fontSize}px`,
              color,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              fontStyle: "italic",
              transform: `rotate(${rotation}deg)`,
              opacity: 0.85 + ratio * 0.15,
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};

/* ── Host Component ───────────────────────────────────────── */
export const WordCloudHostComponent: React.FC<WordCloudHostProps> = ({ onBack, initialPin }) => {
  const [prompt, setPrompt] = useState("");
  const [pin, setPin] = useState<string | null>(initialPin || null);
  const [words, setWords] = useState<WordData[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const startSession = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/wordcloud/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (response.ok) {
        const data = await response.json();
        setPin(data.pin);
      }
    } catch (e) {
      console.error("Failed to start session", e);
    }
  };

  useEffect(() => {
    if (!pin) return;

    let isCancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // If we joined an existing session without a prompt, fetch it
    if (!prompt) {
      fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/wordcloud/${pin}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.prompt && !isCancelled) {
            setPrompt(data.prompt);
          }
        })
        .catch(e => console.error("Failed to fetch session info", e));
    }

    const connect = () => {
      if (isCancelled) return;

      ws = new WebSocket(`${(import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`).replace(/^http/, "ws")}/ws/wordcloud/${pin}?role=teacher`);

      ws.onopen = () => {
        if (isCancelled) {
          ws?.close();
          return;
        }
        console.log("[WordCloud] Teacher WebSocket connected");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const message = JSON.parse(event.data);
          console.log("[WordCloud] Received message:", message);
          if (message.type === "cloud_update") {
            setWords(message.words || []);
          }
        } catch (e) {
          console.error("[WordCloud] Failed to parse message", e);
        }
      };

      ws.onerror = (err) => {
        console.error("[WordCloud] WebSocket error", err);
      };

      ws.onclose = () => {
        if (!isCancelled) {
          console.log("[WordCloud] Connection lost, reconnecting in 2s...");
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }
    };
  }, [pin]);

  const endSession = async () => {
    if (!pin) return;
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "end_session" }));
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/wordcloud/${pin}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPin(null);
        if (onBack) onBack();
      }
    } catch (e) {
      console.error("Failed to end session", e);
    }
  };

  if (!pin) {
    return (
      <div className="space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70 mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft size={16} /> Back to Games
          </button>
        )}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4 font-display" style={{ color: "var(--color-text-primary)" }}>
            Host Live Word Cloud Battle
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                What question would you like to ask your students?
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Describe the Renaissance in one word"
                className="w-full px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
              />
            </div>
            <button
              onClick={startSession}
              disabled={!prompt.trim()}
              className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "var(--color-brand-blue)" }}
            >
              Start Word Cloud Session
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

return (
  <div className="space-y-4">
    {onBack && (
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70 mb-4"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft size={16} /> Back to Games
      </button>
    )}
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>
            {prompt}
          </h2>
          <p className="text-lg mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Join at <strong>edugames.app</strong> with PIN: <span className="font-mono text-xl text-blue-500 font-bold tracking-widest">{pin}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
            <Share2 size={20} />
          </button>
          <button 
            onClick={endSession}
            className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors font-semibold"
          >
            End Session
          </button>
        </div>
      </div>

      <div className="w-full h-96 flex items-center justify-center rounded-xl bg-gray-50/50">
        {words.length === 0 ? (
          <div className="text-center" style={{ color: "var(--color-text-secondary)" }}>
            <BarChart size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Waiting for responses...</p>
          </div>
        ) : (
          <SimpleWordCloud words={words} />
        )}
      </div>
    </GlassCard>
  </div>
);
};
