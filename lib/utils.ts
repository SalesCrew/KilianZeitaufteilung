import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, startOfDay, isToday, isYesterday, differenceInSeconds } from 'date-fns';

const VIENNA_TZ = 'Europe/Vienna';

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, VIENNA_TZ, 'HH:mm');
}

export function formatTimeWithSeconds(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, VIENNA_TZ, 'HH:mm:ss');
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const viennaDate = toZonedTime(date, VIENNA_TZ);
  
  if (isToday(viennaDate)) {
    return 'Today';
  }
  if (isYesterday(viennaDate)) {
    return 'Yesterday';
  }
  return format(viennaDate, 'EEEE');
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  const viennaDate = toZonedTime(date, VIENNA_TZ);
  return format(viennaDate, 'MMMM d, yyyy');
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, VIENNA_TZ, 'dd.MM');
}

export function getViennaStartOfDay(date: Date = new Date()): Date {
  const viennaDate = toZonedTime(date, VIENNA_TZ);
  return startOfDay(viennaDate);
}

export function calculateDuration(startTime: string, endTime: string | null): number {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  return Math.max(0, differenceInSeconds(end, start));
}

export function getViennaDateString(date: Date = new Date()): string {
  return formatInTimeZone(date, VIENNA_TZ, 'yyyy-MM-dd');
}

export function getNowISO(): string {
  return new Date().toISOString();
}
