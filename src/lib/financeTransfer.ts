import type { Shift } from '@/types';
export function financeTransfer(shifts: Shift[]): Blob {
  const entries = shifts.flatMap(s => {
    const payments = s.payments ?? (s.paid && s.value > 0 ? [{ id: 'legacy', amount: s.value, date: s.paymentDate || s.date }] : []);
    return payments.map(p => ({ id: `turnoextra:${s.id}:${p.id}`, title: `Serviço: ${s.location}`.slice(0, 80), amount: p.amount, date: p.date, dateInferred: !s.payments && !s.paymentDate }));
  });
  if (!entries.length) throw new Error('Não há recebimentos registrados para transferir.');
  if (entries.length > 20000) throw new Error('Há mais de 20.000 recebimentos; reduza o período antes de transferir.');
  const blob = new Blob([JSON.stringify({ format: 'turnoextra-receipts', version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)], { type: 'application/json' });
  if (blob.size > 5 * 1024 * 1024) throw new Error('Arquivo excede 5 MB.');
  return blob;
}
