import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Search, Loader2, Star, Trophy, Shield, MessageSquare, Calendar, Gift } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FindMentorModal = ({ isOpen, onClose, skillName }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);

  const searchMentors = async () => {
    setLoading(true);
    setSearched(true);
    setRewardInfo(null);
    try {
      const token = localStorage.getItem('token');

      const exchRes = await axios.post(
        `${BACKEND_URL}/api/match/skill-exchange`,
        { skill_requested: skillName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const exch = exchRes.data || {};
      if (exch.rewardPoints) {
        toast.success(`+${exch.rewardPoints} points awarded`);
      }
      setRewardInfo(exch);

      if (exch.mentorFound) {
        const response = await axios.post(
          `${BACKEND_URL}/api/ai/match-mentors`,
          { skill_name: skillName, limit: 5 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMatches(response.data.matches || []);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error finding mentors:', error);
      toast.error(error?.response?.data?.detail || 'Failed to find mentors');
    }
    setLoading(false);
  };

  const getTrustBadge = (score) => {
    if (!score || score < 60) return { label: 'Aspiring', tone: 'cyan' };
    if (score >= 90) return { label: 'Gold', tone: 'coral' };
    if (score >= 75) return { label: 'Silver', tone: 'ink' };
    return { label: 'Bronze', tone: 'coral' };
  };

  if (!isOpen) return null;

  return (
    <div className="tc-modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div className="bento rounded-[28px] max-w-3xl w-full max-h-[90vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-ink-950 text-white p-7 overflow-hidden">
          <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(500px 300px at 0% 0%, rgba(34,211,238,.4), transparent 60%), radial-gradient(500px 300px at 100% 100%, rgba(99,102,241,.32), transparent 60%)' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <span className="chip chip-cyan mb-2"><Search className="w-3 h-3" /> AI matching</span>
              <h2 className="font-display text-3xl leading-tight">
                Find mentor for <span className="italic text-gradient-cyan">{skillName}</span>
              </h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-7 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!searched ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center shadow-soft-lg">
                <Search className="w-9 h-9 text-white" />
              </div>
              <h3 className="font-display text-3xl mb-2">AI-powered matching</h3>
              <p className="text-ink-500 dark:text-ink-300 mb-6 max-w-md mx-auto">
                We'll find the best mentors for {skillName} based on ratings, experience and compatibility.
              </p>
              <button
                onClick={searchMentors}
                disabled={loading}
                className="btn btn-cyan px-6 py-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find mentors'}
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="tc-spinner" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-10">
              {rewardInfo?.rewardPoints > 0 && (
                <div className="mb-4 mx-auto max-w-md p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{rewardInfo.message}</p>
                </div>
              )}
              <p className="text-ink-500 dark:text-ink-300">
                {rewardInfo?.message || 'No mentors found for this skill'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rewardInfo?.rewardPoints > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{rewardInfo.message}</p>
                </div>
              )}
              {matches.map((match, index) => {
                const mentor = match.mentor || match;
                const trustBadge = getTrustBadge(mentor.trust_score);

                return (
                  <div key={index} className="bento p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 grid place-items-center text-white font-display text-2xl flex-shrink-0">
                        {mentor.username?.[0]?.toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-display text-xl leading-tight text-ink-950 dark:text-white">{mentor.full_name || mentor.username}</h3>
                          <span className={`chip chip-${trustBadge.tone}`}>{trustBadge.label}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500 dark:text-ink-300 mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            {mentor.average_rating?.toFixed(1) || '0.0'} ({mentor.total_ratings || 0})
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-cyan-500" />
                            {mentor.total_sessions || 0} sessions
                          </span>
                          {mentor.trust_score && (
                            <span className="inline-flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-emerald-500" />
                              Trust {mentor.trust_score}
                            </span>
                          )}
                        </div>

                        {mentor.bio && (
                          <p className="text-sm text-ink-600 dark:text-ink-200 mb-3 line-clamp-2">{mentor.bio}</p>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <button className="btn btn-cyan py-2 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            Book session
                          </button>
                          <button className="btn btn-ghost py-2 text-xs">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindMentorModal;
