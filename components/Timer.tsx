'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '@/lib/utils';
import { Company, COMPANY_THEMES } from '@/lib/types';

interface TimerProps {
  isRunning: boolean;
  startTime: Date | null;
  selectedCompany: Company | null;
}

interface DigitProps {
  digit: string;
  isColon?: boolean;
  theme: { primary: string; glow: string } | null;
}

function Digit({ digit, isColon = false, theme }: DigitProps) {
  return (
    <div
      className={`relative overflow-hidden ${isColon ? 'w-6 md:w-8' : 'w-12 md:w-16'}`}
      style={{ height: '80px' }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          className={`
            absolute inset-0 flex items-center justify-center
            tabular-nums font-semibold text-5xl md:text-6xl
            ${isColon ? 'text-[#C4C4C4]' : 'text-[#1A1A1A]'}
          `}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
          style={{
            textShadow: !isColon && theme 
              ? `0 4px 20px ${theme.glow}` 
              : 'none',
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function Timer({ isRunning, startTime, selectedCompany }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && startTime) {
      const updateElapsed = () => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsed(diff);
      };

      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsed(0);
    }
  }, [isRunning, startTime]);

  const timeString = formatDuration(elapsed);
  const digits = timeString.split('');

  const theme = selectedCompany ? COMPANY_THEMES[selectedCompany] : null;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Background glow effect */}
      <AnimatePresence>
        {isRunning && theme && (
          <motion.div
            className="absolute inset-0 -inset-x-8 rounded-3xl blur-3xl"
            style={{ backgroundColor: theme.glow }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Timer display - no container */}
      <div className="relative py-8">
        {/* Digits */}
        <div className="flex items-center justify-center">
          {digits.map((digit, index) => (
            <Digit
              key={index}
              digit={digit}
              isColon={digit === ':'}
              theme={theme}
            />
          ))}
        </div>

        {/* Status indicator */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              className="flex items-center justify-center gap-2 mt-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme?.primary || '#3B82F6' }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-sm text-[#6B7280] font-medium">
                {theme?.name || 'Timer'} active
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
