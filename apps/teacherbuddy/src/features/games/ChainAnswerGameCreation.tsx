import React, { useState } from "react";
import { GlassCard } from "../../shared/components/GlassCard";
import { motion } from "framer-motion";
import { Play, Plus, Trash2, Users, ArrowLeft, Loader } from "lucide-react";
import { gameAPI } from "../../shared/utils/gameAPI";

type ChainVariation =
  | "standard"
  | "category"
  | "compound"
  | "ladder"
  | "geography";

interface PlayerSetup {
  id: string;
  name: string;
}

interface ChainAnswerGameCreationProps {
  onBack: () => void;
  onGameCreated?: (gameId: number, sessionId: string) => void;
}

export const ChainAnswerGameCreation: React.FC<
  ChainAnswerGameCreationProps
> = ({ onBack, onGameCreated }) => {
  const [gameConfig, setGameConfig] = useState({
    name: "New Game",
    chainVariation: "standard" as ChainVariation,
    category: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    language: "en",
    startingWord: "Apple",
    timePerTurn: 30,
  });

  const [players, setPlayers] = useState<PlayerSetup[]>([
    { id: "1", name: "Student 1" },
    { id: "2", name: "Student 2" },
  ]);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateGame = async () => {
    if (players.length < 2) {
      setError("At least 2 players required to start a game!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the game via backend API
      const gameData = {
        name: gameConfig.name,
        chain_variation: gameConfig.chainVariation,
        category: gameConfig.chainVariation === "category" ? gameConfig.category : undefined,
        difficulty_level: gameConfig.difficulty,
        language: gameConfig.language,
        starting_word: gameConfig.startingWord,
        time_per_turn: gameConfig.timePerTurn,
        penalty_on_invalid: false,
        players: players.map((p) => ({
          student_id: p.id,
          name: p.name,
        })),
      };

      const createdGame = await gameAPI.createGame(gameData);
      
      // Start the game automatically
      await gameAPI.startGame(createdGame.id);

      // Callback to parent
      if (onGameCreated) {
        onGameCreated(createdGame.id, createdGame.session_id);
      } else {
        // Show success message
        alert(`Game created successfully! Session ID: ${createdGame.session_id}`);
        onBack();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create game";
      setError(errorMessage);
      console.error("Error creating game:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["Animals", "Objects", "Countries", "Food", "Sports"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} style={{ color: "var(--color-text-primary)" }} />
        </button>
        <div>
          <h1
            className="text-4xl font-bold font-display"
            style={{ color: "var(--color-text-primary)" }}
          >
            Create Chain Answer Game
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }} className="mt-2">
            Configure your game and invite students to play
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Game Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Name & Basic Settings */}
          <GlassCard className="p-6">
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: "var(--color-text-primary)" }}
            >
              Game Settings
            </h2>

            <div className="space-y-4">
              {/* Game Name */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Game Name
                </label>
                <input
                  type="text"
                  value={gameConfig.name}
                  onChange={(e) =>
                    setGameConfig({ ...gameConfig, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter game name"
                />
              </div>

              {/* Chain Variation */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Chain Rule
                </label>
                <select
                  value={gameConfig.chainVariation}
                  onChange={(e) =>
                    setGameConfig({
                      ...gameConfig,
                      chainVariation: e.target.value as ChainVariation,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="standard">
                    Standard (Last letter → First letter)
                  </option>
                  <option value="category">
                    Category (Animals, Objects, etc.)
                  </option>
                  <option value="compound">
                    Compound (Last 2+ letters match)
                  </option>
                  <option value="ladder">
                    Ladder (Same length, 1 letter change)
                  </option>
                  <option value="geography">
                    Geography (Cities/Countries)
                  </option>
                </select>
              </div>

              {/* Category (if selected) */}
              {gameConfig.chainVariation === "category" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Select Category
                  </label>
                  <select
                    value={gameConfig.category}
                    onChange={(e) =>
                      setGameConfig({ ...gameConfig, category: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Difficulty */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Difficulty
                </label>
                <div className="flex gap-3">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setGameConfig({
                          ...gameConfig,
                          difficulty: level,
                        })
                      }
                      className={`px-5 py-3 rounded-lg font-semibold transition-all capitalize flex-1 ${
                        gameConfig.difficulty === level
                          ? "text-white shadow-lg"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                      style={{
                        background:
                          gameConfig.difficulty === level
                            ? "linear-gradient(135deg, var(--color-brand-blue), #3460c4)"
                            : undefined,
                      }}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Starting Word */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
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
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter starting word (e.g., Apple)"
                />
              </div>

              {/* Time Per Turn */}
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Time Per Turn (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={gameConfig.timePerTurn}
                  onChange={(e) =>
                    setGameConfig({
                      ...gameConfig,
                      timePerTurn: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Players Management */}
        <div className="space-y-6">
          {/* Add Players */}
          <GlassCard className="p-6">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              <div className="flex items-center gap-2">
                <Users size={20} />
                Add Players
              </div>
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Student name"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddPlayer}
                className="w-full px-4 py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-brand-blue), #3460c4)",
                }}
              >
                <Plus size={18} />
                Add Player
              </motion.button>
            </div>
          </GlassCard>

          {/* Players List */}
          <GlassCard className="p-6">
            <h3
              className="text-lg font-bold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Players ({players.length})
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: "var(--color-bg-secondary)" }}
                >
                  <span style={{ color: "var(--color-text-primary)" }}>
                    {player.name}
                  </span>
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={16} style={{ color: "var(--color-error)" }} />
                  </button>
                </motion.div>
              ))}
            </div>

            {players.length < 2 && (
              <p
                className="text-sm mt-4"
                style={{ color: "var(--color-text-secondary)" }}
              >
                ⚠️ Add at least 2 players to start the game
              </p>
            )}
          </GlassCard>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-500/20 border border-red-500 rounded-lg"
            >
              <p style={{ color: "var(--color-error)" }} className="font-semibold">
                ❌ {error}
              </p>
            </motion.div>
          )}

          {/* Create Game Button */}
          <motion.button
            whileHover={players.length >= 2 && !isLoading ? { scale: 1.05 } : {}}
            whileTap={players.length >= 2 && !isLoading ? { scale: 0.95 } : {}}
            onClick={handleCreateGame}
            disabled={players.length < 2 || isLoading}
            className="w-full px-6 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{
              background:
                players.length < 2 || isLoading
                  ? "#9ca3af"
                  : "linear-gradient(135deg, #10b981, #059669)",
              boxShadow:
                players.length < 2 || isLoading
                  ? "none"
                  : "0 10px 25px rgba(16, 185, 129, 0.3)",
            }}
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Creating & Starting Game...
              </>
            ) : (
              <>
                <Play size={20} />
                Create & Start Game
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
