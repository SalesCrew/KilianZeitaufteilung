'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company, Project, COMPANY_THEMES } from '@/lib/types';
import ProjectItem from './ProjectItem';
import AddProjectForm from './AddProjectForm';

interface ProjectModalProps {
  isOpen: boolean;
  company: Company;
  selectedProjectId: string | null;
  onSelect: (project: Project) => void;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  projects: Project[];
  isTimerRunning: boolean;
}

export default function ProjectModal({
  isOpen,
  company,
  selectedProjectId,
  onSelect,
  onClose,
  onProjectCreated,
  projects,
  isTimerRunning,
}: ProjectModalProps) {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const theme = COMPANY_THEMES[company];
  const companyProjects = projects.filter((p) => p.company === company && !p.archived);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAddingProject(false);
      setNewlyCreatedId(null);
    }
  }, [isOpen]);

  // Clear the newly created highlight after animation
  useEffect(() => {
    if (newlyCreatedId) {
      const timer = setTimeout(() => setNewlyCreatedId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [newlyCreatedId]);

  const handleProjectCreate = (project: Project) => {
    setNewlyCreatedId(project.id);
    setIsAddingProject(false);
    onProjectCreated(project);
  };

  const handleBackdropClick = () => {
    // Only allow closing by clicking outside if timer is not running
    if (!isTimerRunning) {
      onClose();
    }
  };

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
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            className={`relative bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] w-full max-w-md p-6 ${theme.fontClass}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                Select Project for {theme.name}
              </h2>
            </div>

            {/* Project List */}
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
              {companyProjects.length === 0 && !isAddingProject && (
                <motion.div
                  className="text-center py-8 text-sm text-[#9CA3AF]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No projects yet. Create your first one below.
                </motion.div>
              )}

              {companyProjects.map((project, index) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isSelected={project.id === selectedProjectId}
                  isNewlyCreated={project.id === newlyCreatedId}
                  theme={theme}
                  index={index}
                  onSelect={() => {
                    onSelect(project);
                    onClose();
                  }}
                />
              ))}
            </div>

            {/* Add Project Section */}
            <AnimatePresence mode="wait">
              {isAddingProject ? (
                <AddProjectForm
                  key="form"
                  company={company}
                  theme={theme}
                  onCancel={() => setIsAddingProject(false)}
                  onCreate={handleProjectCreate}
                />
              ) : (
                <motion.button
                  key="button"
                  onClick={() => setIsAddingProject(true)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#E5E7EB] text-sm text-[#6B7280] font-medium flex items-center justify-center gap-2 transition-colors duration-200 hover:border-[#D1D5DB]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ 
                    borderColor: theme.primary + '60',
                    color: theme.primary,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Projekt hinzufügen
                </motion.button>
              )}
            </AnimatePresence>

            {/* Close hint */}
            {!isTimerRunning && (
              <motion.p
                className="text-center text-xs text-[#9CA3AF] mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Click outside to close
              </motion.p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
