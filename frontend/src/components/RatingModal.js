import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Upload, FileText, Sparkles } from 'lucide-react';
import { reportService } from '../services/apiService';

const REPORT_TYPES = [
  { value: 'fraud', label: 'Fraud / Scam', description: 'Fraudulent behavior or scam attempts' },
  { value: 'incomplete', label: 'Incomplete Work', description: 'Work not completed as agreed' },
  { value: 'harassing', label: 'Harassment', description: 'Abusive or threatening behavior' },
  { value: 'payment_issue', label: 'Payment Issues', description: 'Payment-related disputes' },
  { value: 'dispute', label: 'Dispute', description: 'General dispute or disagreement' },
  { value: 'other', label: 'Other', description: 'Other issues not listed above' },
];

const ReportModal = ({ isOpen, onClose, reportedUser, task, onSuccess }) => {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (!reportType) { setError('Please select a report type'); return; }
      if (!description.trim()) { setError('Please provide a detailed description'); return; }

      setLoading(true);

      const reportData = {
        reported_entity_type: task ? 'task' : 'user',
        reported_entity_id: task ? task.id : reportedUser.id,
        reported_user_id: reportedUser.id,
        report_type: reportType,
        reason: reason || REPORT_TYPES.find(t => t.value === reportType)?.label,
        description,
        attachments,
        screenshots: attachments,
      };

      const response = await reportService.createReport(reportData);
      onSuccess && onSuccess(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files.map(f => f.name));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm" data-testid="report-modal" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[28px] bento shadow-soft-lg flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
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
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <span className="chip chip-coral mb-1.5"><Sparkles className="w-3 h-3" /> moderation</span>
                <h3 className="font-display text-3xl leading-tight">Report a <span className="italic text-gradient">user</span></h3>
                <p className="text-xs text-ink-300 mt-1">Help us maintain platform integrity.</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full glass grid place-items-center hover:shadow-glow transition" data-testid="close-report-modal">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* User info */}
          <div className="rounded-2xl glass p-4">
            <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">Reporting</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-coral-400 to-pink-500 grid place-items-center text-white font-bold shadow-soft">
                {reportedUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold">{reportedUser?.full_name || reportedUser?.username}</p>
                <p className="text-xs text-ink-500 dark:text-ink-300">@{reportedUser?.username}</p>
              </div>
            </div>
            {task && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
                Related task: <b>{task.title}</b>
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3">
              Type of issue <span className="text-coral-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    reportType === type.value
                      ? 'border-coral-400 bg-coral-500/10'
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-white/40 dark:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1 accent-coral-500"
                  />
                  <div className="flex-1">
                    <span className="font-semibold block">{type.label}</span>
                    <span className="text-xs text-ink-500 dark:text-ink-300">{type.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
              Detailed description <span className="text-coral-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="modern-input"
              rows="5"
              placeholder="Provide as much detail as possible — dates, incidents, anything relevant…"
              required
            />
            <p className="text-[11px] text-ink-500 dark:text-ink-300 mt-1.5">
              Minimum 20 characters. Be specific and factual.
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
              Evidence / Screenshots
            </label>
            <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 p-6 text-center bg-white/40 dark:bg-white/5">
              <input type="file" id="report-files" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="report-files" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white shadow-soft mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold">Click to upload evidence</p>
                <p className="text-[11px] text-ink-500 dark:text-ink-300 mt-0.5">Images or PDF files</p>
              </label>
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs glass rounded-xl px-3 py-2">
                      <FileText className="w-3.5 h-3.5" />
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-coral-500/10 ring-1 ring-coral-500/20 text-coral-700 dark:text-coral-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <AlertTriangle className="w-5 h-5 text-cyan-600 dark:text-cyan-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-cyan-700 dark:text-cyan-200">Important notice</p>
              <p className="text-xs text-ink-600 dark:text-ink-200 mt-1">
                False reports may result in action against your account. Please ensure all information is accurate.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 py-3" disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-coral flex-1 py-3"
              disabled={loading || !reportType || !description.trim() || description.trim().length < 20}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" /> Submit report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
