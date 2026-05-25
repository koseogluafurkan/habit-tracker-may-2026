import { format } from 'date-fns';

function escapeIcs(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatIcsDate(date: Date) {
  return format(date, 'yyyyMMdd');
}

export function buildReminderIcs(date: Date, reminderText: string) {
  const dateKey = formatIcsDate(date);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const uid = `habit-journal-${dateKey}@habitjournal.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Habit Journal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART;VALUE=DATE:${dateKey}`,
    `DTEND;VALUE=DATE:${formatIcsDate(nextDay)}`,
    `SUMMARY:${escapeIcs('Habit Journal — ' + reminderText.slice(0, 60))}`,
    `DESCRIPTION:${escapeIcs(reminderText)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Habit Journal reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(icsContent: string, filename: string) {
  if (typeof document === 'undefined') return false;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function syncReminderToCalendar(date: Date, reminderText: string) {
  if (!reminderText.trim()) return { ok: false, reason: 'empty' as const };
  if (typeof window === 'undefined') return { ok: false, reason: 'no-window' as const };

  const ics = buildReminderIcs(date, reminderText.trim());
  const filename = `habit-journal-${format(date, 'yyyy-MM-dd')}.ics`;

  if (typeof navigator !== 'undefined' && navigator.share && /iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      const file = new File([ics], filename, { type: 'text/calendar' });
      await navigator.share({ files: [file], title: 'Add to Calendar' });
      return { ok: true, method: 'share' as const };
    } catch {
      // fall through to download
    }
  }

  downloadIcsFile(ics, filename);
  return { ok: true, method: 'download' as const };
}
