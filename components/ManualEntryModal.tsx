'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Company, Project, COMPANY_THEMES, TimeEntry } from '@/lib/types';

// ── Custom Date Picker ──────────────────────────────────────────────

const MONTHS = [
  'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function CustomDatePicker({ value, onChange, max }: { value: string; onChange: (v: string) => void; max: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const parsed = new Date(value + 'T00:00:00');
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = max ? new Date(max + 'T00:00:00') : today;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleSelect = (day: number) => {
    const ds = toDateString(viewYear, viewMonth, day);
    const d = new Date(ds + 'T00:00:00');
    if (d > maxDate) return;
    onChange(ds);
    setIsOpen(false);
  };

  const selectedStr = value;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-200 hover:border-[#D1D5DB] bg-white text-left flex items-center justify-between"
      >
        <span>{formatDateDisplay(value)}</span>
        <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[#E5E7EB]/60 p-4 z-50 w-[300px]"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {/* Month/Year header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-center text-[10px] font-medium text-[#9CA3AF] py-1">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const ds = toDateString(viewYear, viewMonth, day);
                const d = new Date(ds + 'T00:00:00');
                const isSelected = ds === selectedStr;
                const isDisabled = d > maxDate;
                const isToday = d.getTime() === today.getTime();

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(day)}
                    className={`
                      w-9 h-9 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all duration-150
                      ${isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : isToday
                          ? 'bg-[#F5F5F5] text-[#1A1A1A]'
                          : isDisabled
                            ? 'text-[#D1D5DB] cursor-not-allowed'
                            : 'text-[#1A1A1A] hover:bg-[#F5F5F5]'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Custom Time Picker ──────────────────────────────────────────────

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

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

function CustomTimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input display when value changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll to selected time when opening
  useEffect(() => {
    if (isOpen && listRef.current) {
      const idx = TIME_OPTIONS.indexOf(value);
      if (idx >= 0) {
        const el = listRef.current.children[idx] as HTMLElement;
        if (el) el.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setInputValue(formatted);

    if (isValidTime(formatted)) {
      onChange(formatted);
    }
  };

  const handleBlur = () => {
    // On blur, snap back to the last valid value if current is invalid
    if (!isValidTime(inputValue)) {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isValidTime(inputValue)) {
        onChange(inputValue);
      }
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="00:00"
          maxLength={5}
          className="w-full py-3 px-4 pr-10 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-200 focus:border-[#6B7280] bg-white"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          tabIndex={-1}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[#E5E7EB]/60 z-50 w-full max-h-[220px] overflow-y-auto"
            ref={listRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="py-1">
              {TIME_OPTIONS.map((t) => {
                const isSelected = t === value;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { onChange(t); setIsOpen(false); }}
                    className={`
                      w-full py-2.5 px-4 text-left text-sm font-medium transition-colors duration-100
                      ${isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-[#1A1A1A] hover:bg-[#F5F5F5]'
                      }
                    `}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

interface ManualBlock {
  id: string;
  company: Company;
  project_id: string;
  project_name: string;
  start_time: string;
  end_time: string;
  is_sick_day?: boolean;
}

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onEntriesCreated: () => void;
  useLocalStorage: boolean;
  onLocalEntries?: (entries: TimeEntry[]) => void;
}

const companies: Company[] = ['merchandising', 'salescrew', 'inkognito'];

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function ManualEntryModal({
  isOpen,
  onClose,
  projects,
  onEntriesCreated,
  useLocalStorage,
  onLocalEntries,
}: ManualEntryModalProps) {
  const [date, setDate] = useState(getYesterdayString);
  const [blocks, setBlocks] = useState<ManualBlock[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(true);
  const [blockCompany, setBlockCompany] = useState<Company | null>(null);
  const [blockProjectId, setBlockProjectId] = useState<string | null>(null);
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSickDay, setIsSickDay] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setBlocks([]);
      setIsAddingBlock(true);
      setBlockCompany(null);
      setBlockProjectId(null);
      setBlockStart('09:00');
      setBlockEnd('17:00');
      setSaveSuccess(false);
      setDate(getYesterdayString());
      setIsSickDay(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setBlockProjectId(null);
  }, [blockCompany]);

  const companyProjects = blockCompany
    ? projects.filter((p) => p.company === blockCompany && !p.archived)
    : [];

  const handleAddBlock = () => {
    if (!blockCompany || !blockProjectId || !blockStart || !blockEnd) return;

    const project = projects.find((p) => p.id === blockProjectId);
    if (!project) return;

    const newBlock: ManualBlock = {
      id: uuidv4(),
      company: blockCompany,
      project_id: blockProjectId,
      project_name: project.name,
      start_time: blockStart,
      end_time: blockEnd,
    };

    setBlocks((prev) => [...prev, newBlock]);
    setIsAddingBlock(false);
    setBlockCompany(null);
    setBlockProjectId(null);
    setBlockStart(blockEnd);
    setBlockEnd('17:00');
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    if (!isSickDay && blocks.length === 0) return;
    setIsSaving(true);

    const sessionId = uuidv4();

    try {
      if (isSickDay) {
        const startISO = new Date(`${date}T09:00:00`).toISOString();
        const endISO = new Date(`${date}T17:30:00`).toISOString();

        if (useLocalStorage) {
          const sickEntry: TimeEntry = {
            id: uuidv4(),
            company: 'merchandising',
            start_time: startISO,
            end_time: endISO,
            session_id: sessionId,
            project_id: null,
            is_sick_day: true,
            created_at: new Date().toISOString(),
          };
          onLocalEntries?.([sickEntry]);
        } else {
          await fetch('/api/time-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: 'merchandising',
              start_time: startISO,
              end_time: endISO,
              session_id: sessionId,
              is_sick_day: true,
            }),
          });
        }
      } else {
        if (useLocalStorage) {
          const newEntries: TimeEntry[] = blocks.map((block) => {
            const startISO = new Date(`${date}T${block.start_time}:00`).toISOString();
            const endISO = new Date(`${date}T${block.end_time}:00`).toISOString();
            return {
              id: uuidv4(),
              company: block.company,
              start_time: startISO,
              end_time: endISO,
              session_id: sessionId,
              project_id: block.project_id,
              is_sick_day: false,
              created_at: new Date().toISOString(),
              project: projects.find((p) => p.id === block.project_id),
            };
          });
          onLocalEntries?.(newEntries);
        } else {
          for (const block of blocks) {
            const startISO = new Date(`${date}T${block.start_time}:00`).toISOString();
            const endISO = new Date(`${date}T${block.end_time}:00`).toISOString();

            await fetch('/api/time-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company: block.company,
                start_time: startISO,
                end_time: endISO,
                session_id: sessionId,
                project_id: block.project_id,
              }),
            });
          }
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onEntriesCreated();
        onClose();
      }, 600);
    } catch (error) {
      console.error('Failed to save entries:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isBlockFormValid = blockCompany && blockProjectId && blockStart && blockEnd && blockStart < blockEnd;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white/95 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] w-full max-w-[480px] p-6 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                Eintrag nachtragen
              </h2>
            </div>

            {/* Date picker */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
                Datum
              </label>
              <CustomDatePicker
                value={date}
                onChange={setDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Krankenstand toggle */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsSickDay(!isSickDay);
                  if (!isSickDay) {
                    setBlocks([]);
                    setIsAddingBlock(true);
                  }
                }}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200"
                style={{
                  backgroundColor: isSickDay ? '#FEF2F2' : '#FAFAFA',
                  border: `2px solid ${isSickDay ? '#FECACA' : '#E5E7EB'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={isSickDay ? '#DC2626' : '#9CA3AF'}
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span
                    className="text-sm font-medium"
                    style={{ color: isSickDay ? '#DC2626' : '#6B7280' }}
                  >
                    Krankenstand
                  </span>
                </div>
                <div
                  className="w-10 h-6 rounded-full p-0.5 transition-colors duration-200"
                  style={{ backgroundColor: isSickDay ? '#DC2626' : '#D1D5DB' }}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-sm"
                    animate={{ x: isSickDay ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isSickDay && (
                  <motion.div
                    className="mt-3 py-3 px-4 rounded-xl border-2 border-[#FECACA] bg-[#FEF2F2]"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                      <div>
                        <div className="text-sm font-medium text-[#DC2626]">09:00 - 17:30</div>
                        <div className="text-xs text-[#DC2626]/60">8h 30min Krankenstand</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Time blocks list (hidden during sick day) */}
            {!isSickDay && (
              <AnimatePresence>
                {blocks.length > 0 && (
                  <motion.div
                    className="mb-4 space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
                      Zeitblöcke
                    </label>
                    {blocks.map((block, index) => {
                      const theme = COMPANY_THEMES[block.company];
                      return (
                        <motion.div
                          key={block.id}
                          className="flex items-center gap-3 py-3 px-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]/60"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div className="flex-grow min-w-0">
                            <div className="text-sm font-medium text-[#1A1A1A]">
                              {block.start_time} - {block.end_time}
                            </div>
                            <div className="text-xs text-[#6B7280] truncate">
                              <span style={{ color: theme.primary }} className={`font-medium ${theme.fontClass}`}>
                                {theme.name}
                              </span>
                              {' · '}
                              {block.project_name}
                            </div>
                          </div>
                          <motion.button
                            onClick={() => handleRemoveBlock(block.id)}
                            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#E5E7EB]/50 transition-colors duration-150"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Add block form / button (hidden during sick day) */}
            {!isSickDay && <AnimatePresence mode="wait">
              {isAddingBlock ? (
                <motion.div
                  key="form"
                  className="mb-6 space-y-4 p-4 rounded-2xl border border-[#E5E7EB]/60 bg-[#FAFAFA]/50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {/* Company selector */}
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
                      Firma
                    </label>
                    <div className="flex gap-2">
                      {companies.map((company) => {
                        const theme = COMPANY_THEMES[company];
                        const isSelected = blockCompany === company;
                        return (
                          <button
                            key={company}
                            onClick={() => setBlockCompany(company)}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200 outline-none ${theme.fontClass}`}
                            style={{
                              backgroundColor: isSelected ? theme.accent : '#FFFFFF',
                              border: `2px solid ${isSelected ? theme.primary : '#E5E7EB'}`,
                              color: isSelected ? theme.primary : '#6B7280',
                              boxShadow: isSelected ? `0 0 12px 0 ${theme.glow}` : `0 0 8px 0 rgba(0,0,0,0.03)`,
                            }}
                          >
                            {theme.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project selector */}
                  <AnimatePresence>
                    {blockCompany && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
                          Projekt
                        </label>
                        {companyProjects.length > 0 ? (
                          <CustomProjectSelect
                            projects={companyProjects}
                            value={blockProjectId}
                            onChange={setBlockProjectId}
                            company={blockCompany}
                          />
                        ) : (
                          <div className="text-sm text-[#9CA3AF] py-3 px-4 rounded-xl border-2 border-dashed border-[#E5E7EB]">
                            Keine Projekte vorhanden
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Time inputs */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <CustomTimePicker label="Von" value={blockStart} onChange={setBlockStart} />
                    </div>
                    <div className="flex-1">
                      <CustomTimePicker label="Bis" value={blockEnd} onChange={setBlockEnd} />
                    </div>
                  </div>

                  {/* Add block button */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleAddBlock}
                      disabled={!isBlockFormValid}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-opacity duration-200 disabled:opacity-40"
                      style={{
                        backgroundColor: blockCompany
                          ? COMPANY_THEMES[blockCompany].primary
                          : '#1A1A1A',
                      }}
                      whileHover={isBlockFormValid ? { scale: 1.02 } : {}}
                      whileTap={isBlockFormValid ? { scale: 0.98 } : {}}
                    >
                      Hinzufügen
                    </motion.button>
                    {blocks.length > 0 && (
                      <motion.button
                        onClick={() => setIsAddingBlock(false)}
                        className="py-3 px-4 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F5F5F5] transition-colors duration-200"
                        whileTap={{ scale: 0.98 }}
                      >
                        Fertig
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="add-button"
                  onClick={() => setIsAddingBlock(true)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#E5E7EB] text-sm text-[#6B7280] font-medium flex items-center justify-center gap-2 transition-colors duration-200 hover:border-[#D1D5DB] mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ borderColor: '#9CA3AF', color: '#4B5563' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Zeitblock hinzufügen
                </motion.button>
              )}
            </AnimatePresence>}

            {/* Divider */}
            {(blocks.length > 0 || isSickDay) && (
              <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent mb-4" />
            )}

            {/* Save all button */}
            <motion.button
              onClick={handleSave}
              disabled={(!isSickDay && blocks.length === 0) || isSaving}
              className="w-full py-3.5 px-6 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: saveSuccess ? '#16A34A' : isSickDay ? '#DC2626' : '#1A1A1A',
              }}
              whileHover={(isSickDay || blocks.length > 0) && !isSaving ? { scale: 1.02, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.2)' } : {}}
              whileTap={(isSickDay || blocks.length > 0) && !isSaving ? { scale: 0.98 } : {}}
            >
              {saveSuccess ? (
                <motion.div
                  className="flex items-center justify-center gap-2"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Gespeichert
                </motion.div>
              ) : isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Speichern...
                </div>
              ) : isSickDay ? (
                'Krankenstand speichern'
              ) : (
                `Alle speichern (${blocks.length} ${blocks.length === 1 ? 'Block' : 'Blöcke'})`
              )}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Custom Project Select ───────────────────────────────────────────

function CustomProjectSelect({ projects, value, onChange, company }: {
  projects: Project[];
  value: string | null;
  onChange: (v: string | null) => void;
  company: Company;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = COMPANY_THEMES[company];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = projects.find((p) => p.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium outline-none transition-colors duration-200 hover:border-[#D1D5DB] bg-white text-left flex items-center justify-between"
        style={{ color: selected ? '#1A1A1A' : '#9CA3AF' }}
      >
        <span>{selected ? selected.name : 'Projekt wählen...'}</span>
        <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[#E5E7EB]/60 z-50 w-full overflow-hidden"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="py-1">
              {projects.map((project) => {
                const isSelected = project.id === value;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => { onChange(project.id); setIsOpen(false); }}
                    className={`
                      w-full py-2.5 px-4 text-left text-sm font-medium flex items-center gap-3 transition-colors duration-100
                      ${isSelected
                        ? 'text-white'
                        : 'text-[#1A1A1A] hover:bg-[#F5F5F5]'
                      }
                    `}
                    style={isSelected ? { backgroundColor: theme.primary } : {}}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isSelected ? '#FFFFFF' : theme.primary }}
                    />
                    {project.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
