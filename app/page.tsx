'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { getISOWeek, startOfISOWeek, endOfISOWeek, getDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Timer from '@/components/Timer';
import CompanySelector from '@/components/CompanySelector';
import StartStopButton from '@/components/StartStopButton';
import HistoryPanel from '@/components/HistoryPanel';
import ProjectModal from '@/components/ProjectModal';
import ManualEntryModal from '@/components/ManualEntryModal';
import { Company, TimeEntry, Project, COMPANY_THEMES } from '@/lib/types';
import { getNowISO, getViennaDateString, calculateDuration } from '@/lib/utils';

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

  // Live "to go" counter for the week
  const [liveElapsed, setLiveElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) {
      setLiveElapsed(0);
      return;
    }
    const tick = () => {
      setLiveElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Home office state
  const [isHomeOffice, setIsHomeOffice] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCompany, setPendingCompany] = useState<Company | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

    // Resume active timer
    const activeEntry = loadedEntries.find((e) => e.end_time === null);
    if (activeEntry) {
      setCurrentEntryId(activeEntry.id);
      setSessionId(activeEntry.session_id);
      setStartTime(new Date(activeEntry.start_time));
      setIsRunning(true);
      setSelectedCompany(activeEntry.company);
      setIsHomeOffice(activeEntry.is_home_office ?? false);

      const project = activeEntry.project || loadedProjects.find((p) => p.id === activeEntry.project_id);
      if (project) {
        setSelectedProject(project);
      }
    }

    setIsLoading(false);
  };

  // Save to localStorage when data changes
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

  const handleCompanyClick = useCallback((company: Company) => {
    setPendingCompany(company);
    setIsModalOpen(true);
  }, []);

  const handleProjectSelect = useCallback(async (project: Project) => {
    const company = project.company;
    const previousCompany = selectedCompany;
    const previousProject = selectedProject;

    setSelectedCompany(company);
    setSelectedProject(project);
    setIsModalOpen(false);

    if (isRunning && currentEntryId && (previousCompany !== company || previousProject?.id !== project.id)) {
      const now = getNowISO();

      if (useLocalStorage) {
        setEntries((prev) =>
          prev.map((e) => (e.id === currentEntryId ? { ...e, end_time: now } : e))
        );

        const newEntry: TimeEntry = {
          id: uuidv4(),
          company,
          start_time: now,
          end_time: null,
          session_id: sessionId!,
          project_id: project.id,
          is_sick_day: false,
          is_home_office: isHomeOffice,
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
              is_home_office: isHomeOffice,
            }),
          });

          if (res.ok) {
            const newEntry = await res.json();
            setCurrentEntryId(newEntry.id);
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
  }, [selectedCompany, selectedProject, isRunning, currentEntryId, sessionId, useLocalStorage, isHomeOffice]);

  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [...prev, project]);
  }, []);

  const proceedWithStart = useCallback(async (homeOffice: boolean) => {
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
        is_sick_day: false,
        is_home_office: homeOffice,
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
            is_home_office: homeOffice,
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

  const handleStart = useCallback(async () => {
    if (!selectedCompany || !selectedProject) return;
    proceedWithStart(isHomeOffice);
  }, [selectedCompany, selectedProject, isHomeOffice, proceedWithStart]);

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

  // Edit an existing entry
  const handleEditEntry = useCallback(async (entryId: string, updates: Partial<TimeEntry>) => {
    if (useLocalStorage) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, ...updates } : e))
      );
    } else {
      try {
        await fetch('/api/time-entries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: entryId, ...updates }),
        });
        const entriesRes = await fetch('/api/time-entries');
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          if (!entriesData.error) {
            setEntries(entriesData);
          }
        }
      } catch (error) {
        console.error('Failed to edit entry:', error);
      }
    }
  }, [useLocalStorage]);

  const currentTheme = selectedCompany ? COMPANY_THEMES[selectedCompany] : null;
  const completedEntries = entries.filter((e) => e.end_time !== null);

  const VIENNA_TZ = 'Europe/Vienna';
  const PAUSE_SECONDS = 1800; // 30 min
  const PAUSE_THRESHOLD = 21600; // 6h
  const WEEKLY_TARGET = 138600; // 38h 30m net per week

  const stats = useMemo(() => {
    const dayMap: Record<string, TimeEntry[]> = {};
    completedEntries.forEach((e) => {
      const dateKey = getViennaDateString(new Date(e.start_time));
      if (!dayMap[dateKey]) dayMap[dateKey] = [];
      dayMap[dateKey].push(e);
    });

    function getAdjustedDaySeconds(dayEntries: TimeEntry[]): number {
      const isSickDay = dayEntries.some((e) => e.is_sick_day);
      if (isSickDay) {
        return 28800; // 8h30m recorded, minus 30min pause = 8h net
      }

      const rawSeconds = dayEntries.reduce(
        (sum, e) => sum + calculateDuration(e.start_time, e.end_time),
        0
      );

      let adjusted = rawSeconds;
      if (rawSeconds >= PAUSE_THRESHOLD) {
        adjusted -= PAUSE_SECONDS;
      }

      const sampleDate = toZonedTime(new Date(dayEntries[0].start_time), VIENNA_TZ);
      if (getDay(sampleDate) === 0) {
        adjusted *= 2;
      }

      return Math.max(0, adjusted);
    }

    let totalSeconds = 0;
    Object.values(dayMap).forEach((dayEntries) => {
      totalSeconds += getAdjustedDaySeconds(dayEntries);
    });

    const now = new Date();
    const viennaNow = toZonedTime(now, VIENNA_TZ);
    const kwNumber = getISOWeek(viennaNow);
    const weekStart = startOfISOWeek(viennaNow);
    const weekEnd = endOfISOWeek(viennaNow);

    let kwSeconds = 0;
    Object.entries(dayMap).forEach(([dateKey, dayEntries]) => {
      const d = new Date(dateKey + 'T12:00:00');
      if (d >= weekStart && d <= weekEnd) {
        kwSeconds += getAdjustedDaySeconds(dayEntries);
      }
    });

    const allDates = Object.keys(dayMap).sort();
    let totalWeekdays = 0;
    if (allDates.length > 0) {
      const firstDate = new Date(allDates[0] + 'T12:00:00');
      const lastDate = new Date(allDates[allDates.length - 1] + 'T12:00:00');
      const today = toZonedTime(new Date(), VIENNA_TZ);
      const endDate = lastDate > today ? today : lastDate;
      const cursor = new Date(firstDate);
      while (cursor <= endDate) {
        const day = getDay(cursor);
        if (day !== 0 && day !== 6) totalWeekdays++;
        cursor.setDate(cursor.getDate() + 1);
      }
      if (totalWeekdays === 0) totalWeekdays = 1;
    }

    const avgPerDay = totalWeekdays > 0 ? totalSeconds / totalWeekdays : 0;
    const delta = kwSeconds - WEEKLY_TARGET;

    // Saldo: for every ISO week from first entry to now, worked - 38h30m
    const weekTotals: Record<string, number> = {};
    Object.entries(dayMap).forEach(([dateKey, dayEntries]) => {
      const d = new Date(dateKey + 'T12:00:00');
      const wKey = startOfISOWeek(d).toISOString().slice(0, 10);
      if (!weekTotals[wKey]) weekTotals[wKey] = 0;
      weekTotals[wKey] += getAdjustedDaySeconds(dayEntries);
    });

    let ueberstunden = 154800; // 43h carried over from before this app
    if (allDates.length > 0) {
      const firstWeek = startOfISOWeek(new Date(allDates[0] + 'T12:00:00'));
      const currentWeek = startOfISOWeek(viennaNow);
      const cursor = new Date(firstWeek);
      while (cursor < currentWeek) {
        const wKey = cursor.toISOString().slice(0, 10);
        const worked = weekTotals[wKey] || 0;
        ueberstunden += worked - WEEKLY_TARGET;
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    return { totalSeconds, kwNumber, kwSeconds, avgPerDay, delta, ueberstunden };
  }, [completedEntries]);

  function formatStatDuration(seconds: number): string {
    const abs = Math.abs(seconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    return `${h}h ${m}m`;
  }

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
      {/* Stats info panel */}
      <motion.div
        className="fixed top-5 right-6 text-right z-10 space-y-0.5 select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <p className="text-xs font-medium text-[#1A1A1A]/25">
          Gesamt: {formatStatDuration(stats.totalSeconds)}
        </p>
        <p className="text-xs font-medium text-[#1A1A1A]/25">
          KW {stats.kwNumber}: {formatStatDuration(stats.kwSeconds)}
        </p>
        <p className="text-xs font-medium text-[#1A1A1A]/25">
          ø Tag: {formatStatDuration(stats.avgPerDay)}
        </p>
        <p className="text-xs font-medium text-[#1A1A1A]/25">
          To go: {formatStatDuration(Math.max(0, WEEKLY_TARGET - stats.kwSeconds - liveElapsed))}
        </p>
        <p
          className="text-xs font-medium"
          style={{ color: stats.ueberstunden >= 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)' }}
        >
          Saldo: {stats.ueberstunden >= 0 ? '+' : '-'}{formatStatDuration(stats.ueberstunden)}
        </p>
      </motion.div>

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
        <div className="mb-6">
          <CompanySelector
            selectedCompany={selectedCompany}
            onSelect={handleCompanyClick}
            isRunning={isRunning}
          />
        </div>

        {/* Location toggle */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="inline-flex items-center bg-white rounded-xl border-2 border-[#E5E7EB] p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <button
              onClick={() => setIsHomeOffice(false)}
              className="relative flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: !isHomeOffice ? '#F3F4F6' : 'transparent',
                color: !isHomeOffice ? '#1A1A1A' : '#9CA3AF',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Im Büro
            </button>
            <button
              onClick={() => setIsHomeOffice(true)}
              className="relative flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: isHomeOffice ? '#EFF6FF' : 'transparent',
                color: isHomeOffice ? '#3B82F6' : '#9CA3AF',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home Office
            </button>
          </div>
        </motion.div>

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
            <HistoryPanel entries={completedEntries} projects={projects} onEditEntry={handleEditEntry} />
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
