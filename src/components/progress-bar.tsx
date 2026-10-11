"use client";

import { motion } from "motion/react";

/** Thin bar: grid track, plot fill that grows from 0 the first time it's shown. */
export function ProgressBar({ label, value, delay = 0, className = "h-[3px]" }: {
  label: string;
  value: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`overflow-hidden rounded-full bg-grid ${className}`}
    >
      {/* scaleX instead of width: animates on the GPU and never moves anything around it. */}
      <motion.div
        className="h-full origin-left bg-plot"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.min(value, 100) / 100 }}
        transition={{ duration: 0.4, delay }}
      />
    </div>
  );
}
