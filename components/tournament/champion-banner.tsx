'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ConfettiPiece {
  id: number;
  left: number; // vw percent
  color: string;
  rotate: number;
  delay: number;
  duration: number;
  drift: number;
}

const COLORS = ['bg-primary', 'bg-ring', 'bg-destructive', 'bg-card'];

function makePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotate: Math.random() * 360,
    delay: Math.random() * 1.8,
    duration: 3.5 + Math.random() * 2.2,
    drift: (Math.random() - 0.5) * 160,
  }));
}

/**
 * Random per-piece values only ever get generated client-side, after mount
 * — SSR and the client's first paint both render zero pieces, so there's
 * nothing for React to mismatch on hydration.
 */
function Confetti() {
  const reduceMotion = useReducedMotion();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (reduceMotion) return;
    // Deliberately client-only: Math.random() here (not during render, not in a
    // lazy useState initializer) is what keeps SSR and the client's first paint
    // identical, so hydration never has real random values to mismatch on.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(makePieces(90));
  }, [reduceMotion]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0 overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute top-0 h-3.5 w-2.5 rounded-sm ${p.color} ${p.color === 'bg-card' ? 'border border-border' : ''}`}
          style={{ left: `${p.left}vw` }}
          initial={{ y: -20, opacity: 1, rotate: p.rotate }}
          animate={{ y: '95vh', x: p.drift, opacity: [1, 1, 0], rotate: p.rotate + 360 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            opacity: { duration: p.duration, delay: p.delay, times: [0, 0.75, 1] },
          }}
        />
      ))}
    </div>
  );
}

export function ChampionBanner({ name }: { name: string }) {
  return (
    <div className="mt-6 flex justify-center">
      <Confetti />
      <p className="rounded-full border border-ring/40 bg-linear-to-r from-secondary to-accent px-6 py-2.5 font-serif text-lg font-bold text-destructive shadow-sm">
        🏆 {name} is the defending champion! 🏆
      </p>
    </div>
  );
}
