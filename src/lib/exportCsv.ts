import { received, outstanding, paymentStatus } from '@/lib/receivables';
import type { Shift } from '@/types';
import { BILLING_UNIT_LABELS } from '@/types';
import { getTypeLabel, hasTimeRange, shiftHours } from '@/lib/shiftUtils';

const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const COLUMNS = [
  'Data',
  'Dia da semana',
  'Tipo',
  'Empresa / Local',
  'Início',
  'Término',
  'Horas',
  'Cobrança',
  'Valor unitário (R$)',
  'Quantidade',
  'Valor total (R$)',
  'Pago',
  'Data do pagamento',
  'Data final',
  'Observações',
  'Recebido (R$)',
  'Saldo (R$)',
  'Recebimentos (data: valor)',
];

// AAAA-MM-DD -> DD/MM/AAAA (sem usar Date, evita erro de fuso horário)
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function weekday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// Número no padrão brasileiro: 1234,50
function num(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

// Texto seguro para CSV: aspas quando preciso e proteção contra fórmulas
function text(value: string): string {
  const safe = /^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildShiftsCsv(shifts: Shift[]): Blob {
  const sorted = [...shifts].sort((a, b) =>
    a.date === b.date
      ? a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date)
  );

  const lines: string[] = [COLUMNS.join(';')];

  let totalHours = 0;
  let totalValue = 0;
  let paidHours = 0;
  let paidValue = 0;

  for (const s of sorted) {
    const hours = shiftHours(s);
    totalValue += s.value;
    if (hours !== null) totalHours += hours;
    paidValue += received(s);
    if (s.paid) {
      if (hours !== null) paidHours += hours;
    }
    const timed = hasTimeRange(s);
    lines.push(
      [
        formatDate(s.date),
        weekday(s.date),
        text(getTypeLabel(s)),
        text(s.location),
        timed ? s.startTime : '',
        timed ? s.endTime : '',
        hours !== null ? num(hours) : '',
        s.billingUnit ? BILLING_UNIT_LABELS[s.billingUnit] : '',
        s.unitValue !== undefined ? num(s.unitValue) : '',
        s.quantity !== undefined ? String(s.quantity).replace('.', ',') : '',
        num(s.value),
        paymentStatus(s),
        s.paymentDate ? formatDate(s.paymentDate) : '',
        s.endDate ? formatDate(s.endDate) : '',
        text(s.notes ?? ''),
        num(received(s)),
        num(outstanding(s)),
        text((s.payments ?? []).map(p => `${p.date}: ${num(p.amount)}`).join(' | ')),
      ].join(';')
    );
  }

  const summary = (label: string, hours: number, value: number) => {
    const row = Array<string>(COLUMNS.length).fill('');
    row[0] = label;
    row[6] = num(hours);
    row[10] = num(value);
    return row.join(';');
  };

  lines.push('');
  lines.push(summary('TOTAL', totalHours, totalValue));
  lines.push(summary('PAGO', paidHours, paidValue));
  lines.push(summary('A RECEBER', totalHours - paidHours, totalValue - paidValue));

  // \uFEFF faz o Excel reconhecer acentos corretamente
  return new Blob(['\uFEFF' + lines.join('\r\n') + '\r\n'], {
    type: 'text/csv;charset=utf-8',
  });
}
