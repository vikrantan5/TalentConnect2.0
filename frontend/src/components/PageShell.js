import React, { useEffect, useRef } from 'react';
import Navbar from './Navbar';

/**
 * PageShell — aurora/grid background + reveal-on-scroll for every dashboard page
 */
const PageShell = ({ children, withNavbar = true, className = '' }) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.08 }
    );
    const els = rootRef.current?.querySelectorAll('[data-reveal]') || [];
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  return (
    <div ref={rootRef} className={`relative min-h-screen aurora-bg grid-bg overflow-hidden ${className}`}>
      {/* Floating blobs */}
      <div className="blob w-[480px] h-[480px] -left-40 top-10 bg-cyan-400/30" />
      <div className="blob w-[360px] h-[360px] right-[-6rem] top-[30%] bg-coral-400/30" style={{ animationDelay: '-4s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/25" style={{ animationDelay: '-8s' }} />

      {withNavbar && <Navbar />}
      <main className="relative z-10">{children}</main>
    </div>
  );
};

export default PageShell;
