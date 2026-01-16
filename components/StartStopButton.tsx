'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Company, COMPANY_THEMES } from '@/lib/types';

interface StartStopButtonProps {
  isRunning: boolean;
  selectedCompany: Company | null;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}

export default function StartStopButton({
  isRunning,
  selectedCompany,
  onStart,
  onStop,
  disabled,
}: StartStopButtonProps) {
  const theme = selectedCompany ? COMPANY_THEMES[selectedCompany] : null;
  const primaryColor = theme?.primary || '#3B82F6';
  const glowColor = theme?.glow || 'rgba(59, 130, 246, 0.15)';

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.5, type: 'spring', stiffness: 200 }}
    >
      <motion.button
        onClick={isRunning ? onStop : onStart}
        disabled={disabled}
        className={`
          relative overflow-hidden
          px-12 py-4 rounded-2xl
          font-semibold text-base tracking-wide
          outline-none focus:outline-none
          transition-all duration-200
          ${selectedCompany ? COMPANY_THEMES[selectedCompany].fontClass : 'font-merchandising'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        style={{
          backgroundColor: disabled ? '#E5E7EB' : primaryColor,
          color: '#FFFFFF',
          boxShadow: disabled 
            ? 'none'
            : `0 4px 20px -4px ${primaryColor}60, 0 8px 32px -8px ${primaryColor}40`,
        }}
        whileHover={!disabled ? { 
          scale: 1.03,
          boxShadow: `0 6px 28px -4px ${primaryColor}70, 0 12px 40px -8px ${primaryColor}50`
        } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        animate={isRunning ? {
          borderRadius: '16px',
        } : {
          borderRadius: '16px',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Background gradient overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}DD 100%)`,
          }}
          animate={{
            opacity: disabled ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          }}
          whileHover={{ 
            opacity: 1,
            x: ['0%', '200%'],
          }}
          transition={{ duration: 0.6 }}
        />

        {/* Breathing animation when running */}
        {isRunning && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            animate={{ 
              opacity: [0, 0.2, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Button content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isRunning ? 'stop' : 'start'}
            className="relative z-10 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {isRunning ? (
              <>
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>STOP TIMER</span>
              </>
            ) : (
              <span>START TIMER</span>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Outer glow ring when running */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ 
              border: `2px solid ${primaryColor}40`,
            }}
            initial={{ scale: 1, opacity: 0 }}
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.5, 0, 0.5],
            }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
