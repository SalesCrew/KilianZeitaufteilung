'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Timer from '@/components/Timer';
import CompanySelector from '@/components/CompanySelector';
import StartStopButton from '@/components/StartStopButton';
import HistoryPanel from '@/components/HistoryPanel';
import { Company, TimeEntry, COMPANY_THEMES } from '@/lib/types';
import { getNowISO } from '@/lib/utils';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
  );
};

export default function Home() {
  // Core state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  
  // Track current entry start time for local mode
  const currentEntryStartRef = useRef<string | null>(null);

  // Load entries from localStorage or API on mount
  useEffect(() => {
    const loadEntries = async () => {
      // Try API first
      if (isSupabaseConfigured()) {
        try {
          const res = await fetch('/api/time-entries');
          if (res.ok) {
            const data = await res.json();
            if (!data.error) {
              setEntries(data);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('API not available, using local storage');
        }
      }

      // Fallback to localStorage
      setUseLocalStorage(true);
      const stored = localStorage.getItem('time-entries');
      if (stored) {
        try {
          setEntries(JSON.parse(stored));
        } catch {
          setEntries([]);
        }
      }
      setIsLoading(false);
    };

    loadEntries();
  }, []);

  // Save to localStorage when entries change (if using local mode)
  useEffect(() => {
    if (useLocalStorage && entries.length > 0) {
      localStorage.setItem('time-entries', JSON.stringify(entries));
    }
  }, [entries, useLocalStorage]);

  // Add entry locally
  const addEntryLocal = useCallback((entry: TimeEntry) => {
    setEntries((prev) => [entry, ...prev]);
  }, []);

  // Update entry locally
  const updateEntryLocal = useCallback((id: string, updates: Partial<TimeEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  // Handle company selection
  const handleCompanySelect = useCallback(async (company: Company) => {
    const previousCompany = selectedCompany;
    setSelectedCompany(company);

    // If timer is running and we're switching companies, create a new entry
    if (isRunning && previousCompany !== company && currentEntryId) {
      const now = getNowISO();

      if (useLocalStorage) {
        // Update current entry end time locally
        updateEntryLocal(currentEntryId, { end_time: now });

        // Create new entry for new company
        const newEntry: TimeEntry = {
          id: uuidv4(),
          company,
          start_time: now,
          end_time: null,
          session_id: sessionId!,
          created_at: now,
        };
        addEntryLocal(newEntry);
        setCurrentEntryId(newEntry.id);
        currentEntryStartRef.current = now;
      } else {
        // Use API
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
            }),
          });

          if (res.ok) {
            const newEntry = await res.json();
            setCurrentEntryId(newEntry.id);
            // Refetch entries
            const fetchRes = await fetch('/api/time-entries');
            if (fetchRes.ok) {
              setEntries(await fetchRes.json());
            }
          }
        } catch (error) {
          console.error('Failed to switch company:', error);
        }
      }
    }
  }, [selectedCompany, isRunning, currentEntryId, sessionId, useLocalStorage, addEntryLocal, updateEntryLocal]);

  // Start timer
  const handleStart = useCallback(async () => {
    if (!selectedCompany) return;

    const newSessionId = uuidv4();
    const now = new Date();
    const nowISO = now.toISOString();

    setSessionId(newSessionId);
    setStartTime(now);
    setIsRunning(true);

    if (useLocalStorage) {
      // Create entry locally
      const newEntry: TimeEntry = {
        id: uuidv4(),
        company: selectedCompany,
        start_time: nowISO,
        end_time: null,
        session_id: newSessionId,
        created_at: nowISO,
      };
      addEntryLocal(newEntry);
      setCurrentEntryId(newEntry.id);
      currentEntryStartRef.current = nowISO;
    } else {
      // Use API
      try {
        const res = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: selectedCompany,
            start_time: nowISO,
            session_id: newSessionId,
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
  }, [selectedCompany, useLocalStorage, addEntryLocal]);

  // Stop timer
  const handleStop = useCallback(async () => {
    if (!currentEntryId) return;

    const now = getNowISO();

    if (useLocalStorage) {
      // Update entry locally
      updateEntryLocal(currentEntryId, { end_time: now });
    } else {
      // Use API
      try {
        await fetch('/api/time-entries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentEntryId, end_time: now }),
        });
        
        // Refetch entries
        const fetchRes = await fetch('/api/time-entries');
        if (fetchRes.ok) {
          setEntries(await fetchRes.json());
        }
      } catch (error) {
        console.error('Failed to stop timer:', error);
      }
    }

    setIsRunning(false);
    setCurrentEntryId(null);
    setSessionId(null);
    setStartTime(null);
    currentEntryStartRef.current = null;
  }, [currentEntryId, useLocalStorage, updateEntryLocal]);

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
            onSelect={handleCompanySelect}
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
            disabled={!selectedCompany}
          />
        </div>

        {/* Divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent mb-8"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />

        {/* History Panel */}
        <AnimatePresence>
          {!isLoading && (
            <HistoryPanel entries={completedEntries} />
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
    </main>
  );
}
