'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TimeEntry } from '@/lib/types';
import { getDateLabel, getViennaDateString, calculateDuration, formatDurationShort, formatFullDate } from '@/lib/utils';
import SessionCard from './SessionCard';

interface HistoryPanelProps {
  entries: TimeEntry[];
}

interface DayGroup {
  date: string;
  label: string;
  fullDate: string;
  entries: TimeEntry[];
  totalDuration: number;
}

export default function HistoryPanel({ entries }: HistoryPanelProps) {
  // Group entries by day (Vienna timezone)
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: Record<string, TimeEntry[]> = {};

    entries.forEach((entry) => {
      const dateKey = getViennaDateString(new Date(entry.start_time));
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
      .map(([date, dayEntries]) => {
        const totalDuration = dayEntries.reduce((sum, entry) => {
          return sum + calculateDuration(entry.start_time, entry.end_time);
        }, 0);

        return {
          date,
          label: getDateLabel(date),
          fullDate: formatFullDate(date),
          entries: dayEntries.sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          ),
          totalDuration,
        };
      });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <div className="text-[#9CA3AF] text-sm">
          No time entries yet. Start tracking to see your history here.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      {dayGroups.map((group, groupIndex) => (
        <div key={group.date}>
          {/* Day header */}
          <motion.div
            className="flex items-center justify-between mb-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + groupIndex * 0.1 }}
          >
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{group.label}</h3>
              <span className="text-xs text-[#1A1A1A]/30">{group.fullDate}</span>
            </div>
            <span className="text-sm text-[#6B7280]">
              {formatDurationShort(group.totalDuration)} total
            </span>
          </motion.div>

          {/* Session cards for this day */}
          <div className="space-y-2">
            <SessionCard entries={group.entries} index={groupIndex} />
          </div>
        </div>
      ))}
    </motion.div>
  );
}
