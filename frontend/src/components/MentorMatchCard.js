import React from 'react';
import { GraduationCap, MessageCircle, User, MapPin, Award, CheckCircle } from 'lucide-react';

const MentorMatchCard = ({ mentor, onChat, onBookSession, onViewProfile }) => {
  return (
    <div className="group relative animate-scale-in" data-testid="mentor-match-card">
      <div className="bento bento-glow rounded-[28px] overflow-hidden">
        {/* Cover */}
        <div className="relative h-28 bg-ink-950 overflow-hidden">
          <div className="absolute inset-0 opacity-80" style={{ background: 'radial-gradient(500px 200px at 0% 0%, rgba(34,211,238,.55), transparent 60%), radial-gradient(500px 200px at 100% 100%, rgba(99,102,241,.45), transparent 60%)' }} />
          {mentor.background_photo && (
            <img src={mentor.background_photo} alt="Cover" className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute top-3 right-3">
            <span className="chip chip-cyan backdrop-blur-md bg-cyan-500/25 text-white">
              <GraduationCap className="w-3 h-3" /> mentor
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative -mt-12">
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-ink-900 overflow-hidden shadow-soft bg-gradient-to-br from-cyan-400 to-indigo-500">
                {mentor.profile_photo || mentor.avatar_url ? (
                  <img
                    src={mentor.profile_photo || mentor.avatar_url}
                    alt={mentor.full_name || mentor.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-display text-2xl">
                    {(mentor.full_name || mentor.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {mentor.is_available && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full ring-4 ring-white dark:ring-ink-900" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-xl leading-tight text-ink-950 dark:text-white truncate">
                    {mentor.full_name || mentor.username}
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-ink-300">@{mentor.username}</p>
                </div>
                {mentor.is_verified && (
                  <span className="chip chip-cyan flex-shrink-0">
                    <CheckCircle className="w-3 h-3" /> verified
                  </span>
                )}
              </div>
              {mentor.location && (
                <div className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-300 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{mentor.location}</span>
                </div>
              )}
            </div>
          </div>

          {mentor.bio && (
            <p className="text-sm text-ink-600 dark:text-ink-200 mb-3 line-clamp-2">
              {mentor.bio}
            </p>
          )}

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-cyan-500" />
              <p className="text-[10px] uppercase tracking-widest text-ink-500 dark:text-ink-300">can teach you</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mentor.matching_skills && mentor.matching_skills.map((skill, idx) => (
                <span key={idx} className="chip chip-cyan">{skill}</span>
              ))}
            </div>
            {mentor.skill_level && (
              <p className="text-xs text-ink-500 dark:text-ink-300 mt-2">
                Level: <span className="font-semibold text-cyan-500 capitalize">{mentor.skill_level}</span>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onChat(mentor)}
              className="flex-1 btn btn-ghost py-2.5"
              data-testid="mentor-chat-btn"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => onBookSession(mentor)}
              className="flex-1 btn btn-cyan py-2.5"
              data-testid="mentor-book-btn"
            >
              <GraduationCap className="w-4 h-4" />
              Book
            </button>
            <button
              onClick={() => onViewProfile(mentor)}
              className="btn btn-ghost px-3 py-2.5"
              data-testid="mentor-profile-btn"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorMatchCard;
