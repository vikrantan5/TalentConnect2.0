import React, { useState } from 'react';
import { X, ArrowRightLeft, Calendar, Clock, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StartExchangeModal = ({ isOpen, onClose, match, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
    message: `I'd love to exchange skills with you! I'll teach you ${match?.you_teach?.join(', ') || ''} and you can teach me ${match?.they_teach?.join(', ') || ''}.`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !match) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/free-sessions/book`,
        {
          receiver_id: match.user_id,
          session_type: 'exchange',
          skill_teach: match.you_teach?.[0] || '',
          skill_learn: match.they_teach?.[0] || '',
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          message: formData.message
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book exchange session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tc-modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bento rounded-[28px] max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ink-950 text-white p-7 overflow-hidden">
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(500px 300px at 0% 0%, rgba(255,106,91,.4), transparent 60%), radial-gradient(500px 300px at 100% 100%, rgba(34,211,238,.32), transparent 60%)' }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center backdrop-blur">
                <Sparkles className="w-5 h-5 text-coral-300" />
              </div>
              <div>
                <span className="chip chip-coral mb-1">free session</span>
                <h2 className="font-display text-3xl leading-tight">
                  Start <span className="italic text-gradient">exchange</span>
                </h2>
                <p className="text-xs text-ink-300 mt-1">Book a 1-on-1 skill swap</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-7">
          {/* Exchange Preview */}
          <div className="rounded-[24px] glass p-5 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-coral-400 to-coral-600">
                  {match.profile_photo || match.avatar_url ? (
                    <img src={match.profile_photo || match.avatar_url} alt={match.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-display text-xl">
                      {(match.full_name || match.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-xl leading-tight text-ink-950 dark:text-white">{match.full_name || match.username}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300">Perfect match partner</p>
                </div>
              </div>
              <span className="chip chip-coral">
                <Sparkles className="w-3 h-3" /> {match.match_score} match
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">you'll teach</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.you_teach?.map((skill, idx) => (
                    <span key={idx} className="chip chip-coral">{skill}</span>
                  ))}
                </div>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-cyan-500 flex-shrink-0" />
              <div className="flex-1 min-w-[120px]">
                <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">you'll learn</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.they_teach?.map((skill, idx) => (
                    <span key={idx} className="chip chip-cyan">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
                  <Calendar className="w-3 h-3 inline mr-1.5" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="modern-input"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
                  <Clock className="w-3 h-3 inline mr-1.5" />
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="modern-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="modern-input"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">
                <MessageSquare className="w-3 h-3 inline mr-1.5" />
                Message (optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="modern-input resize-none"
                placeholder="Add a personal message…"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-coral-500/10 border border-coral-500/30">
                <AlertCircle className="w-5 h-5 text-coral-500" />
                <p className="text-sm text-coral-600 dark:text-coral-300 font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-ghost py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-coral py-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    Booking…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Send request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StartExchangeModal;
