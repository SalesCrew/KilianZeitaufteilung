'use client';

import { motion } from 'framer-motion';
import { Company, COMPANY_THEMES } from '@/lib/types';

interface CompanySelectorProps {
  selectedCompany: Company | null;
  onSelect: (company: Company) => void;
  isRunning: boolean;
}

const companies: Company[] = ['merchandising', 'salescre', 'inkognito'];

export default function CompanySelector({
  selectedCompany,
  onSelect,
  isRunning,
}: CompanySelectorProps) {
  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      {companies.map((company, index) => {
        const theme = COMPANY_THEMES[company];
        const isSelected = selectedCompany === company;

        return (
          <motion.button
            key={company}
            onClick={() => onSelect(company)}
            className={`
              relative px-6 py-3 rounded-xl font-medium text-sm
              transition-all duration-300 ease-out
              outline-none focus:outline-none
              ${theme.fontClass}
            `}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: 0.3 + index * 0.1,
              ease: [0.4, 0, 0.2, 1]
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: isSelected ? theme.accent : '#FFFFFF',
              border: `2px solid ${isSelected ? theme.primary : '#E5E7EB'}`,
              color: isSelected ? theme.primary : '#6B7280',
              boxShadow: isSelected 
                ? `0 0 0 4px ${theme.glow}, 0 4px 20px -4px ${theme.glow}`
                : '0 2px 8px -2px rgba(0,0,0,0.04)',
            }}
          >
            {/* Pulse glow for active running state */}
            {isSelected && isRunning && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: theme.glow }}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            )}

            {/* Active indicator bar */}
            <motion.div
              className="absolute bottom-0 left-1/2 h-0.5 rounded-full"
              style={{ backgroundColor: theme.primary }}
              initial={{ width: 0, x: '-50%' }}
              animate={{ 
                width: isSelected ? '60%' : 0,
                x: '-50%'
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            />

            <span className="relative z-10">{theme.name}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
