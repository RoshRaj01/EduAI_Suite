import React, { useState, useEffect } from "react";
import type { ChainGameState, ChainGameActions } from "./types";
import { GlassCard } from "../../shared/components/GlassCard";
import { useGameSync } from "./useGameSync";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertCircle, Send, Wifi, WifiOff } from "lucide-react";

interface ChainGameBoardProps {
  gameState?: ChainGameState;
  actions?: ChainGameActions;
  currentPlayerId?: string;
  // For real-time sync mode
  gameId?: number;
  sessionId?: string;
  playerId?: string;
  playerName?: string;
  userType?: "teacher" | "student";
}

export const ChainGameBoard: React.FC<ChainGameBoardProps> = ({
  gameState: propsGameState,
  actions: propsActions,
  currentPlayerId: propsCurrentPlayerId,
  gameId,
  sessionId,
  playerId,
  playerName,
  userType = "teacher",
}) => {
  const [inputWord, setInputWord] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [syncedGameState, setSyncedGameState] = useState<any>(null);

  // Use WebSocket sync if sessionId is provided
  const { 
    isConnected, 
    gameState: wsGameState, 
    submitWord, 
    startGame, 
    endGame 
  } = useGameSync({
    sessionId: sessionId || "",
    gameId: gameId || 0,
    playerId: playerId || "",
    userType,
    onGameUpdate: (message) => {
      if (message.type === "initial_state") {
        setSyncedGameState(message);
      } else if (message.type === "word_submitted") {
        // Refresh game state
        setSyncedGameState(prev => ({
          ...prev,
          chain: [...(prev?.chain || []), message.word],
        }));
      } else if (message.type === "game_started") {
        setSyncedGameState(prev => ({
          ...prev,
          game: { ...prev?.game, status: "active" },
        }));
      } else if (message.type === "game_ended") {
        setSyncedGameState(prev => ({
          ...prev,
          game: { ...prev?.game, status: "completed" },
        }));
      }
    },
  });

  // Use either synced state (real-time) or props state (local)
  const gameState = wsGameState || syncedGameState || propsGameState;
  const actions = propsActions;
  const currentPlayerId = playerId || propsCurrentPlayerId;

  useEffect(() => {
    if (gameState?.gameStatus === "active" || gameState?.game?.status === "active") {
      setStartTime(Date.now());
    }
  }, [gameState?.currentPlayerIndex, gameState?.gameStatus, gameState?.game?.status]);

  if (!gameState) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <WifiOff size={20} style={{ color: "var(--color-error)" }} />
          <p style={{ color: "var(--color-text-primary)" }} className="font-semibold">
            Loading game...
          </p>
        </div>
      </GlassCard>
    );
  }

  const currentPlayer = gameState.players?.[gameState.currentPlayerIndex] || 
                        gameState.players?.[0];
  const isCurrentPlayerTurn = currentPlayerId === currentPlayer?.id;
  const lastWord =
    gameState.chain?.length > 0
      ? gameState.chain[gameState.chain.length - 1].word
      : gameState.starting_word || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlayerId || !inputWord.trim()) return;

    const responseTime = startTime ? (Date.now() - startTime) / 1000 : 0;

    try {
      if (sessionId && playerId) {
        // Real-time mode: use WebSocket
        submitWord(inputWord);
      } else if (actions) {
        // Local mode: use state actions
        const success = await actions.submitWord(
          currentPlayerId,
          inputWord,
          responseTime
        );
        if (success) {
          setInputWord("");
          setStartTime(Date.now());
        }
      }
      setInputWord("");
      setStartTime(Date.now());
    } catch (error) {
      console.error("Error submitting word:", error);
    }
  };

  const gameName = gameState.name || gameState.game?.name || "Chain Answer Game";
  const gameStatus = gameState.gameStatus || gameState.game?.status || "active";

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-3xl font-bold font-display"
            style={{ color: "var(--color-text-primary)" }}
          >
            {gameName}
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {sessionId ? `Session: ${sessionId}` : "Local Game"}
          </p>
        </div>
        <div className="text-right space-y-2">
          {sessionId && (
            <div className="flex items-center justify-end gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi size={16} style={{ color: "#10b981" }} />
                  <span style={{ color: "#10b981" }}>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} style={{ color: "var(--color-error)" }} />
                  <span style={{ color: "var(--color-error)" }}>Offline (Polling)</span>
                </>
              )}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 text-lg font-bold">
            <Clock size={24} />
            <span
              className={gameState.timer < 5 ? "text-red-500" : ""}
              style={{
                color:
                  gameState.timer < 5
                    ? "var(--color-status-danger)"
                    : "var(--color-text-primary)",
              }}
            >
              {gameState.timer || "30"}s
            </span>
          </div>
        </div>
      </div>

      {/* Current Word Display */}
      <GlassCard className="p-12 text-center border-2 border-blue-500/50">
        <p
          style={{ color: "var(--color-text-secondary)" }}
          className="text-sm uppercase mb-4"
        >
          Current Word
        </p>
        <h2
          className="text-6xl font-bold font-display"
          style={{ color: "var(--color-brand-blue)" }}
        >
          {lastWord}
        </h2>
        <p
          style={{ color: "var(--color-text-secondary)" }}
          className="mt-4 text-sm"
        >
          Next word must start with:{" "}
          <strong style={{ fontSize: "1.2em" }}>
            {lastWord ? lastWord.charAt(lastWord.length - 1).toUpperCase() : "?"}
          </strong>
        </p>
      </GlassCard>

      {/* Current Player Indicator */}
      <div className="text-center">
        <GlassCard className="inline-block px-6 py-3">
          <p
            style={{ color: "var(--color-text-secondary)" }}
            className="text-sm"
          >
            Current Player
          </p>
          <p
            className={`text-xl font-bold ${
              isCurrentPlayerTurn ? "text-green-500" : "text-gray-500"
            }`}
            style={{
              color: isCurrentPlayerTurn
                ? "var(--color-status-success)"
                : "var(--color-text-secondary)",
            }}
          >
            {currentPlayer?.name || "Waiting..."}
          </p>
        </GlassCard>
      </div>

      {/* Word Input */}
      <AnimatePresence>
        {isCurrentPlayerTurn && gameState.gameStatus === "active" && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="flex gap-3"
          >
            <input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder={`Enter a word starting with "${lastWord ? lastWord.charAt(lastWord.length - 1).toUpperCase() : "?"}"`}
              className="flex-1 px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputWord.trim()}
              className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-brand-blue), #3460c4)",
                color: "white",
              }}
            >
              <Send size={18} />
              Submit
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {gameState.errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 p-4 rounded-lg text-red-500"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderLeft: "4px solid var(--color-status-danger)",
            }}
          >
            <AlertCircle size={20} className="flex-shrink-0" />
            <p>{gameState.errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chain Display */}
      <GlassCard className="p-6">
        <h3
          style={{ color: "var(--color-text-primary)" }}
          className="font-bold mb-4"
        >
          Word Chain ({gameState.chain.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {gameState.chain.map((word, index) => (
            <motion.div
              key={word.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-2 rounded-full text-sm font-semibold"
              style={{
                background:
                  index === gameState.chain.length - 1
                    ? "var(--color-brand-blue)"
                    : "var(--color-bg-tertiary)",
                color:
                  index === gameState.chain.length - 1
                    ? "white"
                    : "var(--color-text-primary)",
              }}
            >
              {word.word}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Scoreboard */}
      <GlassCard className="p-6">
        <h3
          style={{ color: "var(--color-text-primary)" }}
          className="font-bold mb-4"
        >
          Scores
        </h3>
        <div className="space-y-2">
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className="flex justify-between items-center p-3 rounded-lg"
              style={{
                background:
                  index === gameState.currentPlayerIndex
                    ? "var(--color-bg-tertiary)"
                    : "transparent",
              }}
            >
              <span
                style={{ color: "var(--color-text-primary)" }}
                className="font-semibold"
              >
                {player.name}
              </span>
              <div className="flex gap-4">
                <span style={{ color: "var(--color-text-secondary)" }}>
                  Words: {player.wordsValid}/{player.wordsSubmitted}
                </span>
                <span
                  className="font-bold"
                  style={{ color: "var(--color-brand-gold)" }}
                >
                  {player.score} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
