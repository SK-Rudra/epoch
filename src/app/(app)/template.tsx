"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

// A template re-mounts on every navigation, so this plays a short fade + rise each time you change page.
// Not on the very first load: the page would stay invisible until JavaScript loads, which delays first paint.
let firstLoadDone = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const animate = firstLoadDone;
  useEffect(() => {
    firstLoadDone = true;
  }, []);

  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  );
}
