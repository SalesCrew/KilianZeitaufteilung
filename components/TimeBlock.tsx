'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeEntry, Company, Project, COMPANY_THEMES } from '@/lib/types';
import { formatTime, calculateDuration, formatDurationShort, formatDateShort } from '@/lib/utils';

interface TimeBlockProps {
  entry: TimeEntry;
  index: number;
  projects: Project[];
  onEditEntry?: (entryId: string, updates: Partial<TimeEntry>) => void;
}

const companies: Company[] = ['merchandising', 'salescrew', 'inkognito'];

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

function isValidTime(t: string): boolean {
  const m = t.match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

function InlineTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setInputValue(formatted);
    if (isValidTime(formatted)) onChange(formatted);
  };

  const handleBlur = () => {
    if (!isValidTime(inputValue)) setInputValue(value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="00:00"
      maxLength={5}
      className="w-[60px] py-1.5 px-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#1A1A1A] outline-none focus:border-[#6B7280] bg-white text-center"
    />
  );
}

export default function TimeBlock({ entry, index, projects, onEditEntry }: TimeBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editCompany, setEditCompany] = useState<Company>(entry.company);
  const [editProjectId, setEditProjectId] = useState<string | null>(entry.project_id);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editHomeOffice, setEditHomeOffice] = useState(entry.is_home_office ?? false);
  const editRef = useRef<HTMLDivElement>(null);

  const isSick = entry.is_sick_day;
  const theme = COMPANY_THEMES[entry.company] || COMPANY_THEMES.merchandising;
  const duration = calculateDuration(entry.start_time, entry.end_time);
  const startTime = formatTime(entry.start_time);
  const endTime = entry.end_time ? formatTime(entry.end_time) : 'ongoing';
  const dateStr = formatDateShort(entry.start_time);
  const isSunday = new Date(entry.start_time).getDay() === 0;
  const isHO = entry.is_home_office;

  const project = entry.project || projects.find((p) => p.id === entry.project_id);
  const projectName = project?.name;

  const openEdit = () => {
    if (isSick || !onEditEntry) return;
    setEditCompany(entry.company);
    setEditProjectId(entry.project_id);
    setEditStart(formatTime(entry.start_time));
    setEditEnd(entry.end_time ? formatTime(entry.end_time) : '');
    setEditHomeOffice(entry.is_home_office ?? false);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!onEditEntry || !editStart || !editEnd) return;
    if (!isValidTime(editStart) || !isValidTime(editEnd)) return;

    const datePrefix = entry.start_time.split('T')[0];
    const newStart = new Date(`${datePrefix}T${editStart}:00`).toISOString();
    const newEnd = new Date(`${datePrefix}T${editEnd}:00`).toISOString();

    onEditEntry(entry.id, {
      company: editCompany,
      project_id: editProjectId,
      start_time: newStart,
      end_time: newEnd,
      is_home_office: editHomeOffice,
    });
    setIsEditing(false);
  };

  const editCompanyProjects = projects.filter((p) => p.company === editCompany && !p.archived);

  useEffect(() => {
    if (editCompany !== entry.company) {
      setEditProjectId(null);
    }
  }, [editCompany, entry.company]);

  return (
    <>
      <motion.div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-[#F0F0F0]/60"
        style={{ backgroundColor: isSick ? '#FEF2F2' : isEditing ? '#F0F0F0' : 'rgba(250,250,250,0.5)' }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        onClick={openEdit}
      >
        <div className="flex items-center gap-1 flex-shrink-0">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isSick ? '#DC2626' : theme.primary }}
          />
          {isHO && !isSick && (
            <svg className="w-3 h-3 text-[#9CA3AF]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )}
        </div>
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

      {/* Inline edit form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            ref={editRef}
            className="mx-1 mb-1 p-3 rounded-xl border border-[#E5E7EB] bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Company */}
            <div className="flex gap-1.5">
              {companies.map((c) => {
                const t = COMPANY_THEMES[c];
                const sel = editCompany === c;
                return (
                  <button
                    key={c}
                    onClick={(e) => { e.stopPropagation(); setEditCompany(c); }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all duration-150 ${t.fontClass}`}
                    style={{
                      backgroundColor: sel ? t.accent : '#F9FAFB',
                      border: `1.5px solid ${sel ? t.primary : '#E5E7EB'}`,
                      color: sel ? t.primary : '#9CA3AF',
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>

            {/* Project */}
            {editCompanyProjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {editCompanyProjects.map((p) => {
                  const sel = editProjectId === p.id;
                  const t = COMPANY_THEMES[editCompany];
                  return (
                    <button
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); setEditProjectId(p.id); }}
                      className="py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all duration-150 flex items-center gap-1.5"
                      style={{
                        backgroundColor: sel ? t.accent : '#F9FAFB',
                        border: `1.5px solid ${sel ? t.primary : '#E5E7EB'}`,
                        color: sel ? t.primary : '#6B7280',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.primary }} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Times + Home Office */}
            <div className="flex items-center gap-2">
              <InlineTimePicker value={editStart} onChange={setEditStart} />
              <span className="text-xs text-[#9CA3AF]">-</span>
              <InlineTimePicker value={editEnd} onChange={setEditEnd} />
              <div className="flex-grow" />
              <button
                onClick={(e) => { e.stopPropagation(); setEditHomeOffice(!editHomeOffice); }}
                className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-all duration-150"
                style={{
                  backgroundColor: editHomeOffice ? '#EFF6FF' : '#F9FAFB',
                  border: `1.5px solid ${editHomeOffice ? '#93C5FD' : '#E5E7EB'}`,
                  color: editHomeOffice ? '#3B82F6' : '#9CA3AF',
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                HO
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                disabled={!editProjectId || !editStart || !editEnd}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1A1A1A] disabled:opacity-30 transition-opacity"
                whileTap={{ scale: 0.98 }}
              >
                Speichern
              </motion.button>
              <motion.button
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                className="py-1.5 px-3 rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                Abbrechen
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
