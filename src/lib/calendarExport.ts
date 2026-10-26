import type { Shift } from '@/types';
import { interval } from './receivables';

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
function stamp(ms: number): string { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, ''); }
// RFC 5545 lines are folded by UTF-8 octets, not JavaScript string length.
function fold(line: string): string {
  let current = '', size = 0; const lines: string[] = [];
  for (const ch of line) {
    const length = new TextEncoder().encode(ch).length;
    if (size + length > 75) { lines.push(current); current = ' '; size = 1; }
    current += ch; size += length;
  }
  return [...lines, current].join('\r\n');
}
export function buildCalendar(shifts: Shift[]): Blob {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TurnoExtra//Agenda//PT-BR', 'CALSCALE:GREGORIAN'];
  for (const s of shifts) {
    const range = interval(s);
    lines.push('BEGIN:VEVENT', `UID:${escapeText(s.id)}@turnoextra.local`, `DTSTAMP:${stamp(Date.now())}Z`);
    if (range) lines.push(`DTSTART:${stamp(range[0])}`, `DTEND:${stamp(range[1])}`);
    else {
      const next = new Date(`${s.endDate || s.date}T00:00:00Z`).getTime() + 86400000;
      lines.push(`DTSTART;VALUE=DATE:${s.date.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${stamp(next).slice(0, 8)}`);
    }
    lines.push(`SUMMARY:${escapeText(s.location)}`, `DESCRIPTION:${escapeText(s.notes || '')}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return new Blob([lines.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
}
