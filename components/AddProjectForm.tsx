'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Company, Project, CompanyTheme } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface AddProjectFormProps {
  company: Company;
  theme: CompanyTheme;
  onCancel: () => void;
  onCreate: (project: Project) => void;
}

export default function AddProjectForm({
  company,
  theme,
  onCancel,
  onCreate,
}: AddProjectFormProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), company }),
      });

      if (res.ok) {
        const project = await res.json();
        onCreate(project);
      } else {
        // Fallback to local creation if API fails
        const localProject: Project = {
          id: uuidv4(),
          name: name.trim(),
          company,
          color: null,
          created_at: new Date().toISOString(),
          archived: false,
        };
        onCreate(localProject);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      // Create locally on error
      const localProject: Project = {
        id: uuidv4(),
        name: name.trim(),
        company,
        color: null,
        created_at: new Date().toISOString(),
        archived: false,
      };
      onCreate(localProject);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Input */}
      <div className="flex-grow relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Project name..."
          autoFocus
          className="w-full py-3 px-4 rounded-xl border-2 text-sm font-medium text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors duration-200"
          style={{
            borderColor: theme.primary + '60',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.primary;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.primary + '60';
          }}
        />
      </div>

      {/* Create button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!name.trim() || isSubmitting}
        className="py-3 px-5 rounded-xl text-sm font-semibold text-white transition-opacity duration-200 disabled:opacity-50"
        style={{ backgroundColor: theme.primary }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSubmitting ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Create'
        )}
      </motion.button>

      {/* Cancel button */}
      <motion.button
        onClick={onCancel}
        className="p-3 rounded-xl text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#FAFAFA] transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
