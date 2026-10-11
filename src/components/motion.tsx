"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

/**
 * A number that counts up from 0 the first time it's shown (and from the old value when it changes).
 * The server renders the final number, so it's right even before JavaScript loads.
 */
export function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const shown = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) return mv.set(value);
    const from = mv.get() === value ? 0 : mv.get(); // first view: from 0; later updates: from where it was
    const controls = animate(mv, value, { from, duration: 0.4, delay, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [value, delay, reduce, mv]);

  return <motion.span>{shown}</motion.span>;
}

// The dashboard's one load sequence: children of <Reveal> fade + rise in turn, 50ms apart (~400ms total).
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export function Reveal({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function RevealItem({ className, children, as = "div" }: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "li";
}) {
  const Tag = motion[as];
  return <Tag className={className} variants={item}>{children}</Tag>;
}
