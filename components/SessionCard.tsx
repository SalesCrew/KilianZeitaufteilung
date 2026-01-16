'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeEntry, Company, COMPANY_THEMES } from '@/lib/types';
import { formatDurationShort, calculateDuration } from '@/lib/utils';
import TimeBlock from './TimeBlock';

interface SessionCardProps {
  entries: TimeEntry[];
  index: number;
}

interface CompanySummary {
  company: Company;
  totalDuration: number;
  entries: TimeEntry[];
}

export default function SessionCard({ entries, index }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group entries by company and calculate totals
  const companySummaries = entries.reduce<Record<Company, CompanySummary>>((acc, entry) => {
    const duration = calculateDuration(entry.start_time, entry.end_time);
    if (!acc[entry.company]) {
      acc[entry.company] = {
        company: entry.company,
        totalDuration: 0,
        entries: [],
      };
    }
    acc[entry.company].totalDuration += duration;
    acc[entry.company].entries.push(entry);
    return acc;
  }, {} as Record<Company, CompanySummary>);

  const summaries = Object.values(companySummaries);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-[#E5E7EB]/60 overflow-hidden shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FAFAFA]/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          {/* Company color indicators */}
          <div className="flex -space-x-1">
            {summaries.map((summary) => (
              <div
                key={summary.company}
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: COMPANY_THEMES[summary.company].primary }}
              />
            ))}
          </div>
          
          {/* Company names and durations */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {summaries.map((summary) => {
              const theme = COMPANY_THEMES[summary.company];
              return (
                <span
                  key={summary.company}
                  className={`text-sm font-medium ${theme.fontClass}`}
                  style={{ color: theme.primary }}
                >
                  {theme.name}: {formatDurationShort(summary.totalDuration)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Chevron */}
        <motion.svg
          className="w-5 h-5 text-[#9CA3AF]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 border-t border-[#E5E7EB]/40">
              <div className="space-y-1 mt-2">
                {entries.map((entry, idx) => (
                  <TimeBlock key={entry.id} entry={entry} index={idx} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
