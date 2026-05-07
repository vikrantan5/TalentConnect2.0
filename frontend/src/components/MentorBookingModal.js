import React, { useState } from 'react';
import { X, GraduationCap, Calendar, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MentorBookingModal = ({ isOpen, onClose, mentor, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 60,
    message: `Hi! I'd love to learn ${mentor?.matching_skills?.join(', ') || ''} from you. Looking forward to our session!`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/free-sessions/book`,
        {
          receiver_id: mentor.user_id,
          session_type: 'mentor',
          skill_learn: mentor.matching_skills?.[0] || '',
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
      setError(err.response?.data?.detail || 'Failed to book mentoring session');
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
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(500px 300px at 0% 0%, rgba(34,211,238,.4), transparent 60%), radial-gradient(500px 300px at 100% 100%, rgba(99,102,241,.32), transparent 60%)' }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center backdrop-blur">
                <GraduationCap className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <span className="chip chip-cyan mb-1">free 1-on-1</span>
                <h2 className="font-display text-3xl leading-tight">
                  Book <span className="italic text-gradient-cyan">mentoring</span>
                </h2>
                <p className="text-xs text-ink-300 mt-1">No tokens required</p>
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
          {/* Mentor Info */}
          <div className="rounded-[24px] glass p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-400 to-indigo-500">
                {mentor.profile_photo || mentor.avatar_url ? (
                  <img src={mentor.profile_photo || mentor.avatar_url} alt={mentor.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-display text-2xl">
                    {(mentor.full_name || mentor.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl leading-tight text-ink-950 dark:text-white">{mentor.full_name || mentor.username}</h3>
                <p className="text-xs text-ink-500 dark:text-ink-300">@{mentor.username}</p>
                {mentor.skill_level && (
                  <span className="chip chip-cyan mt-1.5 capitalize">{mentor.skill_level} level</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">will teach you</p>
              <div className="flex flex-wrap gap-1.5">
                {mentor.matching_skills?.map((skill, idx) => (
                  <span key={idx} className="chip chip-cyan">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Form */}
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
                placeholder="Tell them what you'd like to learn…"
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
                className="flex-1 btn btn-cyan py-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin"></div>
                    Booking…
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
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

export default MentorBookingModal;
