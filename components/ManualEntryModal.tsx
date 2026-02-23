'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Company, Project, COMPANY_THEMES, TimeEntry } from '@/lib/types';

interface ManualBlock {
  id: string;
  company: Company;
  project_id: string;
  project_name: string;
  start_time: string;
  end_time: string;
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

  // Reset when modal closes
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
    }
  }, [isOpen]);

  // Reset project when company changes
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

    // Auto-chain: set next block start = this block's end
    setBlockStart(blockEnd);
    setBlockEnd('17:00');
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    if (blocks.length === 0) return;
    setIsSaving(true);

    const sessionId = uuidv4();

    try {
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
            created_at: new Date().toISOString(),
            project: projects.find((p) => p.id === block.project_id),
          };
        });
        onLocalEntries?.(newEntries);
      } else {
        // Save all blocks via API
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
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full py-3 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-200 focus:border-[#6B7280] bg-white"
              />
            </div>

            {/* Time blocks list */}
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

            {/* Add block form / button */}
            <AnimatePresence mode="wait">
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
                          <select
                            value={blockProjectId || ''}
                            onChange={(e) => setBlockProjectId(e.target.value || null)}
                            className="w-full py-3 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-200 focus:border-[#6B7280] bg-white appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 12px center',
                              paddingRight: '40px',
                            }}
                          >
                            <option value="">Projekt wählen...</option>
                            {companyProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
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
                      <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
                        Von
                      </label>
                      <input
                        type="time"
                        value={blockStart}
                        onChange={(e) => setBlockStart(e.target.value)}
                        className="w-full py-3 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-200 focus:border-[#6B7280] bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-[#6B7280] mb-2 uppercase tracking-wide">
                        Bis
                      </label>
                      <input
                        type="time"
                        value={blockEnd}
                        onChange={(e) => setBlockEnd(e.target.value)}
                        className="w-full py-3 px-4 rounded-xl border-2 border-[#E5E7EB] text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-200 focus:border-[#6B7280] bg-white"
                      />
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
            </AnimatePresence>

            {/* Divider */}
            {blocks.length > 0 && (
              <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent mb-4" />
            )}

            {/* Save all button */}
            <motion.button
              onClick={handleSave}
              disabled={blocks.length === 0 || isSaving}
              className="w-full py-3.5 px-6 rounded-2xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: saveSuccess ? '#16A34A' : '#1A1A1A',
              }}
              whileHover={blocks.length > 0 && !isSaving ? { scale: 1.02, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.2)' } : {}}
              whileTap={blocks.length > 0 && !isSaving ? { scale: 0.98 } : {}}
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
              ) : (
                `Alle speichern (${blocks.length} ${blocks.length === 1 ? 'Block' : 'Blöcke'})`
              )}
            </motion.button>

            {/* Close hint */}
            <motion.p
              className="text-center text-xs text-[#9CA3AF] mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Click outside to close
            </motion.p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
