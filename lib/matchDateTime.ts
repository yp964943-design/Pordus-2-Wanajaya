import type { MatchItem } from '@/data/pordusData';

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  pebruari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agt: 8,
  ags: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nopember: 11,
  nov: 11,
  desember: 12,
  des: 12,
};

function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  const raw = String(dateStr || '').trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  const dmyMatch = raw.match(/^(?:[a-zA-Z]+,\s*)?(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = Number.parseInt(dmyMatch[1], 10);
    const month = Number.parseInt(dmyMatch[2], 10);
    const year = Number.parseInt(dmyMatch[3], 10);
    if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  const idMatch = raw.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (idMatch) {
    const day = Number.parseInt(idMatch[1], 10);
    const monthKey = idMatch[2].toLowerCase();
    const month = INDONESIAN_MONTHS[monthKey];
    const year = Number.parseInt(idMatch[3], 10);
    if (month && year >= 1900 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  return null;
}

export function parseIndonesianDateTimestamp(dateStr: string): number {
  const parts = parseDateParts(dateStr);
  if (!parts) return Number.MAX_SAFE_INTEGER;
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function parseIndonesianDateToIso(dateStr: string, fallbackIso = '2026-11-22'): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return fallbackIso;
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function formatDateDDMMYYYY(dateStr: string): string {
  const trimmed = String(dateStr || '').trim();
  if (!trimmed) return '';
  const parts = parseDateParts(trimmed);
  if (!parts) return trimmed;
  return `${String(parts.day).padStart(2, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.year).padStart(4, '0')}`;
}

export function formatIndonesianDate(isoDate: string): string {
  return formatDateDDMMYYYY(isoDate);
}

export function parseMatchTimeMinutes(timeStr: string): number {
  const match = String(timeStr || '').match(/(\d{1,2})[.:](\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
}

export function parseWibTimeTo24(timeStr: string, fallback = '15:30'): string {
  const match = String(timeStr || '').match(/(\d{1,2})[.:](\d{2})/);
  if (!match) return fallback;
  const hours = Math.min(23, Math.max(0, Number.parseInt(match[1], 10)));
  const minutes = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return fallback;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatWibTime(time24: string): string {
  if (!time24) return '';
  return `${time24.replace(':', '.')} WIB`;
}

export function compareIndonesianDates(dateA: string, dateB: string): number {
  const tsA = parseIndonesianDateTimestamp(dateA);
  const tsB = parseIndonesianDateTimestamp(dateB);
  if (tsA !== tsB) return tsA - tsB;
  return dateA.localeCompare(dateB, 'id');
}

export function compareMatchesByDateTime(
  a: Pick<MatchItem, 'date' | 'time'>,
  b: Pick<MatchItem, 'date' | 'time'>
): number {
  const dateDiff = compareIndonesianDates(a.date, b.date);
  if (dateDiff !== 0) return dateDiff;
  return parseMatchTimeMinutes(a.time) - parseMatchTimeMinutes(b.time);
}
