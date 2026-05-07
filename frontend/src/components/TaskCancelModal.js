import React, { useState } from 'react';
import { X, AlertTriangle, Flag, Sparkles } from 'lucide-react';
import { taskService } from '../services/apiService';

const CANCEL_REASONS = [
  { value: 'work_not_as_described', label: 'Work not as described' },
  { value: 'incomplete_work', label: 'Incomplete work' },
  { value: 'fake_submission', label: 'Fake submission' },
  { value: 'delay_beyond_deadline', label: 'Delay beyond deadline' },
  { value: 'poor_quality', label: 'Poor quality' },
  { value: 'other', label: 'Other (specify below)' },
];

const TaskCancelModal = ({ isOpen, onClose, task, onSuccess }) => {
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [showReportOption, setShowReportOption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCancel = async () => {
    try {
      setError('');
      if (!cancelReason) {
        setError('You MUST select a cancellation reason. Cancelling without one will result in immediate account blocking.');
        return;
      }
      if (cancelReason === 'other' && !cancelDetails.trim()) {
        setError('Please provide details for "Other" reason');
        return;
      }
      setLoading(true);
      const response = await taskService.cancelTask(task.id, { cancel_reason: cancelReason, cancel_details: cancelDetails });
      onSuccess(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[28px] bento shadow-soft-lg flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header — ink-navy */}
        <div className="relative overflow-hidden bg-ink-950 text-white p-6 flex-shrink-0">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(500px 300px at 10% -10%, rgba(255,106,91,.32), transparent 60%), radial-gradient(500px 400px at 95% 110%, rgba(34,211,238,.18), transparent 60%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-coral-300 backdrop-blur-md">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="chip chip-coral mb-1.5"><Sparkles className="w-3 h-3" /> action required</span>
                <h3 className="font-display text-3xl leading-tight">Cancel <span className="italic text-gradient">task</span></h3>
                <p className="text-xs text-ink-300 mt-1">This action requires a valid reason.</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full glass grid place-items-center hover:shadow-glow transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Critical warning */}
          <div className="rounded-2xl bg-coral-500/10 ring-1 ring-coral-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-lg leading-tight text-coral-700 dark:text-coral-300">Critical warning</p>
                <p className="text-xs text-ink-600 dark:text-ink-200 mt-1.5 leading-relaxed">
                  Cancelling a task <b>without selecting a valid reason</b> will result in <b className="text-coral-500">immediate automatic account blocking</b>. This is a strict platform policy to prevent abuse.
                </p>
              </div>
            </div>
          </div>

          {/* Task info */}
          <div className="rounded-2xl glass p-4">
            <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-1">Task</p>
            <p className="font-semibold">{task?.title}</p>
            <p className="text-xs text-ink-500 dark:text-ink-300 mt-1">Amount: ₹{task?.price}</p>
            {task?.acceptor_id && <p className="text-xs text-amber-600 dark:text-amber-300 mt-1.5">⚠️ This task has an assigned worker</p>}
          </div>

          {/* Reasons */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3">
              Select cancellation reason <span className="text-coral-500">*</span>
            </label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    cancelReason === reason.value
                      ? 'border-coral-400 bg-coral-500/10'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-white/40 dark:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason.value}
                    checked={cancelReason === reason.value}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="accent-coral-500"
                  />
                  <span className="font-semibold text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {cancelReason === 'other' && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
                Provide details <span className="text-coral-500">*</span>
              </label>
              <textarea
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                className="modern-input"
                rows="4"
                placeholder="Please explain the reason for cancellation…"
                required
              />
            </div>
          )}

          {cancelReason && cancelReason !== 'other' && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">Additional details</label>
              <textarea
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                className="modern-input"
                rows="3"
                placeholder="Any additional information…"
              />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-coral-500/10 ring-1 ring-coral-500/20 text-coral-700 dark:text-coral-300 text-sm">
              {error}
            </div>
          )}

          {/* Report option */}
          <div className="rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20 p-4">
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-cyan-600 dark:text-cyan-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-cyan-700 dark:text-cyan-200">Need to report the task acceptor?</p>
                <p className="text-xs text-ink-600 dark:text-ink-200 mt-1 mb-2">
                  If you’re experiencing fraud, harassment or other serious issues, you can report the user.
                </p>
                <button onClick={() => setShowReportOption(true)} className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 underline">
                  Report user →
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1 py-3" disabled={loading}>Go back</button>
            <button onClick={handleCancel} className="btn btn-coral flex-1 py-3" disabled={loading || !cancelReason}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cancelling…
                </>
              ) : (
                'Confirm cancellation'
              )}
            </button>
          </div>

          {cancelReason && (
            <div className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 p-4">
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                ✅ A refund of ₹{task?.price} will be initiated to your account after cancellation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCancelModal;
