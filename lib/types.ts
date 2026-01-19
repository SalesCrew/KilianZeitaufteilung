export type Company = 'merchandising' | 'salescrew' | 'inkognito';

export interface Project {
  id: string;
  name: string;
  company: Company;
  color: string | null;
  created_at: string;
  archived: boolean;
}

export interface TimeEntry {
  id: string;
  company: Company;
  start_time: string;
  end_time: string | null;
  session_id: string;
  project_id: string | null;
  created_at: string;
  // Joined data
  project?: Project;
}

export interface Session {
  id: string;
  date: string;
  entries: TimeEntry[];
  totalDuration: number;
}

export interface CompanyTheme {
  name: string;
  primary: string;
  accent: string;
  glow: string;
  fontClass: string;
}

export const COMPANY_THEMES: Record<Company, CompanyTheme> = {
  merchandising: {
    name: 'Merchandising',
    primary: '#3B82F6',
    accent: '#DBEAFE',
    glow: 'rgba(59, 130, 246, 0.15)',
    fontClass: 'font-merchandising',
  },
  salescrew: {
    name: 'Salescrew',
    primary: '#F97316',
    accent: '#FFEDD5',
    glow: 'rgba(249, 115, 22, 0.15)',
    fontClass: 'font-salescrew',
  },
  inkognito: {
    name: 'Inkognito',
    primary: '#DC2626',
    accent: '#FEE2E2',
    glow: 'rgba(220, 38, 38, 0.15)',
    fontClass: 'font-inkognito',
  },
};
