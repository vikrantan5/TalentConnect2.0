import React from 'react';
import { Flame, MessageCircle, ArrowRightLeft, User, MapPin, Sparkles } from 'lucide-react';

const PerfectMatchCard = ({ match, onChat, onStartExchange, onViewProfile }) => {
  return (
    <div className="group relative animate-scale-in" data-testid="perfect-match-card">
      <div className="bento bento-glow rounded-[28px] overflow-hidden">
        {/* Cover */}
        <div className="relative h-32 bg-ink-950 overflow-hidden">
          <div className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(500px 220px at 0% 0%, rgba(34,211,238,.45), transparent 60%), radial-gradient(500px 220px at 100% 100%, rgba(255,106,91,.55), transparent 60%)' }} />
          {match.background_photo && (
            <img src={match.background_photo} alt="Cover" className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute top-4 right-4">
            <span className="chip chip-coral backdrop-blur-md bg-coral-500/30 text-white">
              <Flame className="w-3 h-3" /> perfect match
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative -mt-14">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-ink-900 overflow-hidden shadow-soft-lg bg-gradient-to-br from-coral-400 to-coral-600">
                {match.profile_photo || match.avatar_url ? (
                  <img
                    src={match.profile_photo || match.avatar_url}
                    alt={match.full_name || match.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-display text-3xl">
                    {(match.full_name || match.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {match.is_available && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full ring-4 ring-white dark:ring-ink-900" />
              )}
            </div>

            <div className="flex-1 mt-1">
              <h3 className="font-display text-2xl leading-tight text-ink-950 dark:text-white">
                {match.full_name || match.username}
              </h3>
              <p className="text-sm text-ink-500 dark:text-ink-300">@{match.username}</p>
              {match.location && (
                <div className="inline-flex items-center gap-1 text-xs text-ink-500 dark:text-ink-300 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{match.location}</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300">match</p>
              <p className="font-display text-4xl leading-none text-gradient">{match.match_score}</p>
            </div>
          </div>

          {/* Bio */}
          {match.bio && (
            <p className="text-sm text-ink-600 dark:text-ink-200 mb-4 line-clamp-2">
              {match.bio}
            </p>
          )}

          {/* Skill Exchange */}
          <div className="rounded-2xl glass p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">you teach</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.you_teach && match.you_teach.map((skill, idx) => (
                    <span key={idx} className="chip chip-coral">{skill}</span>
                  ))}
                </div>
              </div>

              <ArrowRightLeft className="w-5 h-5 text-cyan-500 flex-shrink-0" />

              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">they teach</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.they_teach && match.they_teach.map((skill, idx) => (
                    <span key={idx} className="chip chip-cyan">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onChat(match)}
              className="flex-1 btn btn-ghost py-2.5"
              data-testid="perfect-match-chat-btn"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => onStartExchange(match)}
              className="flex-1 btn btn-coral py-2.5"
              data-testid="perfect-match-exchange-btn"
            >
              <Sparkles className="w-4 h-4" />
              Exchange
            </button>
            <button
              onClick={() => onViewProfile(match)}
              className="btn btn-ghost px-3 py-2.5"
              data-testid="perfect-match-profile-btn"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfectMatchCard;
