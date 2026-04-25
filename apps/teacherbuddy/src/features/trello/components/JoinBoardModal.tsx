import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { useTrelloStore } from '../../../store/useTrelloStore';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  onClose: () => void;
}

export const JoinBoardModal: React.FC<Props> = ({ onClose }) => {
  const { requestJoinBoard, boards } = useTrelloStore();
  const user = useAuthStore((s) => s.user);
  const [boardId, setBoardId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleJoin = () => {
    setError('');
    if (!boardId.trim()) return;
    
    const board = boards.find(b => b.id === boardId.trim());
    if (!board) {
      setError('Board not found. Please check the ID.');
      return;
    }

    const userEmail = user?.email || 'guest@eduai.com';

    if (board.creatorEmail === userEmail || board.members?.includes(userEmail)) {
      setError('You are already a member of this board.');
      return;
    }

    if (board.joinRequests?.includes(userEmail)) {
      setError('You have already requested to join this board. Please wait for approval.');
      return;
    }

    requestJoinBoard(board.id, userEmail);
    setSuccess(true);
    setTimeout(() => onClose(), 2000);
  };

  return (
    <div className="trello-modal-overlay" onClick={onClose}>
      <div className="trello-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <LogIn size={20} /> Join a Board
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          {!success ? (
            <>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Enter the Board ID shared with you by the creator to request access.
              </p>

              <label className="block mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Board ID <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={boardId}
                  onChange={(e) => { setBoardId(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. a1b2c3d4"
                  className="form-input"
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
              </label>

              <button
                onClick={handleJoin}
                disabled={!boardId.trim()}
                className="btn btn-primary w-full py-2.5 text-sm"
                style={{ opacity: boardId.trim() ? 1 : 0.5 }}
              >
                Request Access
              </button>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <LogIn size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-700 mb-2">Request Sent!</h3>
              <p className="text-sm text-green-600/80">
                The board creator has been notified. You will gain access once they approve your request.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
