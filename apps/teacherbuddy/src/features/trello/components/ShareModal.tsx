import React, { useState } from 'react';
import { X, Users, Copy, CheckCircle2, UserPlus, UserMinus, ShieldAlert } from 'lucide-react';
import { useTrelloStore, type TrelloBoard } from '../../../store/useTrelloStore';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  board: TrelloBoard;
  onClose: () => void;
}

export const ShareModal: React.FC<Props> = ({ board, onClose }) => {
  const { approveJoinRequest, rejectJoinRequest, removeMember, addMemberDirectly } = useTrelloStore();
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const userEmail = user?.email || 'guest@eduai.com';
  const isCreator = userEmail === board.creatorEmail;

  const handleCopyId = () => {
    navigator.clipboard.writeText(board.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    addMemberDirectly(board.id, inviteEmail.trim().toLowerCase());
    setInviteEmail('');
  };

  return (
    <div className="trello-modal-overlay" onClick={onClose}>
      <div className="trello-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Users size={20} /> Share Board
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Board ID (Share with others)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-mono text-slate-700">
                {board.id}
              </code>
              <button
                onClick={handleCopyId}
                className="btn btn-primary py-2 px-3 flex items-center gap-2"
                style={{ background: copied ? '#10b981' : undefined }}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Users can request access using this ID from the Trello dashboard.
            </p>
          </div>

          {isCreator && board.joinRequests && board.joinRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                <ShieldAlert size={16} className="text-amber-500" />
                Pending Requests ({board.joinRequests.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {board.joinRequests.map((email) => (
                  <div key={email} className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                    <span className="text-sm font-medium text-amber-900">{email}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => approveJoinRequest(board.id, email)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectJoinRequest(board.id, email)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Add Member Interface */}
          {isCreator && (
            <div className="mb-6">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--color-text-primary)' }}>
                <UserPlus size={16} className="text-brand-blue" />
                Add Member Directly
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="Enter email address..."
                  className="form-input text-sm py-2 flex-1"
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || !inviteEmail.includes('@')}
                  className="btn btn-primary py-2 px-4 whitespace-nowrap"
                  style={{ opacity: (!inviteEmail.trim() || !inviteEmail.includes('@')) ? 0.5 : 1 }}
                >
                  Add User
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <Users size={16} className="text-blue-500" />
              Members ({1 + (board.members?.length || 0)})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {board.creatorEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-800 block">{board.creatorEmail}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Creator</span>
                  </div>
                </div>
              </div>

              {board.members?.map((email) => (
                <div key={email} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">{email}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Member</span>
                    </div>
                  </div>
                  {isCreator && (
                    <button
                      onClick={() => removeMember(board.id, email)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove Member"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
