'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Timer from '@/components/Timer';
import CompanySelector from '@/components/CompanySelector';
import StartStopButton from '@/components/StartStopButton';
import HistoryPanel from '@/components/HistoryPanel';
import ProjectModal from '@/components/ProjectModal';
import ManualEntryModal from '@/components/ManualEntryModal';
import { Company, TimeEntry, Project, COMPANY_THEMES } from '@/lib/types';
import { getNowISO } from '@/lib/utils';

export default function Home() {
  // Core state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCompany, setPendingCompany] = useState<Company | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Try to load from API first
    let apiWorking = false;
    let loadedEntries: TimeEntry[] = [];
    let loadedProjects: Project[] = [];

    try {
      const [entriesRes, projectsRes] = await Promise.all([
        fetch('/api/time-entries'),
        fetch('/api/projects'),
      ]);

      if (entriesRes.ok && projectsRes.ok) {
        const entriesData = await entriesRes.json();
        const projectsData = await projectsRes.json();

        if (!entriesData.error && !projectsData.error) {
          loadedEntries = entriesData;
          loadedProjects = projectsData;
          setEntries(entriesData);
          setProjects(projectsData);
          apiWorking = true;
        }
      }
    } catch (error) {
      console.log('API not available, using local storage');
    }

    if (!apiWorking) {
      // Fallback to localStorage
      setUseLocalStorage(true);
      const storedEntries = localStorage.getItem('time-entries');
      const storedProjects = localStorage.getItem('projects');
      
      if (storedEntries) {
        try {
          loadedEntries = JSON.parse(storedEntries);
          setEntries(loadedEntries);
        } catch {
          setEntries([]);
        }
      }
      if (storedProjects) {
        try {
          loadedProjects = JSON.parse(storedProjects);
          setProjects(loadedProjects);
        } catch {
          setProjects([]);
        }
      }
    }

    // Check for active entry (no end_time) and resume timer
    const activeEntry = loadedEntries.find((e) => e.end_time === null);
    if (activeEntry) {
      // Resume the timer
      setCurrentEntryId(activeEntry.id);
      setSessionId(activeEntry.session_id);
      setStartTime(new Date(activeEntry.start_time));
      setIsRunning(true);
      setSelectedCompany(activeEntry.company);

      // Find and set the project
      const project = activeEntry.project || loadedProjects.find((p) => p.id === activeEntry.project_id);
      if (project) {
        setSelectedProject(project);
      }
    }

    setIsLoading(false);
  };

  // Save to localStorage when data changes (if using local mode)
  useEffect(() => {
    if (useLocalStorage) {
      if (entries.length > 0) {
        localStorage.setItem('time-entries', JSON.stringify(entries));
      }
      if (projects.length > 0) {
        localStorage.setItem('projects', JSON.stringify(projects));
      }
    }
  }, [entries, projects, useLocalStorage]);

  // Handle company button click - opens modal
  const handleCompanyClick = useCallback((company: Company) => {
    setPendingCompany(company);
    setIsModalOpen(true);
  }, []);

  // Handle project selection from modal
  const handleProjectSelect = useCallback(async (project: Project) => {
    const company = project.company;
    const previousCompany = selectedCompany;
    const previousProject = selectedProject;

    setSelectedCompany(company);
    setSelectedProject(project);
    setIsModalOpen(false);

    // If timer is running and we're switching companies/projects, create a new entry
    if (isRunning && currentEntryId && (previousCompany !== company || previousProject?.id !== project.id)) {
      const now = getNowISO();

      if (useLocalStorage) {
        // Update current entry end time locally
        setEntries((prev) =>
          prev.map((e) => (e.id === currentEntryId ? { ...e, end_time: now } : e))
        );

        // Create new entry
        const newEntry: TimeEntry = {
          id: uuidv4(),
          company,
          start_time: now,
          end_time: null,
          session_id: sessionId!,
          project_id: project.id,
          created_at: now,
          project,
        };
        setEntries((prev) => [newEntry, ...prev]);
        setCurrentEntryId(newEntry.id);
      } else {
        try {
          await fetch('/api/time-entries', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentEntryId, end_time: now }),
          });

          const res = await fetch('/api/time-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company,
              start_time: now,
              session_id: sessionId,
              project_id: project.id,
            }),
          });

          if (res.ok) {
            const newEntry = await res.json();
            setCurrentEntryId(newEntry.id);
            // Don't call loadData here to avoid resetting state
            // Just update entries
            const entriesRes = await fetch('/api/time-entries');
            if (entriesRes.ok) {
              const entriesData = await entriesRes.json();
              if (!entriesData.error) {
                setEntries(entriesData);
              }
            }
          }
        } catch (error) {
          console.error('Failed to switch project:', error);
        }
      }
    }
  }, [selectedCompany, selectedProject, isRunning, currentEntryId, sessionId, useLocalStorage]);

  // Handle project created in modal
  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [...prev, project]);
  }, []);

  // Start timer
  const handleStart = useCallback(async () => {
    if (!selectedCompany || !selectedProject) return;

    const newSessionId = uuidv4();
    const now = new Date();
    const nowISO = now.toISOString();

    setSessionId(newSessionId);
    setStartTime(now);
    setIsRunning(true);

    if (useLocalStorage) {
      const newEntry: TimeEntry = {
        id: uuidv4(),
        company: selectedCompany,
        start_time: nowISO,
        end_time: null,
        session_id: newSessionId,
        project_id: selectedProject.id,
        created_at: nowISO,
        project: selectedProject,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setCurrentEntryId(newEntry.id);
    } else {
      try {
        const res = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: selectedCompany,
            start_time: nowISO,
            session_id: newSessionId,
            project_id: selectedProject.id,
          }),
        });

        if (res.ok) {
          const newEntry = await res.json();
          setCurrentEntryId(newEntry.id);
        }
      } catch (error) {
        console.error('Failed to start timer:', error);
        setIsRunning(false);
      }
    }
  }, [selectedCompany, selectedProject, useLocalStorage]);

  // Stop timer
  const handleStop = useCallback(async () => {
    if (!currentEntryId) return;

    const now = getNowISO();

    if (useLocalStorage) {
      setEntries((prev) =>
        prev.map((e) => (e.id === currentEntryId ? { ...e, end_time: now } : e))
      );
    } else {
      try {
        await fetch('/api/time-entries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentEntryId, end_time: now }),
        });
        // Fetch updated entries
        const entriesRes = await fetch('/api/time-entries');
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          if (!entriesData.error) {
            setEntries(entriesData);
          }
        }
      } catch (error) {
        console.error('Failed to stop timer:', error);
      }
    }

    setIsRunning(false);
    setCurrentEntryId(null);
    setSessionId(null);
    setStartTime(null);
  }, [currentEntryId, useLocalStorage]);

  // Get current theme for page styling
  const currentTheme = selectedCompany ? COMPANY_THEMES[selectedCompany] : null;

  // Filter completed entries for history
  const completedEntries = entries.filter((e) => e.end_time !== null);

  return (
    <main
      className={`min-h-screen transition-all duration-500 ease-in-out ${
        currentTheme?.fontClass || 'font-merchandising'
      }`}
      style={{
        background: currentTheme
          ? `linear-gradient(180deg, ${currentTheme.glow} 0%, #FAFAFA 30%, #FAFAFA 100%)`
          : '#FAFAFA',
      }}
    >
      <div className="max-w-xl mx-auto px-6 py-12 md:py-16">
        {/* Header */}
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Time Tracker
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Track your work across companies
          </p>
          {selectedProject && (
            <motion.p
              className="text-sm mt-2 font-medium"
              style={{ color: currentTheme?.primary }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {selectedProject.name}
            </motion.p>
          )}
          {useLocalStorage && (
            <p className="text-xs text-[#F97316] mt-2">
              Demo mode (localStorage) - Configure Supabase for persistence
            </p>
          )}
        </motion.header>

        {/* Timer */}
        <div className="mb-8">
          <Timer
            isRunning={isRunning}
            startTime={startTime}
            selectedCompany={selectedCompany}
          />
        </div>

        {/* Company Selector */}
        <div className="mb-8">
          <CompanySelector
            selectedCompany={selectedCompany}
            onSelect={handleCompanyClick}
            isRunning={isRunning}
          />
        </div>

        {/* Start/Stop Button */}
        <div className="flex justify-center mb-12">
          <StartStopButton
            isRunning={isRunning}
            selectedCompany={selectedCompany}
            onStart={handleStart}
            onStop={handleStop}
            disabled={!selectedCompany || !selectedProject}
          />
        </div>

        {/* Divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent mb-5"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />

        {/* Manual entry button */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <motion.button
            onClick={() => setIsManualModalOpen(true)}
            className="py-2 px-4 rounded-xl border-2 border-dashed border-[#E5E7EB] text-xs text-[#9CA3AF] font-medium flex items-center gap-2 transition-colors duration-200 hover:border-[#D1D5DB] hover:text-[#6B7280]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nachtragen
          </motion.button>
        </motion.div>

        {/* History Panel */}
        <AnimatePresence>
          {!isLoading && (
            <HistoryPanel entries={completedEntries} projects={projects} />
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <motion.div
            className="flex justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-6 h-6 border-2 border-[#E5E7EB] border-t-[#3B82F6] rounded-full animate-spin" />
          </motion.div>
        )}
      </div>

      {/* Project Modal */}
      {pendingCompany && (
        <ProjectModal
          isOpen={isModalOpen}
          company={pendingCompany}
          selectedProjectId={selectedProject?.id || null}
          onSelect={handleProjectSelect}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={handleProjectCreated}
          projects={projects}
          isTimerRunning={isRunning}
        />
      )}

      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        projects={projects}
        onEntriesCreated={loadData}
        useLocalStorage={useLocalStorage}
        onLocalEntries={(newEntries) => {
          setEntries((prev) => [...newEntries, ...prev]);
        }}
      />
    </main>
  );
}
