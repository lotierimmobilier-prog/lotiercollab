import { addDays, addMonths, addYears, differenceInCalendarDays, format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatRelativeDate(dateStr: string | null): { label: string; status: 'overdue' | 'soon' | 'today' | 'normal' | null } {
  if (!dateStr) return { label: '', status: null };
  const date = new Date(dateStr + 'T00:00:00');
  const diff = differenceInCalendarDays(date, new Date());

  if (isToday(date)) return { label: "Aujourd'hui", status: 'today' };
  if (isTomorrow(date)) return { label: 'Demain', status: 'soon' };
  if (diff < 0) return { label: format(date, 'd MMM', { locale: fr }), status: 'overdue' };
  if (diff <= 3) return { label: `Dans ${diff} jours`, status: 'soon' };
  return { label: format(date, 'd MMM', { locale: fr }), status: 'normal' };
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "d MMM à HH'h'mm", { locale: fr });
}

export type RecurrenceKey = '15d' | '30d' | '3m' | '6m' | '1y';

export const RECURRENCE_OPTIONS: { value: RecurrenceKey; label: string }[] = [
  { value: '15d', label: 'Tous les 15 jours' },
  { value: '30d', label: 'Tous les 30 jours' },
  { value: '3m', label: 'Trimestrielle' },
  { value: '6m', label: 'Semestrielle' },
  { value: '1y', label: 'Annuelle' },
];

export function computeNextRecurrenceDate(from: Date, recurrence: RecurrenceKey): string {
  let next: Date;
  switch (recurrence) {
    case '15d': next = addDays(from, 15); break;
    case '30d': next = addDays(from, 30); break;
    case '3m': next = addMonths(from, 3); break;
    case '6m': next = addMonths(from, 6); break;
    case '1y': next = addYears(from, 1); break;
  }
  return format(next, 'yyyy-MM-dd');
}
