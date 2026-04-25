import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────
export interface TrelloLabel {
  id: string;
  text: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TrelloCard {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description: string;
  labels: TrelloLabel[];
  dueDate: string | null;
  checklist: ChecklistItem[];
  sequence: number;
  createdAt: string;
}

export interface TrelloColumn {
  id: string;
  boardId: string;
  title: string;
  sequence: number;
}

export interface TrelloBoard {
  id: string;
  name: string;
  background: string;
  createdAt: string;
  starred: boolean;
}

interface TrelloState {
  boards: TrelloBoard[];
  columns: TrelloColumn[];
  cards: TrelloCard[];

  addBoard: (name: string, background: string) => string;
  updateBoard: (id: string, updates: Partial<TrelloBoard>) => void;
  deleteBoard: (id: string) => void;
  toggleStar: (id: string) => void;

  addColumn: (boardId: string, title: string) => void;
  updateColumn: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (boardId: string, sourceIdx: number, destIdx: number) => void;

  addCard: (columnId: string, boardId: string, title: string) => void;
  updateCard: (id: string, updates: Partial<TrelloCard>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, srcColId: string, destColId: string, srcIdx: number, destIdx: number) => void;

  addChecklistItem: (cardId: string, text: string) => void;
  toggleChecklistItem: (cardId: string, itemId: string) => void;
  deleteChecklistItem: (cardId: string, itemId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const BOARD_BACKGROUNDS = [
  { name: 'Christ Blue',   value: 'linear-gradient(135deg, #264796 0%, #3460c4 100%)' },
  { name: 'Navy',          value: 'linear-gradient(135deg, #1c3570 0%, #264796 100%)' },
  { name: 'Christ Gold',   value: 'linear-gradient(135deg, #d0ae61 0%, #e6c97a 100%)' },
  { name: 'Royal Mix',     value: 'linear-gradient(135deg, #264796 0%, #1c3570 60%, #b8943e 100%)' },
  { name: 'Ocean',         value: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' },
  { name: 'Emerald',       value: 'linear-gradient(135deg, #059669 0%, #34d399 100%)' },
  { name: 'Violet',        value: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' },
  { name: 'Sunset',        value: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' },
  { name: 'Slate',         value: 'linear-gradient(135deg, #334155 0%, #475569 100%)' },
];

export const CARD_LABEL_PRESETS = [
  { id: 'l1', text: 'Urgent',      color: '#ef4444' },
  { id: 'l2', text: 'Feature',     color: '#22c55e' },
  { id: 'l3', text: 'Bug',         color: '#f97316' },
  { id: 'l4', text: 'Research',    color: '#3b82f6' },
  { id: 'l5', text: 'Design',      color: '#a855f7' },
  { id: 'l6', text: 'Review',      color: '#eab308' },
];

export const useTrelloStore = create<TrelloState>()(
  persist(
    (set, get) => ({
      boards: [],
      columns: [],
      cards: [],

      // ── Board actions ──────────────────────────────────────
      addBoard: (name, background) => {
        const id = uid();
        set((s) => ({
          boards: [...s.boards, { id, name, background, createdAt: new Date().toISOString(), starred: false }],
        }));
        return id;
      },
      updateBoard: (id, updates) =>
        set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      deleteBoard: (id) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== id),
          columns: s.columns.filter((c) => c.boardId !== id),
          cards: s.cards.filter((c) => c.boardId !== id),
        })),
      toggleStar: (id) =>
        set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, starred: !b.starred } : b)) })),

      // ── Column actions ─────────────────────────────────────
      addColumn: (boardId, title) => {
        const cols = get().columns.filter((c) => c.boardId === boardId);
        const maxSeq = cols.length > 0 ? Math.max(...cols.map((c) => c.sequence)) : -1;
        set((s) => ({
          columns: [...s.columns, { id: uid(), boardId, title, sequence: maxSeq + 1 }],
        }));
      },
      updateColumn: (id, title) =>
        set((s) => ({ columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)) })),
      deleteColumn: (id) =>
        set((s) => ({
          columns: s.columns.filter((c) => c.id !== id),
          cards: s.cards.filter((c) => c.columnId !== id),
        })),
      reorderColumns: (boardId, sourceIdx, destIdx) =>
        set((s) => {
          const boardCols = s.columns
            .filter((c) => c.boardId === boardId)
            .sort((a, b) => a.sequence - b.sequence);
          const [moved] = boardCols.splice(sourceIdx, 1);
          boardCols.splice(destIdx, 0, moved);
          const reseq = boardCols.map((c, i) => ({ ...c, sequence: i }));
          return { columns: [...s.columns.filter((c) => c.boardId !== boardId), ...reseq] };
        }),

      // ── Card actions ───────────────────────────────────────
      addCard: (columnId, boardId, title) => {
        const colCards = get().cards.filter((c) => c.columnId === columnId);
        const maxSeq = colCards.length > 0 ? Math.max(...colCards.map((c) => c.sequence)) : -1;
        set((s) => ({
          cards: [
            ...s.cards,
            {
              id: uid(),
              columnId,
              boardId,
              title,
              description: '',
              labels: [],
              dueDate: null,
              checklist: [],
              sequence: maxSeq + 1,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
      updateCard: (id, updates) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

      moveCard: (cardId, srcColId, destColId, srcIdx, destIdx) =>
        set((s) => {
          const allCards = [...s.cards];
          const srcCards = allCards
            .filter((c) => c.columnId === srcColId)
            .sort((a, b) => a.sequence - b.sequence);
          const [moved] = srcCards.splice(srcIdx, 1);
          if (!moved) return s;

          if (srcColId === destColId) {
            srcCards.splice(destIdx, 0, moved);
            const reseq = srcCards.map((c, i) => ({ ...c, sequence: i }));
            return { cards: [...allCards.filter((c) => c.columnId !== srcColId), ...reseq] };
          }

          const destCards = allCards
            .filter((c) => c.columnId === destColId)
            .sort((a, b) => a.sequence - b.sequence);
          moved.columnId = destColId;
          destCards.splice(destIdx, 0, moved);

          const reseqSrc = srcCards.map((c, i) => ({ ...c, sequence: i }));
          const reseqDest = destCards.map((c, i) => ({ ...c, sequence: i }));
          return {
            cards: [
              ...allCards.filter((c) => c.columnId !== srcColId && c.columnId !== destColId),
              ...reseqSrc,
              ...reseqDest,
            ],
          };
        }),

      // ── Checklist actions ──────────────────────────────────
      addChecklistItem: (cardId, text) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? { ...c, checklist: [...c.checklist, { id: uid(), text, completed: false }] }
              : c
          ),
        })),
      toggleChecklistItem: (cardId, itemId) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId
              ? { ...c, checklist: c.checklist.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i)) }
              : c
          ),
        })),
      deleteChecklistItem: (cardId, itemId) =>
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === cardId ? { ...c, checklist: c.checklist.filter((i) => i.id !== itemId) } : c
          ),
        })),
    }),
    { name: 'edugames-trello-storage' }
  )
);
