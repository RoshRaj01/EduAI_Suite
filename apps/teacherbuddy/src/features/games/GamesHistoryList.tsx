import React, { useEffect, useState } from "react";
import { GlassCard } from "../../shared/components/GlassCard";
import { Trash2, Play, History, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface GameSession {
  id: string | number;
  type: "chain-answer" | "wordcloud" | "quiz";
  title: string;
  status: string;
  created_at?: string;
  session_id?: string;
  pin?: string;
}

interface GamesHistoryListProps {
  onRejoinGame: (type: string, id: number | string, sessionId: string) => void;
}

export const GamesHistoryList: React.FC<GamesHistoryListProps> = ({ onRejoinGame }) => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const results: GameSession[] = [];

      // Fetch Chain Answer games
      try {
        const caRes = await fetch(`${API_BASE_URL}/games/chain-answer`);
        if (caRes.ok) {
          const caData = await caRes.json();
          caData.forEach((game: any) => {
            results.push({
              id: game.id,
              type: "chain-answer",
              title: game.name || "Chain Answer Game",
              status: game.status,
              session_id: game.session_id,
            });
          });
        }
      } catch (err) {
        console.warn("Could not fetch Chain Answer games", err);
      }

      // Fetch Word Cloud sessions
      try {
        const wcRes = await fetch(`${API_BASE_URL}/wordcloud/`);
        if (wcRes.ok) {
          const wcData = await wcRes.json();
          wcData.forEach((game: any) => {
            results.push({
              id: game.pin, // using pin as id for deletion
              type: "wordcloud",
              title: game.prompt || "Word Cloud Session",
              status: game.status,
              pin: game.pin,
            });
          });
        }
      } catch (err) {
        console.warn("Could not fetch Word Cloud sessions", err);
      }

      // Fetch Quiz sessions
      try {
        const qRes = await fetch(`${API_BASE_URL}/quizzes/sessions`);
        if (qRes.ok) {
          const qData = await qRes.json();
          qData.forEach((game: any) => {
            results.push({
              id: game.pin,
              type: "quiz",
              title: game.quiz_title || "Quiz Session",
              status: game.status,
              pin: game.pin,
            });
          });
        }
      } catch (err) {
        console.warn("Could not fetch Quiz sessions", err);
      }

      setSessions(results);
    } catch (err) {
      setError("Failed to load game history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (type: string, id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this game session?")) return;

    try {
      let endpoint = "";
      if (type === "chain-answer") {
        endpoint = `${API_BASE_URL}/games/chain-answer/${id}`;
      } else if (type === "wordcloud") {
        endpoint = `${API_BASE_URL}/wordcloud/${id}`;
      } else if (type === "quiz") {
        endpoint = `${API_BASE_URL}/quizzes/sessions/${id}`;
      }

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id || s.type !== type));
      } else {
        alert("Failed to delete game session.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting game session.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-8" style={{ color: "var(--color-text-secondary)" }}>
        <History size={48} className="mx-auto mb-4 opacity-50" />
        <p>No active or past games found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session, idx) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          key={`${session.type}-${session.id}`}
        >
          <GlassCard className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
                  {session.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    session.status === "active" || session.status === "lobby"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {session.status.toUpperCase()}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {session.type.replace("-", " ").toUpperCase()}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {session.session_id && `Session ID: ${session.session_id}`}
                {session.pin && `PIN: ${session.pin}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onRejoinGame(session.type, session.id, session.session_id || session.pin || "")}
                className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors flex items-center gap-1 text-sm font-semibold"
              >
                <Play size={16} /> Open
              </button>
              <button
                onClick={() => handleDelete(session.type, session.id)}
                className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                title="Delete Game"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};
