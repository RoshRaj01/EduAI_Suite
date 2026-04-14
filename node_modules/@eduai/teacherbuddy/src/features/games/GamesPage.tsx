import React, { useState } from "react";
import { 
  BookOpen, UploadCloud, CalendarDays, Link, Cloud, Trophy, 
  Puzzle, BarChart3, Layout, Kanban, HardHat 
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../shared/hooks/useTheme";

const gameCategories = [
  // Core Academic
  {
    id: "classroom",
    title: "Classroom",
    description: "Students can access content posted by the teacher.",
    icon: BookOpen,
    color: "from-blue-400 to-blue-600",
  },
  {
    id: "resource-management",
    title: "Resource Management",
    description: "Students can upload their answers securely.",
    icon: UploadCloud,
    color: "from-indigo-400 to-indigo-600",
  },
  {
    id: "office-hours",
    title: "Office Hours Scheduler",
    description: "Students book slots to avoid chaos and manage time.",
    icon: CalendarDays,
    color: "from-violet-400 to-violet-600",
  },
  // Custom Games
  {
    id: "chain-answer",
    title: "Chain Answer Game",
    description: "One student starts an answer, the next continues it.",
    icon: Link,
    color: "from-fuchsia-400 to-fuchsia-600",
  },
  {
    id: "word-cloud",
    title: "Live Word Cloud Battle",
    description: "Ask open-ended questions, words appear live (Mentimeter style).",
    icon: Cloud,
    color: "from-sky-400 to-sky-600",
  },
  {
    id: "quiz-royale",
    title: "Quiz Battle Royale",
    description: "Real-time MCQs. Points = speed + accuracy. Live leaderboard.",
    icon: Trophy,
    color: "from-yellow-400 to-amber-500",
  },
  {
    id: "team-puzzle",
    title: "Team Puzzle Challenge",
    description: "Split into teams. Each member gets partial info to collaborate.",
    icon: Puzzle,
    color: "from-orange-400 to-orange-600",
  },
  // Third-Party Inspired Tools
  {
    id: "slido",
    title: "Slido",
    description: "Live polling and Q&A integrated into presentations.",
    icon: BarChart3,
    color: "from-teal-400 to-teal-600",
  },
  {
    id: "padlet",
    title: "Padlet",
    description: "Students post ideas, media, and responses on a shared visual board.",
    icon: Layout,
    color: "from-amber-400 to-amber-600",
  },
  {
    id: "trello",
    title: "Trello",
    description: "Kanban-style boards for managing group projects and tasks.",
    icon: Kanban,
    color: "from-blue-500 to-blue-700",
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
          Games & Activities Studio
        </h1>
        <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Manage interactive learning modules, live quizzes, and collaborative spaces.
        </p>
      </div>

      {/* Grid of game types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
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
