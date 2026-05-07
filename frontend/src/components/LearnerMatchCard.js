import React from 'react';
import { BookOpen, MessageCircle, User, MapPin, Target } from 'lucide-react';

const LearnerMatchCard = ({ learner, onChat, onConnect, onViewProfile }) => {
  return (
    <div className="group relative animate-scale-in" data-testid="learner-match-card">
      <div className="bento bento-glow rounded-[28px] overflow-hidden">
        {/* Cover */}
        <div className="relative h-28 bg-ink-950 overflow-hidden">
          <div className="absolute inset-0 opacity-80" style={{ background: 'radial-gradient(500px 200px at 0% 0%, rgba(52,211,153,.55), transparent 60%), radial-gradient(500px 200px at 100% 100%, rgba(34,211,238,.45), transparent 60%)' }} />
          {learner.background_photo && (
            <img src={learner.background_photo} alt="Cover" className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute top-3 right-3">
            <span className="chip chip-ink backdrop-blur-md bg-emerald-500/25 text-white" style={{ boxShadow: 'inset 0 0 0 1px rgba(52,211,153,.35)' }}>
              <BookOpen className="w-3 h-3" /> learner
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative -mt-12">
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-ink-900 overflow-hidden shadow-soft bg-gradient-to-br from-emerald-400 to-cyan-500">
                {learner.profile_photo || learner.avatar_url ? (
                  <img
                    src={learner.profile_photo || learner.avatar_url}
                    alt={learner.full_name || learner.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-display text-2xl">
                    {(learner.full_name || learner.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {learner.is_available && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full ring-4 ring-white dark:ring-ink-900" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl leading-tight text-ink-950 dark:text-white truncate">
                {learner.full_name || learner.username}
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-300">@{learner.username}</p>
              {learner.location && (
                <div className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-300 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{learner.location}</span>
                </div>
              )}
            </div>
          </div>

          {learner.bio && (
            <p className="text-sm text-ink-600 dark:text-ink-200 mb-3 line-clamp-2">
              {learner.bio}
            </p>
          )}

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300">wants to learn</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {learner.matching_skills && learner.matching_skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(52,211,153,.3)' }}
                >
                  {skill}
                </span>
              ))}
            </div>
            {learner.skill_level && (
              <p className="text-xs text-ink-500 dark:text-ink-300 mt-2">
                Level: <span className="font-semibold text-emerald-500 capitalize">{learner.skill_level}</span>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onChat(learner)}
              className="flex-1 btn btn-ghost py-2.5"
              data-testid="learner-chat-btn"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => onConnect(learner)}
              className="flex-1 btn btn-cyan py-2.5"
              data-testid="learner-connect-btn"
            >
              <BookOpen className="w-4 h-4" />
              Connect
            </button>
            <button
              onClick={() => onViewProfile(learner)}
              className="btn btn-ghost px-3 py-2.5"
              data-testid="learner-profile-btn"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerMatchCard;
