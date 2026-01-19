'use client';

import { motion } from 'framer-motion';
import { Project, CompanyTheme } from '@/lib/types';

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  isNewlyCreated: boolean;
  theme: CompanyTheme;
  index: number;
  onSelect: () => void;
}

export default function ProjectItem({
  project,
  isSelected,
  isNewlyCreated,
  theme,
  index,
  onSelect,
}: ProjectItemProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={`
        w-full py-3.5 px-4 rounded-xl text-left flex items-center gap-3
        transition-all duration-200 outline-none
        ${isSelected 
          ? 'border-2' 
          : 'border-2 border-transparent hover:bg-[#FAFAFA]'
        }
      `}
      style={{
        backgroundColor: isSelected ? theme.accent : isNewlyCreated ? '#ECFDF5' : 'transparent',
        borderColor: isSelected ? theme.primary : 'transparent',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        backgroundColor: isNewlyCreated ? ['#ECFDF5', theme.accent, '#FFFFFF'] : undefined,
      }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.05,
        backgroundColor: isNewlyCreated ? { duration: 1.5, times: [0, 0.3, 1] } : undefined,
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Dot indicator */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: theme.primary }}
      />

      {/* Project name */}
      <span 
        className="text-sm font-medium flex-grow"
        style={{ color: isSelected ? theme.primary : '#1A1A1A' }}
      >
        {project.name}
      </span>

      {/* Checkmark for selected */}
      {isSelected && (
        <motion.svg
          className="w-5 h-5 flex-shrink-0"
          style={{ color: theme.primary }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </motion.svg>
      )}
    </motion.button>
  );
}
