// InteractionStudio - Slido-like interaction authoring for presentations
// Students preview their PPTX and add polls/Q&A at specific slide breakpoints
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle,
  BarChart3,
  MessageSquare,
  Type,
  Cloud,
  Star,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  AlertCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import PPTXViewer from "./PPTXViewer";

// ─── Types ────────────────────────────────────────────────────────
interface Interaction {
  id?: number;
  submission_id?: number;
  slide_number: number;
  interaction_type: string;
  config: InteractionConfig;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

interface InteractionConfig {
  question: string;
  options?: string[];
  settings?: Record<string, any>;
}

interface Props {
  submissionId: number;
  fileUrl: string;
  fileName: string;
  onFinalize: () => void;
  onBack: () => void;
}

// ─── Constants ────────────────────────────────────────────────────
const INTERACTION_TYPES = [
  { value: "poll_multiple_choice", label: "Multiple Choice", icon: BarChart3, color: "#6366f1" },
  { value: "poll_open_text", label: "Open Text", icon: Type, color: "#06b6d4" },
  { value: "poll_word_cloud", label: "Word Cloud", icon: Cloud, color: "#8b5cf6" },
  { value: "poll_rating", label: "Rating", icon: Star, color: "#f59e0b" },
  { value: "qna_prompt", label: "Q&A Prompt", icon: MessageSquare, color: "#10b981" },
];

// ─── Component ────────────────────────────────────────────────────
const InteractionStudio: React.FC<Props> = ({
  submissionId,
  fileUrl,
  fileName,
  onFinalize,
  onBack,
}) => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding new interaction
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSlide, setFormSlide] = useState(1);
  const [formType, setFormType] = useState("poll_multiple_choice");
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptions, setFormOptions] = useState(["", ""]);

  // ─── Fetch existing interactions ──────────────────────────────
  useEffect(() => {
    fetchInteractions();
  }, [submissionId]);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/slido/submissions/${submissionId}/interactions`);
      if (res.ok) {
        setInteractions(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch interactions", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset form ───────────────────────────────────────────────
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormSlide(1);
    setFormType("poll_multiple_choice");
    setFormQuestion("");
    setFormOptions(["", ""]);
    setError(null);
  };

  // ─── Save interaction ─────────────────────────────────────────
  const handleSaveInteraction = async () => {
    if (!formQuestion.trim()) {
      setError("Question text is required");
      return;
    }

    const needsOptions = formType === "poll_multiple_choice";
    const validOptions = formOptions.filter((o) => o.trim());
    if (needsOptions && validOptions.length < 2) {
      setError("Multiple choice needs at least 2 options");
      return;
    }

    setSaving(true);
    setError(null);

    const body: any = {
      slide_number: formSlide,
      interaction_type: formType,
      config: {
        question: formQuestion.trim(),
        ...(needsOptions ? { options: validOptions } : {}),
      },
      order_index: interactions.filter((i) => i.slide_number === formSlide).length,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/slido/submissions/interactions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/slido/submissions/${submissionId}/interactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to save");
      }

      await fetchInteractions();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete interaction ───────────────────────────────────────
  const handleDelete = async (interactionId: number) => {
    try {
      await fetch(`/api/slido/submissions/interactions/${interactionId}`, { method: "DELETE" });
      await fetchInteractions();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ─── Edit interaction ─────────────────────────────────────────
  const handleEdit = (interaction: Interaction) => {
    setEditingId(interaction.id!);
    setFormSlide(interaction.slide_number);
    setFormType(interaction.interaction_type);
    setFormQuestion(interaction.config.question);
    setFormOptions(interaction.config.options || ["", ""]);
    setShowForm(true);
  };

  // ─── Finalize submission ──────────────────────────────────────
  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await fetch(`/api/slido/submissions/${submissionId}/submit`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Finalize failed");
      }
      onFinalize();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Finalize failed");
    } finally {
      setFinalizing(false);
    }
  };

  // ─── Group interactions by slide ──────────────────────────────
  const groupedBySlide: Record<number, Interaction[]> = {};
  interactions.forEach((i) => {
    if (!groupedBySlide[i.slide_number]) groupedBySlide[i.slide_number] = [];
    groupedBySlide[i.slide_number].push(i);
  });

  const typeInfo = (t: string) => INTERACTION_TYPES.find((x) => x.value === t) || INTERACTION_TYPES[0];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.10) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-30"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition text-sm px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            ← Back
          </button>
          <div className="h-5 w-px bg-slate-600" />
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold">Interaction Studio</h1>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
            {interactions.length} interaction{interactions.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button
          onClick={handleFinalize}
          disabled={finalizing}
          className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}
        >
          {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Finalize & Submit
        </button>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* ─── Left: PPTX Preview ─────────────────────────────── */}
        <div className="flex-1 border-r border-white/5 flex flex-col">
          <div className="flex-1 overflow-auto">
            <PPTXViewer fileUrl={fileUrl} fileName={fileName} title="Preview Your Slides" />
          </div>
        </div>

        {/* ─── Right: Interaction Panel ───────────────────────── */}
        <div className="w-[420px] flex flex-col overflow-hidden bg-slate-800/50">
          {/* Panel Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="font-medium text-sm">Slide Interactions</span>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition"
              style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div
              className="p-4 border-b border-white/5 space-y-3"
              style={{ background: "rgba(99,102,241,0.05)" }}
            >
              <h4 className="text-sm font-medium text-indigo-300">
                {editingId ? "Edit Interaction" : "New Interaction"}
              </h4>

              {/* Slide Number */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">After Slide #</label>
                <input
                  type="number"
                  min={1}
                  value={formSlide}
                  onChange={(e) => setFormSlide(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Type Selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {INTERACTION_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = formType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setFormType(t.value)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition border"
                        style={{
                          borderColor: active ? t.color : "transparent",
                          background: active ? `${t.color}15` : "rgba(255,255,255,0.03)",
                          color: active ? t.color : "#94a3b8",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Question</label>
                <textarea
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  rows={2}
                  placeholder="e.g. What framework do you prefer?"
                  className="w-full bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Options (only for multiple choice) */}
              {formType === "poll_multiple_choice" && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Options</label>
                  <div className="space-y-1.5">
                    {formOptions.map((opt, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          value={opt}
                          onChange={(e) => {
                            const copy = [...formOptions];
                            copy[i] = e.target.value;
                            setFormOptions(copy);
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        {formOptions.length > 2 && (
                          <button
                            onClick={() => setFormOptions(formOptions.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {formOptions.length < 6 && (
                      <button
                        onClick={() => setFormOptions([...formOptions, ""])}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveInteraction}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editingId ? "Update" : "Save"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Interaction List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No interactions yet.</p>
                <p className="text-xs mt-1">Click "Add" to create polls or Q&A prompts.</p>
              </div>
            ) : (
              Object.keys(groupedBySlide)
                .sort((a, b) => Number(a) - Number(b))
                .map((slideNum) => (
                  <div key={slideNum}>
                    <div className="text-xs text-slate-500 font-medium mb-1.5 px-1">
                      After Slide {slideNum}
                    </div>
                    <div className="space-y-1.5">
                      {groupedBySlide[Number(slideNum)].map((interaction) => {
                        const info = typeInfo(interaction.interaction_type);
                        const Icon = info.icon;
                        return (
                          <div
                            key={interaction.id}
                            className="rounded-lg p-3 flex items-start gap-3 group transition hover:bg-white/[0.03]"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: `1px solid ${info.color}22`,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${info.color}18` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: info.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {interaction.config.question}
                              </p>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block"
                                style={{ background: `${info.color}18`, color: info.color }}
                              >
                                {info.label}
                              </span>
                              {interaction.config.options && (
                                <p className="text-[11px] text-slate-500 mt-1 truncate">
                                  {interaction.config.options.join(" · ")}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                              <button
                                onClick={() => handleEdit(interaction)}
                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => interaction.id && handleDelete(interaction.id)}
                                className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Bottom Info */}
          <div className="p-3 border-t border-white/5 text-[11px] text-slate-500 text-center">
            Interactions will launch automatically during your live presentation
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionStudio;
