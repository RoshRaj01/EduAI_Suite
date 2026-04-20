import React, { useState } from "react";
import { GlassCard } from "../../shared/components/GlassCard";
import { ChainGameBoard } from "./ChainGameBoard";
import { useChainGameState } from "./useChainGameState";
import { ChainVariation } from "./ChainAnswerTypes";
import { motion } from "framer-motion";
import { Play, Plus, Trash2, Users } from "lucide-react";

interface PlayerSetup {
  id: string;
  name: string;
}

export const ChainAnswerGamePage: React.FC = () => {
  try {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameConfig, setGameConfig] = useState({
      name: "New Game",
      chainVariation: "standard" as ChainVariation,
      category: "",
      difficulty: "medium" as "easy" | "medium" | "hard",
      language: "en",
      startingWord: "Apple",
    });
    const [players, setPlayers] = useState<PlayerSetup[]>([
      { id: "1", name: "Student 1" },
      { id: "2", name: "Student 2" },
    ]);
    const [newPlayerName, setNewPlayerName] = useState("");

    const [gameState, actions] = useChainGameState();

    const handleStartGame = () => {
      actions.initializeGame("session_1", gameConfig);
      players.forEach((player) => {
        actions.addPlayer(player.id, player.name);
      });
      actions.startGame();
      setGameStarted(true);
    };

    const handleAddPlayer = () => {
      if (newPlayerName.trim()) {
        setPlayers([
          ...players,
          { id: `player_${Date.now()}`, name: newPlayerName },
        ]);
        setNewPlayerName("");
      }
    };

    const handleRemovePlayer = (id: string) => {
      setPlayers(players.filter((p) => p.id !== id));
    };

    // Show game board if started
    if (gameStarted && gameState.gameStatus !== "completed") {
      return (
        <ChainGameBoard
          gameState={gameState}
          actions={actions}
          currentPlayerId={gameState.players[gameState.currentPlayerIndex]?.id}
        />
      );
    }

    // Show setup page
    return (
      <div className="space-y-8">
        <div>
          <h1
            className="text-4xl font-bold font-display"
            style={{ color: "var(--color-text-primary)" }}
          >
            Chain Answer Game Setup
          </h1>
        <p style={{ color: "var(--color-text-secondary)" }} className="mt-2">
          Configure your game and invite students to play
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Game Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: "var(--color-text-primary)" }}
            >
              Game Configuration
            </h2>

            {/* Game Name */}
            <div className="mb-6">
              <label
                style={{ color: "var(--color-text-secondary)" }}
                className="block text-sm font-semibold mb-2"
              >
                Game Name
              </label>
              <input
                type="text"
                value={gameConfig.name}
                onChange={(e) =>
                  setGameConfig({ ...gameConfig, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* Chain Variation */}
            <div className="mb-6">
              <label
                style={{ color: "var(--color-text-secondary)" }}
                className="block text-sm font-semibold mb-2"
              >
                Chain Variation
              </label>
              <select
                value={gameConfig.chainVariation}
                onChange={(e) =>
                  setGameConfig({
                    ...gameConfig,
                    chainVariation: e.target.value as ChainVariation,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
              >
                <option value="standard">
                  Standard (Last letter → First letter)
                </option>
                <option value="category">
                  Category (Animals, Objects, etc.)
                </option>
                <option value="ladder">Word Ladder (Change one letter)</option>
                <option value="compound">Compound (Overlapping words)</option>
                <option value="geography">Geography (Cities/Countries)</option>
              </select>
            </div>

            {/* Category */}
            {gameConfig.chainVariation === "category" && (
              <div className="mb-6">
                <label
                  style={{ color: "var(--color-text-secondary)" }}
                  className="block text-sm font-semibold mb-2"
                >
                  Category
                </label>
                <select
                  value={gameConfig.category}
                  onChange={(e) =>
                    setGameConfig({ ...gameConfig, category: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="">Select a category</option>
                  <option value="animals">Animals</option>
                  <option value="objects">Objects</option>
                  <option value="fruits">Fruits</option>
                  <option value="colors">Colors</option>
                </select>
              </div>
            )}

            {/* Difficulty */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label
                  style={{ color: "var(--color-text-secondary)" }}
                  className="block text-sm font-semibold mb-2"
                >
                  Difficulty
                </label>
                <select
                  value={gameConfig.difficulty}
                  onChange={(e) =>
                    setGameConfig({
                      ...gameConfig,
                      difficulty: e.target.value as "easy" | "medium" | "hard",
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Starting Word */}
              <div>
                <label
                  style={{ color: "var(--color-text-secondary)" }}
                  className="block text-sm font-semibold mb-2"
                >
                  Starting Word
                </label>
                <input
                  type="text"
                  value={gameConfig.startingWord}
                  onChange={(e) =>
                    setGameConfig({
                      ...gameConfig,
                      startingWord: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Player Setup */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h2
              className="text-xl font-bold mb-6 flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Users size={20} />
              Players
            </h2>

            {/* Add Player */}
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Student name"
                className="flex-1 px-3 py-2 rounded-lg border-2 text-sm focus:outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddPlayer();
                }}
              />
              <button
                onClick={handleAddPlayer}
                className="px-3 py-2 rounded-lg font-semibold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-brand-blue), #3460c4)",
                  color: "white",
                }}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Player List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{
                    background: "var(--color-bg-tertiary)",
                  }}
                >
                  <span
                    style={{ color: "var(--color-text-primary)" }}
                    className="font-semibold"
                  >
                    {player.name}
                  </span>
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="text-red-500 hover:scale-110 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            <p
              style={{ color: "var(--color-text-secondary)" }}
              className="text-sm mt-4"
            >
              Total Players: <strong>{players.length}</strong>
            </p>
          </GlassCard>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 text-white text-lg hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
            style={{
              background:
                players.length >= 2
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "gray",
            }}
          >
            <Play size={24} />
            Start Game
          </motion.button>
        </div>
      </div>
    </div>
      );
  } catch (error) {
    console.error('ChainAnswerGamePage Error:', error);
    return (
      <div style={{ color: 'red', padding: '20px', fontSize: '16px' }}>
        <h2>❌ Error Loading Chain Answer Game</h2>
        <p>{String(error)}</p>
      </div>
    );
  }
};
