'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { StatsPageData } from '@/lib/services';

import { StatsOverview } from './stats-overview';
import { StatsRivalry } from './stats-rivalry';
import { StatsProfile } from './stats-profile';
import { StatsToss } from './stats-toss';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'rivalry', label: 'Rivalry' },
  { key: 'profile', label: 'Player Profile' },
  { key: 'toss', label: 'Toss & Break' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function StatsTabs({ data }: { data: StatsPageData }) {
  const [tab, setTab] = useState<TabKey>('overview');
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {tab === 'overview' && <StatsOverview players={data.players} highlights={data.highlights} />}
          {tab === 'rivalry' && <StatsRivalry headToHead={data.headToHead} breakSplit={data.tossBreak?.breakSplit} />}
          {tab === 'profile' && <StatsProfile profiles={data.profiles} />}
          {tab === 'toss' && <StatsToss tossBreak={data.tossBreak} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
