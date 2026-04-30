import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Sparkles, Check, Play, Star, Zap, Brain, Users, Shield,
  GraduationCap, Trophy, Wallet as WalletIcon, MessageSquare, Sun, Moon,
  ArrowUpRight, Code2, Rocket,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const logos = ['stripe', 'linear', 'notion', 'figma', 'vercel', 'framer', 'arc', 'raycast'];

const Landing = () => {
  const { theme, toggle } = useTheme();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -80]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  return (
    <div className="relative min-h-screen aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white">
      {/* blobs */}
      <div className="blob w-[600px] h-[600px] -left-40 -top-40 bg-cyan-400/40" />
      <div className="blob w-[500px] h-[500px] -right-40 top-40 bg-coral-400/35" style={{ animationDelay: '-6s' }} />

      {/* Top Bar */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .6 }} className="sticky top-0 z-40 glass-strong">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-ink-950 text-cyan-300 grid place-items-center ring-1 ring-white/10">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="font-display text-[22px]">Talent<span className="italic text-gradient-cyan">Connect</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-ink-600 dark:text-ink-200">
            <a href="#features" className="hover:text-ink-950 dark:hover:text-white">Features</a>
            <a href="#bento" className="hover:text-ink-950 dark:hover:text-white">Product</a>
            <a href="#pricing" className="hover:text-ink-950 dark:hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-ink-950 dark:hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="w-9 h-9 rounded-full glass grid place-items-center" data-testid="landing-theme">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300"/> : <Moon className="w-4 h-4"/>}
            </button>
            <Link to="/login" className="btn btn-ghost" data-testid="landing-login">Sign in</Link>
            <Link to="/register" className="btn btn-cyan" data-testid="landing-get-started">Get Started <ArrowRight className="w-4 h-4"/></Link>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-24 pb-28">
        <motion.div style={{ y: yParallax }} className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }} className="chip chip-cyan mb-6">
              <Sparkles className="w-3 h-3"/> 2026 · skill exchange reimagined
            </motion.div>
            <h1 className="font-display text-[56px] md:text-[84px] leading-[.92] tracking-tight">
              Where talent
              <br/>
              meets <span className="italic text-gradient">magnetic</span>
              <br/>
              opportunity.
            </h1>
            <p className="mt-6 max-w-xl text-ink-600 dark:text-ink-200 text-lg leading-relaxed">
              A premium marketplace for skill-trade, mentorship and learning tracks — powered by an
              AI co-pilot that matches, nudges and grows you every single day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn btn-coral px-6 py-3" data-testid="hero-primary-cta">Start free <ArrowRight className="w-4 h-4"/></Link>
              <a href="#bento" className="btn btn-ghost px-6 py-3"><Play className="w-4 h-4"/> Watch tour</a>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-ink-500 dark:text-ink-300">
              <div className="flex -space-x-2">
                {[0,1,2,3].map(i => (
                  <span key={i} className={`w-8 h-8 rounded-full ring-2 ring-background bg-gradient-to-br ${['from-cyan-400 to-indigo-500','from-coral-400 to-pink-500','from-amber-300 to-coral-400','from-emerald-400 to-cyan-500'][i]}`}/>
                ))}
              </div>
              <div>
                <span className="flex items-center gap-1 text-amber-500">
                  {[0,1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current"/>)}
                </span>
                <span>Loved by <b className="text-ink-950 dark:text-white">38,410</b> learners & mentors</span>
              </div>
            </div>
          </div>

          {/* Hero collage */}
          <div className="relative h-[560px]">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }} className="absolute top-6 right-0 w-[380px] glass-strong rounded-3xl p-5 shadow-soft-lg rotate-[3deg]">
              <div className="flex items-center justify-between mb-3">
                <span className="chip chip-cyan"><Brain className="w-3 h-3"/> AI match</span>
                <span className="text-xs text-ink-500">98% fit</span>
              </div>
              <p className="font-display text-2xl leading-tight">“You'd pair great with <span className="text-gradient">Amelia</span> for a Rust ↔ Figma trade.”</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-pink-500"/>
                <div>
                  <p className="text-sm font-semibold">Amelia Cho · Sr. Designer</p>
                  <p className="text-xs text-ink-500">Online · Berlin</p>
                </div>
                <button className="ml-auto btn btn-primary px-3 py-1.5 text-xs">Connect</button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .35 }} className="absolute top-48 left-0 w-[320px] glass rounded-3xl p-5 -rotate-[4deg]">
              <p className="text-xs uppercase tracking-widest text-ink-500 mb-2">Weekly streak</p>
              <div className="flex items-end gap-1.5 h-24">
                {[40,60,35,75,90,55,80].map((h,i) => (
                  <div key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500 to-cyan-300 dark:from-cyan-400 dark:to-cyan-200" style={{ height: `${h}%`}}/>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                <span>MON</span><span>SUN</span>
              </div>
              <p className="mt-3 font-display text-xl"><span className="text-gradient">12-day</span> streak 🔥</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }} className="absolute bottom-0 right-6 w-[300px] bento p-5 bg-ink-950 text-white">
              <div className="flex items-center gap-2 text-xs text-cyan-300"><WalletIcon className="w-3.5 h-3.5"/> Wallet</div>
              <p className="mt-2 font-display text-5xl">₹ 28,420</p>
              <div className="mt-4 flex items-center justify-between text-xs text-ink-300">
                <span>+ ₹3,200 this week</span>
                <span className="chip chip-cyan">Earnings up 18%</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Logos marquee */}
      <section className="py-8 border-y border-black/5 dark:border-white/10 glass">
        <div className="marquee">
          <div className="marquee-track font-display text-3xl md:text-5xl text-ink-400 dark:text-ink-300">
            {[...logos, ...logos].map((l, i) => (
              <span key={i} className="whitespace-nowrap italic opacity-70">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-end mb-14">
            <div data-reveal>
              <span className="chip chip-coral mb-4"><Zap className="w-3 h-3"/> flagship features</span>
              <h2 className="font-display text-5xl md:text-6xl leading-[.95]">A toolkit built for the <span className="italic text-gradient">next generation</span> of talent.</h2>
            </div>
            <p data-reveal className="text-ink-600 dark:text-ink-200 text-lg">
              From AI mentor-matching to a token economy that rewards skill-trade — every surface is
              engineered with Stripe-like polish and Notion-like clarity.
            </p>
          </div>
          <div id="bento" className="grid grid-cols-12 gap-4 md:gap-5 auto-rows-[180px]">
            <Card className="col-span-12 md:col-span-7 row-span-2 bg-ink-950 text-white p-8" data-reveal>
              <div className="flex items-center gap-2 text-cyan-300 text-xs uppercase tracking-widest"><Brain className="w-3.5 h-3.5"/> AI copilot</div>
              <h3 className="font-display text-4xl md:text-5xl mt-4 leading-tight">Your career assistant, in <span className="italic text-gradient">residence</span>.</h3>
              <p className="mt-3 text-ink-300 max-w-lg">Plans your weekly roadmap, drafts intros, analyzes your resume and surfaces the mentors that actually move the needle.</p>
              <div className="mt-6 glass rounded-2xl p-4">
                <p className="font-mono text-xs text-cyan-300">&gt; copilot.suggest(&quot;next step&quot;)</p>
                <p className="mt-1 text-sm">→ Ship a micro-case study on <b>system design</b>, then open a paid mentorship with <b>Kenji</b>. ETA 7 days. <span className="caret"/></p>
              </div>
            </Card>
            <Card className="col-span-12 md:col-span-5 p-6" data-reveal>
              <span className="chip chip-cyan mb-2"><Users className="w-3 h-3"/> smart match</span>
              <h3 className="font-display text-2xl mt-2">Swipe into collaborations</h3>
              <p className="text-sm text-ink-500 mt-1">A match engine tuned to your skill gaps.</p>
              <div className="mt-4 relative h-24">
                {[0,1,2].map(i => (
                  <div key={i} className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${['from-cyan-300 to-indigo-400','from-coral-400 to-pink-500','from-amber-300 to-coral-400'][i]}`} style={{ transform: `translate(${i*10}px, ${i*6}px) rotate(${-4+i*4}deg)`, opacity: 1-i*0.25 }}/>
                ))}
              </div>
            </Card>
            <Card className="col-span-6 md:col-span-4 p-6" data-reveal>
              <Trophy className="w-6 h-6 text-coral-500"/>
              <h3 className="font-display text-2xl mt-3">Leaderboards & XP</h3>
              <p className="text-sm text-ink-500 mt-1">Gamified growth that Gen Z actually returns for.</p>
            </Card>
            <Card className="col-span-6 md:col-span-4 p-6" data-reveal>
              <WalletIcon className="w-6 h-6 text-cyan-500"/>
              <h3 className="font-display text-2xl mt-3">Token economy</h3>
              <p className="text-sm text-ink-500 mt-1">Earn for teaching. Spend on mentorship. Withdraw anytime.</p>
            </Card>
            <Card className="col-span-12 md:col-span-4 p-6" data-reveal>
              <Shield className="w-6 h-6 text-emerald-500"/>
              <h3 className="font-display text-2xl mt-3">Verified mentors</h3>
              <p className="text-sm text-ink-500 mt-1">Every mentor KYC-checked. Escrowed sessions. Full refunds.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Big stats */}
      <section className="py-24 border-y border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-8">
          {[
            { k: '38.4k', l: 'active learners' },
            { k: '12.1k', l: 'mentors onboarded' },
            { k: '₹4.2 Cr', l: 'rewards earned' },
            { k: '96%', l: 'match satisfaction' },
          ].map((s, i) => (
            <div key={i} data-reveal className="">
              <p className="font-display text-6xl md:text-7xl leading-none">{s.k}</p>
              <p className="mt-2 text-ink-500 uppercase tracking-widest text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 data-reveal className="font-display text-5xl md:text-6xl mb-12 max-w-3xl">Loved by people who <span className="italic text-gradient">ship things</span>.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { q: 'Felt like hiring a personal growth coach for the price of a coffee. My AI roadmap is scary accurate.', a: 'Nikhil R.', r: 'Software Eng · Bangalore' },
              { q: 'I teach Figma 2 hours a week and learned Rust in exchange. No money ever left my account. Magic.', a: 'Amelia C.', r: 'Designer · Berlin' },
              { q: "The leaderboard turned my study sessions into a sport. I'm climbing ranks and actually learning.', a: 'Sara P.', r: 'MBA Student · Mumbai" },
            ].map((t, i) => (
              <div key={i} data-reveal className="bento p-7">
                <Star className="w-5 h-5 text-amber-400 fill-current"/>
                <p className="font-display text-2xl leading-snug mt-3">“{t.q}”</p>
                <p className="mt-5 text-sm font-semibold">{t.a}</p>
                <p className="text-xs text-ink-500">{t.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-xl mb-12">
            <span className="chip chip-cyan mb-4">pricing</span>
            <h2 className="font-display text-5xl md:text-6xl">Fair pricing. <span className="italic text-gradient">Zero surprises.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { t: 'Starter', p: 'Free', f: ['AI weekly roadmap','3 mentor matches / month','Community access'] },
              { t: 'Pro', p: '₹499/mo', featured: true, f: ['Unlimited mentor matches','AI resume analyzer','Priority token payouts','Custom roadmap'] },
              { t: 'Team', p: '₹2,499/mo', f: ['Shared workspaces','Team leaderboards','Admin dashboard','SSO + SLA'] },
            ].map((p, i) => (
              <div key={i} data-reveal className={`bento p-7 ${p.featured ? 'bg-ink-950 text-white' : ''}`}>
                {p.featured && <span className="chip chip-coral">most loved</span>}
                <p className={`mt-3 text-sm uppercase tracking-widest ${p.featured ? 'text-cyan-300' : 'text-ink-500'}`}>{p.t}</p>
                <p className="font-display text-5xl mt-2">{p.p}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.f.map((x) => (
                    <li key={x} className="flex items-start gap-2"><Check className={`w-4 h-4 mt-0.5 ${p.featured ? 'text-cyan-300' : 'text-cyan-500'}`}/><span>{x}</span></li>
                  ))}
                </ul>
                <Link to="/register" className={`mt-6 w-full btn ${p.featured ? 'btn-cyan' : 'btn-ghost'}`}>Start now <ArrowUpRight className="w-4 h-4"/></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 data-reveal className="font-display text-6xl md:text-8xl leading-[.9]">Ready to <span className="italic text-gradient">grow</span>?</h2>
          <p className="mt-6 text-ink-600 dark:text-ink-200 text-lg">Join in 60 seconds. No credit card. Cancel anytime.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register" className="btn btn-coral px-7 py-3"><Rocket className="w-4 h-4"/> Start free</Link>
            <Link to="/login" className="btn btn-ghost px-7 py-3">Sign in</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10 py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-ink-500">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-ink-950 text-cyan-300 grid place-items-center"><GraduationCap className="w-4 h-4"/></span>
            <span>© 2026 TalentConnect. Crafted with care.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink-950 dark:hover:text-white">Terms</a>
            <a href="#" className="hover:text-ink-950 dark:hover:text-white">Privacy</a>
            <a href="#" className="hover:text-ink-950 dark:hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Card = ({ className = '', children, ...rest }) => (
  <div className={`bento bento-glow ${className}`} {...rest}>{children}</div>
);

export default Landing;
