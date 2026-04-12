import React from 'react';
import { GraduationCap, MessageCircle, User, MapPin, Award, CheckCircle } from 'lucide-react';

const MentorMatchCard = ({ mentor, onChat, onBookSession, onViewProfile }) => {
  return (
    <div className="group relative animate-scale-in" data-testid="mentor-match-card">
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
      
      <div className="relative glass-card rounded-2xl overflow-hidden border-2 border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative h-28 bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 overflow-hidden">
          {mentor.background_photo ? (
            <img 
              src={mentor.background_photo} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          {/* Badge */}
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-xs">MENTOR</span>
          </div>
        </div>

        <div className="p-5">
          {/* Profile Section */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative -mt-12">
              <div className="w-20 h-20 rounded-xl border-4 border-white dark:border-gray-800 overflow-hidden shadow-lg bg-gradient-to-br from-blue-400 to-cyan-500">
                {mentor.profile_photo || mentor.avatar_url ? (
                  <img 
                    src={mentor.profile_photo || mentor.avatar_url} 
                    alt={mentor.full_name || mentor.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                    {(mentor.full_name || mentor.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {mentor.is_available && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800"></div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
                    {mentor.full_name || mentor.username}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">@{mentor.username}</p>
                </div>
                {mentor.is_verified && (
                  <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Verified</span>
                  </div>
                )}
              </div>
              {mentor.location && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{mentor.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {mentor.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {mentor.bio}
            </p>
          )}

          {/* Skills */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Can teach you:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mentor.matching_skills && mentor.matching_skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-bold shadow-md"
                >
                  {skill}
                </span>
              ))}
            </div>
            {mentor.skill_level && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Level: <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{mentor.skill_level}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onChat(mentor)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              data-testid="mentor-chat-btn"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => onBookSession(mentor)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              data-testid="mentor-book-btn"
            >
              <GraduationCap className="w-4 h-4" />
              Book
            </button>
            <button
              onClick={() => onViewProfile(mentor)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-300"
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