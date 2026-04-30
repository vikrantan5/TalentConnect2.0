import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CountUp = ({ to = 100, duration = 1.2, prefix = '', suffix = '', decimals = 0 }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(eased * to);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span>{prefix}{v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{suffix}</span>;
};

export const FadeIn = ({ delay = 0, children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Stagger = ({ children, className = '' }) => (
  <motion.div
    variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Item = ({ children, className = '' }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Bars = ({ values = [], color = 'from-cyan-400 to-cyan-200' }) => (
  <div className="flex items-end gap-1.5 h-28">
    {values.map((h, i) => (
      <motion.div
        key={i}
        initial={{ height: 0 }}
        whileInView={{ height: `${h}%` }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`flex-1 rounded-t-xl bg-gradient-to-t ${color}`}
      />
    ))}
  </div>
);
