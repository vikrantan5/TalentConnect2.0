import React from 'react';
import { Flame, MessageCircle, ArrowRightLeft, User, MapPin, Sparkles } from 'lucide-react';

const PerfectMatchCard = ({ match, onChat, onStartExchange, onViewProfile }) => {
  return (
    <div className="group relative animate-scale-in" data-testid="perfect-match-card">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
      
      <div className="relative glass-card rounded-2xl overflow-hidden border-2 border-orange-200/50 dark:border-orange-800/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 overflow-hidden">
          {match.background_photo ? (
            <img 
              src={match.background_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Perfect Match Badge */}
          <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <Flame className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">PERFECT MATCH</span>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Image */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative -mt-16">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-800 overflow-hidden shadow-xl bg-gradient-to-br from-orange-400 to-pink-500">
                {match.profile_photo || match.avatar_url ? (
                  <img 
                    src={match.profile_photo || match.avatar_url} 
                    alt={match.full_name || match.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {(match.full_name || match.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {match.is_available && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
              )}
            </div>

            <div className="flex-1 mt-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {match.full_name || match.username}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">@{match.username}</p>
              {match.location && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{match.location}</span>
                </div>
              )}
            </div>

            {/* Match Score */}
            <div className="px-4 py-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="text-center">
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{match.match_score}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Match</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {match.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
              {match.bio}
            </p>
          )}

          {/* Skill Exchange Display */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-4 border border-orange-100 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">You teach</p>
                <div className="flex flex-wrap gap-2">
                  {match.you_teach && match.you_teach.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold shadow-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <ArrowRightLeft className="w-6 h-6 text-orange-500 dark:text-orange-400 flex-shrink-0" />

              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">They teach</p>
                <div className="flex flex-wrap gap-2">
                  {match.they_teach && match.they_teach.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-xs font-bold shadow-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onChat(match)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              data-testid="perfect-match-chat-btn"
            >
              <MessageCircle className="w-5 h-5" />
              Chat
            </button>
            <button
              onClick={() => onStartExchange(match)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              data-testid="perfect-match-exchange-btn"
            >
              <Sparkles className="w-5 h-5" />
              Start Exchange
            </button>
            <button
              onClick={() => onViewProfile(match)}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              data-testid="perfect-match-profile-btn"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfectMatchCard;