import React, { useState } from "react";
import { Gamepad2, Brain, Users, BarChart, FlaskConical, Target, HardHat } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../shared/hooks/useTheme";

const gameCategories = [
  {
    id: "competitive",
    title: "Competitive Live Quizzes",
    description: "High-energy classroom engagement with leaderboards (Kahoot!, Blooket style).",
    icon: Target,
    color: "from-orange-400 to-red-500",
  },
  {
    id: "strategic",
    title: "Strategic Quizzes",
    description: "Strategy-based quizzes with in-game currency and upgrades (Gimkit style).",
    icon: Gamepad2,
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "participatory",
    title: "Real-time Participation",
    description: "Polls, word clouds, and Q&A for real-time engagement (Mentimeter, Slido style).",
    icon: BarChart,
    color: "from-emerald-400 to-teal-500",
  },
  {
    id: "collaborative",
    title: "Collaborative Workspaces",
    description: "Infinite canvas for brainstorming and co-creation (Miro, Padlet style).",
    icon: Users,
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "experiential",
    title: "Experiential Simulations",
    description: "Hands-on virtual experiments and lab simulations (PhET, Labster style).",
    icon: FlaskConical,
    color: "from-purple-400 to-violet-500",
  },
];

export const GamesPage: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>
          EduGames Hub
        </h1>
        <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Interactive learning modules, live quizzes, and collaborative spaces.
        </p>
      </div>

      {/* Grid of game types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameCategories.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGame(category.id)}
            className="cursor-pointer"
          >
            <GlassCard className="h-full relative overflow-hidden group">
              <div
                className={`absolute inset-0 opacity-10 bg-gradient-to-br ${category.color} transition-opacity group-hover:opacity-20`}
              />
              <div className="p-6">
                <div
                  className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${category.color} text-white shadow-lg`}
                >
                  <category.icon size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  {category.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {category.description}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Under Construction Modal */}
      <AnimatePresence>
        {selectedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedGame(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg"
            >
              <GlassCard className="p-8 text-center border-t-4" style={{ borderTopColor: "var(--color-brand-gold)" }}>
                <div className="mx-auto w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
                  <HardHat size={40} />
                </div>
                <h2 className="text-2xl font-bold font-display mb-3" style={{ color: "var(--color-text-primary)" }}>
                  Module Under Construction
                </h2>
                <p className="mb-8 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  The <strong>{gameCategories.find(c => c.id === selectedGame)?.title}</strong> module is currently being built by our engineering team. Please check back later for updates.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="px-6 py-2.5 rounded-xl font-semibold text-white transition-transform hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, var(--color-brand-blue), #3460c4)", boxShadow: "0 4px 15px rgba(38,71,150,0.3)" }}
                  >
                    Go Back
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
