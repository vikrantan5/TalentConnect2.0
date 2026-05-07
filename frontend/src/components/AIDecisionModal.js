import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, Star, CheckCircle, AlertCircle, Loader2, Brain, Target } from 'lucide-react';
import api from '../services/api';

const AIDecisionModal = ({ taskId, userId, userName, isOpen, onClose, onDecisionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState(null);

  const getAIDecision = async () => {
    setLoading(true);
    setError(null);
    setDecision(null);
    try {
      const response = await api.post('/api/ai/assignment-decision', { task_id: taskId, user_id: userId });
      setDecision(response.data);
    } catch (err) {
      console.error('Error getting AI decision:', err);
      let errorMessage = 'Failed to get AI recommendation';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => (typeof e === 'object' ? e.msg || JSON.stringify(e) : e)).join(', ');
        } else if (typeof errorData.detail === 'string') errorMessage = errorData.detail;
        else if (typeof errorData.detail === 'object') errorMessage = JSON.stringify(errorData.detail);
      }
      setError(errorMessage);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (isOpen && taskId && userId && !decision && !loading) getAIDecision();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId, userId]);

  const handleClose = () => { setDecision(null); setError(null); onClose(); };
  const handleProceed = () => { onDecisionComplete && onDecisionComplete(decision); handleClose(); };

  if (!isOpen) return null;

  const palette = (() => {
    switch (decision?.decision) {
      case 'recommended':     return { chip: 'chip-cyan', accent: 'text-emerald-500', bg: 'bg-emerald-500/10 ring-emerald-500/20' };
      case 'not_recommended': return { chip: 'chip-coral', accent: 'text-coral-500', bg: 'bg-coral-500/10 ring-coral-500/20' };
      default:                return { chip: 'chip-coral', accent: 'text-amber-500', bg: 'bg-amber-500/10 ring-amber-500/20' };
    }
  })();

  const DecisionIcon = decision?.decision === 'recommended' ? CheckCircle : AlertCircle;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm" data-testid="ai-decision-modal" onClick={handleClose}>
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[28px] bento shadow-soft-lg flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header — ink-navy */}
        <div className="relative overflow-hidden bg-ink-950 text-white p-6 flex-shrink-0">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(500px 300px at 10% -10%, rgba(34,211,238,.32), transparent 60%), radial-gradient(500px 400px at 95% 110%, rgba(99,102,241,.22), transparent 60%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-cyan-300 backdrop-blur-md">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <span className="chip chip-cyan mb-1.5"><Sparkles className="w-3 h-3" /> AI co-pilot</span>
                <h3 className="font-display text-3xl leading-tight">Assignment <span className="italic text-gradient-cyan">recommendation</span></h3>
                <p className="text-xs text-ink-300 mt-1">Analyzing <b>{userName}</b></p>
              </div>
            </div>
            <button onClick={handleClose} className="w-9 h-9 rounded-full glass grid place-items-center hover:shadow-glow transition" data-testid="close-ai-decision-modal">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="tc-spinner" />
              <p className="font-display text-2xl text-ink-700 dark:text-ink-200">Analyzing candidate…</p>
              <p className="text-sm text-ink-500">Evaluating skills, history & reliability</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <AlertCircle className="w-10 h-10 text-coral-500" />
              <p className="font-display text-2xl">Couldn’t fetch recommendation</p>
              <p className="text-sm text-ink-500">{error}</p>
              <button onClick={getAIDecision} className="btn btn-cyan mt-2">Try again</button>
            </div>
          ) : decision ? (
            <div className="space-y-6">
              {/* Decision badge */}
              <div className={`rounded-2xl ring-1 ${palette.bg} p-5`}>
                <div className="flex items-center gap-3">
                  <DecisionIcon className={`w-8 h-8 ${palette.accent}`} />
                  <div>
                    <p className={`chip ${palette.chip} mb-2`}>{decision.confidence}% confidence</p>
                    <h4 className="font-display text-3xl capitalize leading-tight">
                      {decision.decision.replace('_', ' ')}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Score breakdown */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-3">Score breakdown</p>
                <div className="space-y-3">
                  {[
                    { k: 'skill_match_score', label: 'Skill match', icon: Target, gradient: 'from-cyan-400 to-indigo-500' },
                    { k: 'reliability_score', label: 'Reliability', icon: TrendingUp, gradient: 'from-emerald-400 to-cyan-500' },
                    { k: 'rating_score', label: 'Rating', icon: Star, gradient: 'from-amber-400 to-coral-400' },
                  ].map(({ k, label, icon: I, gradient }) => (
                    <div key={k}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="flex items-center gap-2 font-semibold"><I className="w-3.5 h-3.5" /> {label}</span>
                        <span className="font-mono font-semibold">{decision.breakdown[k]}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${gradient} animate-progress`} style={{ width: `${decision.breakdown[k]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Tasks done', v: decision.user_stats_summary.tasks_completed },
                  { label: 'Success', v: `${decision.user_stats_summary.success_rate}%` },
                  { label: 'Rating', v: `${decision.user_stats_summary.avg_rating?.toFixed(1)}/5` },
                  { label: 'On-time', v: `${decision.user_stats_summary.on_time_percentage}%` },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl glass p-4">
                    <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-1">{s.label}</p>
                    <p className="font-display text-2xl">{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {decision.strengths?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {decision.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {decision.flags?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-coral-500" /> Concerns
                  </p>
                  <ul className="space-y-1.5">
                    {decision.flags.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-coral-500 mt-0.5">⚠</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {decision.reason && (
                <div className="rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/20 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-cyan-600 dark:text-cyan-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> AI analysis
                  </p>
                  <p className="text-sm whitespace-pre-line">{decision.reason}</p>
                </div>
              )}

              {decision.ai_analysis && (
                <div className="rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-indigo-500 dark:text-indigo-300 mb-2 flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> Expert insight
                  </p>
                  <p className="text-sm">{decision.ai_analysis}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {decision && (
          <div className="border-t border-black/5 dark:border-white/10 p-4 flex gap-3 flex-shrink-0">
            <button onClick={handleClose} className="btn btn-ghost flex-1 py-3">Cancel</button>
            <button onClick={handleProceed} className={`btn flex-1 py-3 ${decision.decision === 'recommended' ? 'btn-cyan' : 'btn-coral'}`}>
              {decision.decision === 'recommended' ? 'Proceed with assignment' : 'Assign anyway'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDecisionModal;
