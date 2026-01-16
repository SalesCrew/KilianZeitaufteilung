'use client';

import { motion } from 'framer-motion';
import { TimeEntry, COMPANY_THEMES } from '@/lib/types';
import { formatTime, calculateDuration, formatDurationShort, formatDateShort } from '@/lib/utils';

interface TimeBlockProps {
  entry: TimeEntry;
  index: number;
}

export default function TimeBlock({ entry, index }: TimeBlockProps) {
  const theme = COMPANY_THEMES[entry.company];
  const duration = calculateDuration(entry.start_time, entry.end_time);
  const startTime = formatTime(entry.start_time);
  const endTime = entry.end_time ? formatTime(entry.end_time) : 'ongoing';
  const dateStr = formatDateShort(entry.start_time);

  return (
    <motion.div
      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#FAFAFA]/50"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: theme.primary }}
      />
      <span className="text-xs text-[#1A1A1A]/25 font-medium min-w-[50px]">
        {dateStr}
      </span>
      <span className="text-sm text-[#6B7280] font-medium min-w-[100px]">
        {startTime} - {endTime}
      </span>
      <span 
        className={`text-sm font-medium ${theme.fontClass}`}
        style={{ color: theme.primary }}
      >
        {theme.name}
      </span>
      <span className="text-sm text-[#9CA3AF] ml-auto">
        {formatDurationShort(duration)}
      </span>
    </motion.div>
  );
}
