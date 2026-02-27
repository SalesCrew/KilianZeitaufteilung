'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Todo } from '@/lib/types';

const PROJECT_COLORS: Record<string, string> = {
  merchandising: '#3B82F6',
  salescrew: '#F97316',
  inkognito: '#DC2626',
  other: '#9CA3AF',
};

const PROJECT_LABELS: Record<string, string> = {
  merchandising: 'Merchandising',
  salescrew: 'Salescrew',
  inkognito: 'Inkognito',
  other: 'Sonstiges',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#D1D5DB',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

interface TodoPanelProps {
  todos: Todo[];
  onToggle: (id: string, status: 'open' | 'done') => void;
  onDelete: (id: string) => void;
}

export default function TodoPanel({ todos, onToggle, onDelete }: TodoPanelProps) {
  const [showDone, setShowDone] = useState(false);
  const [detailTodo, setDetailTodo] = useState<Todo | null>(null);

  const openTodos = todos.filter((t) => t.status === 'open');
  const doneTodos = todos.filter((t) => t.status === 'done');

  return (
    <>
      <motion.div
        className="fixed top-5 left-6 z-10 w-72 select-none hidden lg:block"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E5E7EB]/60 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] p-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#9CA3AF]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-semibold text-[#1A1A1A]">Todos</span>
            </div>
            {openTodos.length > 0 && (
              <span className="bg-[#F3F4F6] text-[#6B7280] text-[10px] font-medium px-2 py-0.5 rounded-full">
                {openTodos.length}
              </span>
            )}
          </div>

          <div className="h-px bg-[#E5E7EB]/40 my-3" />

          {/* Open Todos */}
          {openTodos.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {openTodos.map((todo, i) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    index={i}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onOpen={setDetailTodo}
                    isDone={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-2">
              <svg className="w-8 h-8 text-[#D1D5DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs text-[#9CA3AF]">Keine offenen Todos</span>
            </div>
          )}

          {/* Done Section */}
          {doneTodos.length > 0 && (
            <>
              <div className="h-px bg-[#E5E7EB]/40 my-3" />
              <button
                onClick={() => setShowDone(!showDone)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors duration-150 w-full"
              >
                <motion.svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  animate={{ rotate: showDone ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
                Erledigt ({doneTodos.length})
              </button>

              <AnimatePresence>
                {showDone && (
                  <motion.div
                    className="space-y-1.5 mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {doneTodos.map((todo, i) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        index={i}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onOpen={setDetailTodo}
                        isDone
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailTodo && (
          <TodoDetailModal
            todo={detailTodo}
            onClose={() => setDetailTodo(null)}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (id: string, status: 'open' | 'done') => void;
  onDelete: (id: string) => void;
  onOpen: (todo: Todo) => void;
  isDone: boolean;
}

function TodoItem({ todo, index, onToggle, onDelete, onOpen, isDone }: TodoItemProps) {
  const [hovered, setHovered] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const projectColor = PROJECT_COLORS[todo.project] || PROJECT_COLORS.other;
  const priorityColor = PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium;

  return (
    <motion.div
      layout
      className={`rounded-xl px-3.5 py-3 flex items-start gap-2.5 transition-colors duration-150 cursor-pointer ${
        isDone
          ? 'bg-[#FAFAFA]/60 opacity-50'
          : 'bg-[#FAFAFA] hover:bg-[#F3F4F6]'
      }`}
      style={{ borderLeft: `2px solid ${isDone ? '#E5E7EB' : projectColor}` }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isDone ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(todo)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo.id, isDone ? 'open' : 'done');
        }}
        className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
        style={{
          borderColor: isDone ? '#D1D5DB' : hovered ? '#9CA3AF' : '#D1D5DB',
          backgroundColor: isDone ? '#F3F4F6' : 'transparent',
        }}
      >
        {isDone && (
          <motion.svg
            className="w-2.5 h-2.5 text-[#9CA3AF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {!isDone && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityColor }}
            />
          )}
          <span
            className={`text-xs font-medium truncate block ${
              isDone ? 'text-[#9CA3AF] line-through' : 'text-[#1A1A1A]'
            }`}
          >
            {todo.title}
          </span>
        </div>

        {!isDone && todo.description && (
          <p className="text-[10px] text-[#9CA3AF] leading-tight mt-0.5 line-clamp-2">
            {todo.description}
          </p>
        )}

        {!isDone && todo.source_email_from && (
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-2.5 h-2.5 text-[#9CA3AF]/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-[#9CA3AF]/60 truncate">
              von {todo.source_email_from}
            </span>
          </div>
        )}
      </div>

      {/* Right side icons */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 mt-0.5">
        {!isDone && todo.source_email_from && !todo.description && (
          <svg className="w-3.5 h-3.5 text-[#9CA3AF]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}

        {!isDone && todo.prompt && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(todo.prompt!);
              setPromptCopied(true);
              setTimeout(() => setPromptCopied(false), 3000);
            }}
            className="w-4 h-4 flex items-center justify-center transition-colors duration-150"
            whileTap={{ scale: 0.85 }}
            title="Prompt kopieren"
          >
            <AnimatePresence mode="wait">
              {promptCopied ? (
                <motion.svg
                  key="check"
                  className="w-3.5 h-3.5 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="prompt"
                  className="w-3.5 h-3.5 text-[#DC2626]/70 hover:text-[#DC2626]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {isDone && hovered && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626]/60 transition-colors duration-150 mt-0.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Detail Modal ── */

interface TodoDetailModalProps {
  todo: Todo;
  onClose: () => void;
  onToggle: (id: string, status: 'open' | 'done') => void;
  onDelete: (id: string) => void;
}

function TodoDetailModal({ todo, onClose, onToggle, onDelete }: TodoDetailModalProps) {
  const [promptCopied, setPromptCopied] = useState(false);
  const projectColor = PROJECT_COLORS[todo.project] || PROJECT_COLORS.other;
  const priorityColor = PRIORITY_COLORS[todo.priority] || PRIORITY_COLORS.medium;
  const priorityLabel = PRIORITY_LABELS[todo.priority] || todo.priority;
  const projectLabel = PROJECT_LABELS[todo.project] || todo.project;
  const isDone = todo.status === 'done';

  const createdDate = new Date(todo.created_at);
  const formattedDate = createdDate.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] w-full max-w-sm overflow-hidden"
        style={{ borderTop: `3px solid ${projectColor}` }}
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: priorityColor }}
              />
              <h2 className={`text-sm font-semibold leading-snug ${isDone ? 'text-[#9CA3AF] line-through' : 'text-[#1A1A1A]'}`}>
                {todo.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6] transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: projectColor + '15', color: projectColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: projectColor }} />
              {projectLabel}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: priorityColor + '18', color: priorityColor === '#D1D5DB' ? '#6B7280' : priorityColor }}
            >
              {priorityLabel}
            </span>
            <span className="text-[10px] text-[#9CA3AF] px-1">
              {formattedDate}
            </span>
          </div>

          {/* Description */}
          {todo.description && (
            <div className="mb-4">
              <p className="text-[11px] font-medium text-[#6B7280] mb-1">Beschreibung</p>
              <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                {todo.description}
              </p>
            </div>
          )}

          {/* Source email */}
          {todo.source_email_from && (
            <div className="bg-[#FAFAFA] rounded-xl px-3.5 py-3 mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3 h-3 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] font-medium text-[#6B7280]">E-Mail Quelle</span>
              </div>
              <p className="text-xs text-[#374151]">{todo.source_email_from}</p>
              {todo.source_email_subject && (
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 italic">{todo.source_email_subject}</p>
              )}
            </div>
          )}

          {/* Prompt section */}
          {todo.prompt && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-medium text-[#6B7280]">Prompt</p>
                <motion.button
                  onClick={() => {
                    navigator.clipboard.writeText(todo.prompt!);
                    setPromptCopied(true);
                    setTimeout(() => setPromptCopied(false), 3000);
                  }}
                  className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg transition-colors duration-150"
                  style={{
                    color: promptCopied ? '#10B981' : '#DC2626',
                    backgroundColor: promptCopied ? '#10B98110' : '#DC262610',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {promptCopied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Kopiert
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Kopieren
                    </>
                  )}
                </motion.button>
              </div>
              <div className="bg-[#FAFAFA] rounded-xl px-3.5 py-3 max-h-40 overflow-y-auto scrollbar-thin">
                <p className="text-[11px] text-[#374151] leading-relaxed whitespace-pre-wrap font-mono">
                  {todo.prompt}
                </p>
              </div>
            </div>
          )}

          {/* Done info */}
          {isDone && todo.done_at && (
            <p className="text-[10px] text-[#9CA3AF] mb-4">
              Erledigt am {new Date(todo.done_at).toLocaleDateString('de-AT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#E5E7EB]/40 px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(todo.id);
              onClose();
            }}
            className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#DC2626]/70 transition-colors duration-150"
          >
            Löschen
          </button>
          <motion.button
            onClick={() => {
              onToggle(todo.id, isDone ? 'open' : 'done');
              onClose();
            }}
            className="text-[11px] font-medium px-3.5 py-1.5 rounded-lg transition-colors duration-150"
            style={{
              backgroundColor: isDone ? '#F3F4F6' : projectColor + '12',
              color: isDone ? '#6B7280' : projectColor,
            }}
            whileTap={{ scale: 0.97 }}
          >
            {isDone ? 'Wiedereröffnen' : 'Erledigt'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
