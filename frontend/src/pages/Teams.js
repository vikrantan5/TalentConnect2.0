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
      gradient: 'from-cyan-400 to-indigo-500',
      badgeGradient: 'from-cyan-500 to-indigo-600'
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
      gradient: 'from-coral-400 to-pink-500',
      badgeGradient: 'from-coral-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white">
      {/* Floating blobs — matches LandingPage */}
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-ink-500 dark:text-ink-300 hover:text-ink-950 dark:hover:text-white transition-colors duration-300 mb-8 group"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-semibold">Back to Dashboard</span>
        </Link>

        {/* Page Header — ink-navy aurora hero */}
        <div className="relative mb-16 animate-scale-in">
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-10 md:p-14 shadow-soft-lg text-center">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.32), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.25), transparent 60%)',
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-cyan-300 backdrop-blur-md">
                  <Users className="w-8 h-8" />
                </div>
              </div>
              <span className="chip chip-cyan mb-4"><Sparkles className="w-3 h-3" /> the people</span>
              <h1 className="font-display text-5xl md:text-7xl leading-[.95] tracking-tight">
                Meet our <span className="italic text-gradient-cyan">team</span>.
              </h1>
              <p className="mt-5 text-ink-300 max-w-2xl mx-auto leading-relaxed text-lg">
                Talented individuals working together to build amazing experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              data-testid={`team-member-${index + 1}`}
              className="group relative bento bento-glow p-0 overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 120}ms` }}
              onMouseEnter={() => setHoveredCard(member.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Decorative top border */}
              <div className={`h-1.5 bg-gradient-to-r ${member.gradient}`} />

              <div className="p-8">
                {/* Profile Image */}
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${member.gradient} opacity-30 blur-xl transition-opacity duration-500 group-hover:opacity-60`} />
                  <div className="relative w-full h-full rounded-3xl overflow-hidden ring-2 ring-white/70 dark:ring-white/10 shadow-soft-lg group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
                  </div>

                  {/* Floating Badge */}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${member.badgeGradient} shadow-soft ring-2 ring-white dark:ring-ink-950 group-hover:scale-110 transition-transform duration-300`}>
                      <Star className="w-4 h-4 text-white inline-block" />
                    </div>
                  </div>
                </div>

                {/* Name & Role */}
                <div className="text-center mb-6">
                  <h3 className="font-display text-3xl leading-tight">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 font-semibold">
                    {member.role}
                  </p>
                </div>

                {/* Bio */}
                <p className="text-ink-500 dark:text-ink-300 text-center leading-relaxed mb-8 min-h-[80px] flex items-center justify-center">
                  {member.bio}
                </p>

                {/* Divider */}
                <div className="dotted-sep mb-8" />

                {/* Social Links */}
                <div>
                  <p className="chip chip-cyan mb-4 mx-auto" style={{ display: 'inline-flex' }}>connect with me</p>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={member.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`member-${index + 1}-linkedin`}
                      className="btn btn-ghost py-2.5 hover:shadow-soft transition group/link"
                    >
                      <Linkedin className="w-4 h-4 text-cyan-500 group-hover/link:rotate-12 transition-transform" />
                      <span className="text-sm">LinkedIn</span>
                    </a>
                    <a
                      href={member.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`member-${index + 1}-twitter`}
                      className="btn btn-ghost py-2.5 hover:shadow-soft transition group/link"
                    >
                      <Twitter className="w-4 h-4 text-cyan-500 group-hover/link:rotate-12 transition-transform" />
                      <span className="text-sm">Twitter</span>
                    </a>
                    <a
                      href={member.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`member-${index + 1}-github`}
                      className="btn btn-ghost py-2.5 hover:shadow-soft transition group/link"
                    >
                      <Github className="w-4 h-4 text-ink-700 dark:text-ink-200 group-hover/link:rotate-12 transition-transform" />
                      <span className="text-sm">GitHub</span>
                    </a>
                    <a
                      href={`mailto:${member.socials.email}`}
                      data-testid={`member-${index + 1}-email`}
                      className="btn btn-coral py-2.5 group/link"
                    >
                      <Mail className="w-4 h-4 group-hover/link:rotate-12 transition-transform" />
                      <span className="text-sm">Email</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Floating Hearts on Hover */}
              {hoveredCard === member.id && (
                <>
                  <Heart className="absolute top-10 right-10 w-6 h-6 text-coral-400 animate-float opacity-60" />
                  <Heart className="absolute bottom-20 left-10 w-4 h-4 text-cyan-400 animate-float opacity-60" style={{ animationDelay: '1s' }} />
                  <Star className="absolute top-20 left-20 w-5 h-5 text-amber-400 animate-float opacity-60" style={{ animationDelay: '.5s' }} />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 animate-scale-in" style={{ animationDelay: '600ms' }}>
          <div className="inline-block bento p-8">
            <span className="chip chip-coral mb-3"><Sparkles className="w-3 h-3" /> hiring</span>
            <h3 className="font-display text-3xl mt-2">
              Want to <span className="italic text-gradient">join us?</span>
            </h3>
            <p className="mt-2 text-ink-500 dark:text-ink-300">
              We're always looking for talented individuals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
