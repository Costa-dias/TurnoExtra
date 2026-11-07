import type { Payment } from '@/types';
export function editPayment(payments: Payment[], id: string, amount: number, date: string, total: number, today: string): Payment[] {
  const payment = payments.find(p => p.id === id);
  if (!payment) throw new Error('Recebimento não encontrado.');
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > today) throw new Error('Informe uma data válida, até hoje.');
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > .00001) throw new Error('Informe um valor positivo com até duas casas decimais.');
  const cents = Math.round(amount * 100);
  const other = payments.filter(p => p.id !== id).reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
  if (!Number.isFinite(total) || cents + other > Math.round(total * 100)) throw new Error('O recebimento supera o saldo disponível para correção.');
  return payments.map(p => p.id === id ? { ...p, amount: cents / 100, date, dateInferred: false } : p);
}
