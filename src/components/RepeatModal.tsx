import { useEffect, useMemo, useState } from 'react';
import { Repeat } from 'lucide-react';
import type { Shift } from '@/types';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatDateBR } from '@/lib/dateUtils';

type NewShift = Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>;

interface RepeatModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  existing: Shift[];
  onConfirm: (shifts: NewShift[]) => Promise<boolean>;
}

const INTERVALS = [
  { days: 1, label: 'Todo dia' },
  { days: 2, label: 'A cada 2 dias (12x36)' },
  { days: 7, label: 'Toda semana' },
  { days: 14, label: 'A cada 2 semanas' },
];

const MAX_REPEATS = 30;

// Soma dias a uma data AAAA-MM-DD sem depender do fuso horário
function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function RepeatModal({ open, onClose, shift, existing, onConfirm }: RepeatModalProps) {
  const [interval, setIntervalDays] = useState(7);
  const [countText, setCountText] = useState('4');

  useEffect(() => {
    if (open) {
      setIntervalDays(7);
      setCountText('4');
    }
  }, [open]);

  const count = Math.min(MAX_REPEATS, Math.max(0, parseInt(countText, 10) || 0));

  const plan = useMemo(() => {
    const toCreate: NewShift[] = [];
    let skipped = 0;
    if (!shift || count === 0) return { toCreate, skipped };

    // Copia o serviço, mas não o id, as datas de controle, o pagamento nem o fim do contrato
    const base: NewShift = {
      location: shift.location, color: shift.color, date: shift.date,
      startTime: shift.startTime, endTime: shift.endTime,
      value: shift.value, paid: false, notes: shift.notes,
      type: shift.type, hasTime: shift.hasTime, billingUnit: shift.billingUnit,
      unitValue: shift.unitValue, quantity: shift.quantity,
    };

    for (let i = 1; i <= count; i++) {
      const date = addDays(shift.date, interval * i);
      const duplicate = existing.some(
        (s) => s.date === date && s.location === shift.location && s.startTime === shift.startTime
      );
      if (duplicate) {
        skipped++;
        continue;
      }
      toCreate.push({ ...base, date, paid: false });
    }
    return { toCreate, skipped };
  }, [shift, existing, interval, count]);

  if (!shift) return null;

  const lastDate = plan.toCreate.length > 0 ? plan.toCreate[plan.toCreate.length - 1].date : null;
  const timeLabel =
    shift.hasTime === false ? 'Sem horário definido' : `${shift.startTime} às ${shift.endTime}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Repetir serviço"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={plan.toCreate.length === 0}
            onClick={async () => {
              if (!(await onConfirm(plan.toCreate))) return;
              onClose();
            }}
          >
            <Repeat size={16} /> Criar {plan.toCreate.length}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="truncate font-medium text-slate-900 dark:text-slate-200">{shift.location}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {formatDateBR(shift.date)} · {timeLabel}
          </p>
        </div>

        <div>
          <label
            htmlFor="repeat-interval"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Repetir
          </label>
          <select
            id="repeat-interval"
            value={interval}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500"
          >
            {INTERVALS.map((item) => (
              <option key={item.days} value={item.days}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label={`Quantas vezes repetir (1 a ${MAX_REPEATS})`}
          type="text"
          inputMode="numeric"
          placeholder="4"
          value={countText}
          onChange={(e) => setCountText(e.target.value.replace(/\D/g, '').slice(0, 2))}
        />

        <p className="text-sm text-slate-600 dark:text-slate-400">
          {lastDate
            ? `Serão criados ${plan.toCreate.length} serviços, até ${formatDateBR(lastDate)}.`
            : 'Nenhum serviço novo para criar.'}
          {plan.skipped > 0 && ` ${plan.skipped} já existem e serão ignorados.`}
        </p>
        <p className="text-xs text-slate-500">Os serviços copiados começam como "não pagos".</p>
      </div>
    </Modal>
  );
}
