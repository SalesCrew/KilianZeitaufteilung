'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeEntry, Company, Project, COMPANY_THEMES } from '@/lib/types';
import { formatDurationShort, calculateDuration } from '@/lib/utils';
import TimeBlock from './TimeBlock';

interface SessionCardProps {
  entries: TimeEntry[];
  index: number;
  projects: Project[];
  onEditEntry?: (entryId: string, updates: Partial<TimeEntry>) => void;
}

interface CompanySummary {
  company: Company;
  totalDuration: number;
  entries: TimeEntry[];
  projectNames: Set<string>;
  hasHomeOffice: boolean;
}

export default function SessionCard({ entries, index, projects, onEditEntry }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSickDay = entries.some((e) => e.is_sick_day);
  const sickDuration = entries
    .filter((e) => e.is_sick_day)
    .reduce((sum, e) => sum + calculateDuration(e.start_time, e.end_time), 0);

  const companySummaries = entries
    .filter((e) => !e.is_sick_day)
    .reduce<Record<Company, CompanySummary>>((acc, entry) => {
      const duration = calculateDuration(entry.start_time, entry.end_time);
      if (!acc[entry.company]) {
        acc[entry.company] = {
          company: entry.company,
          totalDuration: 0,
          entries: [],
          projectNames: new Set(),
          hasHomeOffice: false,
        };
      }
      acc[entry.company].totalDuration += duration;
      acc[entry.company].entries.push(entry);
      if (entry.is_home_office) acc[entry.company].hasHomeOffice = true;

      const project = entry.project || projects.find((p) => p.id === entry.project_id);
      if (project?.name) {
        acc[entry.company].projectNames.add(project.name);
      }

      return acc;
    }, {} as Record<Company, CompanySummary>);

  const summaries = Object.values(companySummaries);

  const isSunday = entries.length > 0 && new Date(entries[0].start_time).getDay() === 0;
  const hasAnyHomeOffice = entries.some((e) => e.is_home_office && !e.is_sick_day);

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
        <div className="flex items-center gap-3 flex-grow min-w-0">
          {/* Company color indicators */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <div className="flex -space-x-1">
              {hasSickDay && (
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: '#DC2626' }}
                />
              )}
              {summaries.map((summary) => {
                const theme = COMPANY_THEMES[summary.company];
                if (!theme) return null;
                return (
                  <div
                    key={summary.company}
                    className="w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: theme.primary }}
                  />
                );
              })}
            </div>
            {hasAnyHomeOffice && (
              <svg className="w-3 h-3 text-[#9CA3AF]/40 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
          </div>
          
          {/* Company names, projects and durations */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {hasSickDay && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#DC2626] flex items-center gap-1.5">
                    Krankenstand: {formatDurationShort(sickDuration)}
                    {isSunday && <span className="text-xs opacity-40 font-medium">2x</span>}
                  </span>
                </div>
              )}
              {summaries.map((summary) => {
                const theme = COMPANY_THEMES[summary.company];
                if (!theme) return null;
                const projectList = Array.from(summary.projectNames);
                return (
                  <div key={summary.company} className="flex flex-col">
                    <span
                      className={`text-sm font-medium ${theme.fontClass} flex items-center gap-1.5`}
                      style={{ color: theme.primary }}
                    >
                      {theme.name}: {formatDurationShort(summary.totalDuration)}
                      {isSunday && <span className="text-xs opacity-40 font-medium">2x</span>}
                    </span>
                    {projectList.length > 0 && (
                      <span className="text-xs text-[#9CA3AF] truncate max-w-[150px]">
                        {projectList.join(', ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chevron */}
        <motion.svg
          className="w-5 h-5 text-[#9CA3AF] flex-shrink-0 ml-2"
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
                  <TimeBlock key={entry.id} entry={entry} index={idx} projects={projects} onEditEntry={onEditEntry} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
