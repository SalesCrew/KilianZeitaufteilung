'use client';

import { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    if (isSelected) return theme.accent;
    if (isNewlyCreated) return '#ECFDF5';
    if (isHovered) return '#F5F5F5';
    return 'transparent';
  };

  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full py-3.5 px-4 rounded-xl text-left flex items-center gap-3 outline-none border-2"
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: isSelected ? theme.primary : 'transparent',
        transition: 'background-color 150ms ease, border-color 150ms ease',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.05,
      }}
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
