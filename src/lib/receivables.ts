import type { Shift } from '@/types';
import { toISODate } from './dateUtils';

export function received(s: Shift): number {
  return s.payments ? Math.round(s.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100 : s.paid ? s.value : 0;
}
export function outstanding(s: Shift): number {
  return Math.max(0, Math.round((s.value - received(s)) * 100) / 100);
}
export function paymentStatus(s: Shift): string {
  return outstanding(s) === 0 ? 'Pago' : received(s) > 0 ? 'Parcial' : 'Pendente';
}
export function dueStatus(s: Shift, today = toISODate(new Date())): string {
  if (!outstanding(s)) return 'Pago';
  if (!s.paymentDate) return 'Sem vencimento';
  return s.paymentDate < today ? 'Vencido' : s.paymentDate === today ? 'Vence hoje' : 'A vencer';
}
// Local wall-clock intervals: a 19:00–07:00 shift ends on the following day.
export function interval(s: Pick<Shift, 'date' | 'startTime' | 'endTime' | 'hasTime'>): [number, number] | null {
  if (s.hasTime === false) return null;
  const start = Date.parse(`${s.date}T${s.startTime}:00Z`);
  let end = Date.parse(`${s.date}T${s.endTime}:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (end <= start) end += 86400000;
  return [start, end];
}
export function conflicts(a: Pick<Shift, 'date' | 'startTime' | 'endTime' | 'hasTime'>, b: Pick<Shift, 'date' | 'startTime' | 'endTime' | 'hasTime'>): boolean {
  const x = interval(a), y = interval(b);
  return !!x && !!y && x[0] < y[1] && y[0] < x[1];
}
