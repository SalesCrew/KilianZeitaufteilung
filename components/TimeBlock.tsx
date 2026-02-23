'use client';

import { motion } from 'framer-motion';
import { TimeEntry, Project, COMPANY_THEMES } from '@/lib/types';
import { formatTime, calculateDuration, formatDurationShort, formatDateShort } from '@/lib/utils';

interface TimeBlockProps {
  entry: TimeEntry;
  index: number;
  projects: Project[];
}

export default function TimeBlock({ entry, index, projects }: TimeBlockProps) {
  const isSick = entry.is_sick_day;
  const theme = COMPANY_THEMES[entry.company];
  const duration = calculateDuration(entry.start_time, entry.end_time);
  const startTime = formatTime(entry.start_time);
  const endTime = entry.end_time ? formatTime(entry.end_time) : 'ongoing';
  const dateStr = formatDateShort(entry.start_time);
  const isSunday = new Date(entry.start_time).getDay() === 0;

  const project = entry.project || projects.find((p) => p.id === entry.project_id);
  const projectName = project?.name;

  return (
    <motion.div
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
      style={{ backgroundColor: isSick ? '#FEF2F2' : 'rgba(250,250,250,0.5)' }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: isSick ? '#DC2626' : theme.primary }}
      />
      <span className="text-xs text-[#1A1A1A]/25 font-medium min-w-[45px]">
        {dateStr}
      </span>
      <span className="text-sm text-[#6B7280] font-medium min-w-[90px]">
        {startTime} - {endTime}
      </span>
      <div className="flex flex-col flex-grow min-w-0">
        {isSick ? (
          <span className="text-sm font-medium truncate text-[#DC2626]">
            Krankenstand
          </span>
        ) : (
          <>
            <span 
              className={`text-sm font-medium truncate ${theme.fontClass}`}
              style={{ color: theme.primary }}
            >
              {theme.name}
            </span>
            {projectName && (
              <span className="text-xs text-[#9CA3AF] truncate">
                {projectName}
              </span>
            )}
          </>
        )}
      </div>
      <span className="text-sm text-[#9CA3AF] flex-shrink-0 flex items-center gap-1.5">
        {formatDurationShort(duration)}
        {isSunday && <span className="text-xs text-[#9CA3AF]/50 font-medium">2x</span>}
      </span>
    </motion.div>
  );
}
