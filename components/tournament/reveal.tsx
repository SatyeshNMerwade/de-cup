'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Scroll-triggered fade+rise, once per element. Used for section-level
 * content on long pages (season page, stats page) so the page reveals
 * itself as the visitor scrolls instead of everything just being there.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}

/**
 * Mount-triggered pop (scale+opacity) for award-style pills and tags —
 * shared by award-tags.tsx and bracket-parts.tsx so every "result just
 * landed" moment in the app reads the same way.
 */
export function PopIn({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="inline-block"
      suppressHydrationWarning
    >
      {children}
    </motion.span>
  );
}
