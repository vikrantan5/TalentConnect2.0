import React from 'react';
import { BookOpen, MessageCircle, User, MapPin, Target } from 'lucide-react';

const LearnerMatchCard = ({ learner, onChat, onConnect, onViewProfile }) => {
  return (
    <div className="group relative animate-scale-in" data-testid="learner-match-card">
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
      
      <div className="relative glass-card rounded-2xl overflow-hidden border-2 border-green-200/50 dark:border-green-800/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative h-28 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 overflow-hidden">
          {learner.background_photo ? (
            <img 
              src={learner.background_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          {/* Badge */}
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-xs">LEARNER</span>
          </div>
        </div>

        <div className="p-5">
          {/* Profile Section */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative -mt-12">
              <div className="w-20 h-20 rounded-xl border-4 border-white dark:border-gray-800 overflow-hidden shadow-lg bg-gradient-to-br from-green-400 to-emerald-500">
                {learner.profile_photo || learner.avatar_url ? (
                  <img 
                    src={learner.profile_photo || learner.avatar_url} 
                    alt={learner.full_name || learner.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                    {(learner.full_name || learner.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {learner.is_available && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800"></div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
                {learner.full_name || learner.username}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">@{learner.username}</p>
              {learner.location && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{learner.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {learner.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {learner.bio}
            </p>
          )}

          {/* Skills */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Wants to learn:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {learner.matching_skills && learner.matching_skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-md"
                >
                  {skill}
                </span>
              ))}
            </div>
            {learner.skill_level && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Current level: <span className="font-semibold text-green-600 dark:text-green-400 capitalize">{learner.skill_level}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onChat(learner)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              data-testid="learner-chat-btn"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => onConnect(learner)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              data-testid="learner-connect-btn"
            >
              <BookOpen className="w-4 h-4" />
              Connect
            </button>
            <button
              onClick={() => onViewProfile(learner)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-300"
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