import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import javeriyaImg from '../assets/javeriya.jpeg';

import { 
  Users, 
  Linkedin, 
  Twitter, 
  Github, 
  Mail,
  ArrowLeft,
  Sparkles,
  Heart,
  Star
} from 'lucide-react';

const Teams = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const teamMembers = [
    {
      id: 1,
      name: 'Javeriya Anjum',
      role: 'Developer Of TalentConnect',
      bio: 'Passionate about technology and innovation. Dedicated to creating amazing experiences and building great products.',
      image: javeriyaImg,
      socials: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
        github: 'https://github.com',
        email: 'javeriya@talentconnect.com'
      },
      gradient: 'from-purple-500 via-pink-500 to-red-500',
      badgeGradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 2,
      name: 'Mr. Karthik P',
      role: 'Guide Of TalentConnect',
      bio: 'Assistant Professor Dept. of Computer Science',
      image: "'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Add+Photo'",
      socials: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
        github: 'https://github.com',
        email: 'member@talentconnect.com'
      },
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      badgeGradient: 'from-cyan-600 to-indigo-600'
    }
  ];
console.log(teamMembers[0].image);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <Link 
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 mb-8 group"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>

          {/* Page Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Meet Our Team
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Talented individuals working together to build amazing experiences
              <Sparkles className="inline-block w-5 h-5 ml-2 text-yellow-500 animate-pulse" />
            </p>
          </div>

          {/* Team Members Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={member.id}
                data-testid={`team-member-${index + 1}`}
                className="group relative animate-fade-in-scale"
                style={{ animationDelay: `${index * 200}ms` }}
                onMouseEnter={() => setHoveredCard(member.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Card Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${member.gradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-all duration-500`}></div>
                
                {/* Main Card */}
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700 group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  
                  {/* Decorative Top Border */}
                  <div className={`h-2 bg-gradient-to-r ${member.gradient}`}></div>
                  
                  {/* Card Content */}
                  <div className="p-8">
                    {/* Profile Image Section */}
                    <div className="relative w-40 h-40 mx-auto mb-6">
                      {/* Animated Ring */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${member.gradient} rounded-3xl animate-spin-slow opacity-20`}></div>
                      
                      {/* Image Container */}
                      <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-white dark:border-slate-700 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay on Hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                      </div>
                      
                      {/* Floating Badge */}
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 bg-gradient-to-r ${member.badgeGradient} rounded-full shadow-lg border-2 border-white dark:border-slate-700 group-hover:scale-110 transition-transform duration-300`}>
                          <Star className="w-4 h-4 text-white inline-block" />
                        </div>
                      </div>
                    </div>

                    {/* Name & Role */}
                    <div className="text-center mb-6">
                      <h3 className={`text-3xl font-black mb-2 bg-gradient-to-r ${member.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 inline-block`}>
                        {member.name}
                      </h3>
                      <p className={`text-sm font-bold uppercase tracking-wider bg-gradient-to-r ${member.badgeGradient} bg-clip-text text-transparent`}>
                        {member.role}
                      </p>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-8 min-h-[80px] flex items-center justify-center">
                      {member.bio}
                    </p>

                    {/* Divider */}
                    <div className={`h-px bg-gradient-to-r ${member.gradient} opacity-20 mb-8`}></div>

                    {/* Social Links */}
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center mb-4">
                        Connect With Me
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* LinkedIn */}
                        <a
                          href={member.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`member-${index + 1}-linkedin`}
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group/link"
                        >
                          <Linkedin className="w-5 h-5 group-hover/link:rotate-12 transition-transform duration-300" />
                          <span className="font-semibold text-sm">LinkedIn</span>
                        </a>

                        {/* Twitter */}
                        <a
                          href={member.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`member-${index + 1}-twitter`}
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group/link"
                        >
                          <Twitter className="w-5 h-5 group-hover/link:rotate-12 transition-transform duration-300" />
                          <span className="font-semibold text-sm">Twitter</span>
                        </a>

                        {/* GitHub */}
                        <a
                          href={member.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`member-${index + 1}-github`}
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group/link"
                        >
                          <Github className="w-5 h-5 group-hover/link:rotate-12 transition-transform duration-300" />
                          <span className="font-semibold text-sm">GitHub</span>
                        </a>

                        {/* Email */}
                        <a
                          href={`mailto:${member.socials.email}`}
                          data-testid={`member-${index + 1}-email`}
                          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group/link"
                        >
                          <Mail className="w-5 h-5 group-hover/link:rotate-12 transition-transform duration-300" />
                          <span className="font-semibold text-sm">Email</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Floating Hearts on Hover */}
                  {hoveredCard === member.id && (
                    <>
                      <Heart className="absolute top-10 right-10 w-6 h-6 text-pink-400 animate-float opacity-60" />
                      <Heart className="absolute bottom-20 left-10 w-4 h-4 text-purple-400 animate-float-delayed opacity-60" />
                      <Star className="absolute top-20 left-20 w-5 h-5 text-yellow-400 animate-float opacity-60" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="inline-block relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl px-8 py-6 border border-gray-200 dark:border-slate-700">
                <p className="text-lg text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  Want to join our team?
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  We're always looking for talented individuals!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
