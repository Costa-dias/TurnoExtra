import { useState, useEffect, useCallback } from 'react';
import { Trash2, Save, Layers } from 'lucide-react';
import type { Shift, ShiftTemplate, ServiceType, BillingUnit } from '@/types';
import { SERVICE_TYPE_LABELS, BILLING_UNIT_LABELS } from '@/types';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import { Toggle } from '@/components/Toggle';
import { ColorPicker } from '@/components/ColorPicker';
import { validateShift, validateTemplate, sanitizeString } from '@/lib/validation';
import { formatDateBR, formatCurrency, calcHours } from '@/lib/dateUtils';

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  shift?: Shift | null;
  defaultDate: string;
  templates: ShiftTemplate[];
  onSave: (data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdate: (id: string, data: Partial<Shift>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onSaveTemplate: (tpl: Omit<ShiftTemplate, 'id'>) => Promise<boolean>;
}

const TYPES: ServiceType[] = ['plantao', 'servico', 'hora_extra', 'contrato'];
const UNITS: BillingUnit[] = ['hora', 'dia', 'semana', 'mes'];
const UNIT_PLURAL: Record<BillingUnit, string> = {
  hora: 'horas',
  dia: 'dias',
  semana: 'semanas',
  mes: 'meses',
};

const labelCls = 'text-sm font-medium text-slate-700 dark:text-slate-300';
const boxCls =
  'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50';
const selectCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-hidden focus:ring-2 focus:ring-teal-600/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-500/50';

function toNumber(text: string): number {
  const n = parseFloat(text);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function ShiftModal({
  open,
  onClose,
  shift,
  defaultDate,
  templates,
  onSave,
  onUpdate,
  onDelete,
  onSaveTemplate,
}: ShiftModalProps) {
  const isEdit = !!shift;

  const [type, setType] = useState<ServiceType>('plantao');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#0d9488');
  const [date, setDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState('');
  const [hasTime, setHasTime] = useState(true);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('19:00');
  const [value, setValue] = useState('');
  const [billingUnit, setBillingUnit] = useState<BillingUnit>('mes');
  const [unitValue, setUnitValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (shift) {
      setType(shift.type ?? 'plantao');
      setLocation(shift.location);
      setColor(shift.color);
      setDate(shift.date);
      setEndDate(shift.endDate ?? '');
      setHasTime(shift.hasTime !== false);
      setStartTime(shift.hasTime === false ? '07:00' : shift.startTime);
      setEndTime(shift.hasTime === false ? '19:00' : shift.endTime);
      setValue(shift.value !== undefined ? String(shift.value) : '');
      setBillingUnit(shift.billingUnit ?? 'mes');
      setUnitValue(shift.unitValue !== undefined ? String(shift.unitValue) : '');
      setQuantity(shift.quantity !== undefined ? String(shift.quantity) : '');
      setPaymentDate(shift.paymentDate ?? '');
      setPaid(shift.paid);
      setNotes(shift.notes ?? '');
    } else {
      setType('plantao');
      setLocation('');
      setColor('#0d9488');
      setDate(defaultDate);
      setEndDate('');
      setHasTime(true);
      setStartTime('07:00');
      setEndTime('19:00');
      setValue('');
      setBillingUnit('mes');
      setUnitValue('');
      setQuantity('');
      setPaymentDate('');
      setPaid(false);
      setNotes('');
    }
    setErrors({});
  }, [shift, open, defaultDate]);

  const isHourly = type === 'hora_extra';
  const isContract = type === 'contrato';
  const usesRate = isHourly || isContract;
  const timed = type === 'plantao' || isHourly || hasTime;
  const activeUnit: BillingUnit = isHourly ? 'hora' : billingUnit;
  const unitName = BILLING_UNIT_LABELS[activeUnit].toLowerCase();

  const qtyNum = isHourly
    ? startTime && endTime
      ? Math.round(calcHours(startTime, endTime) * 100) / 100
      : 0
    : toNumber(quantity);
  const unitNum = toNumber(unitValue);
  const total = usesRate ? Math.round(unitNum * qtyNum * 100) / 100 : toNumber(value);

  const handleTypeChange = useCallback(
    (next: ServiceType) => {
      setType(next);
      setErrors({});
      if (!isEdit) {
        setHasTime(next === 'plantao' || next === 'hora_extra');
        if (next === 'contrato') setBillingUnit('mes');
      }
    },
    [isEdit]
  );

  const handleApplyTemplate = useCallback((tpl: ShiftTemplate) => {
    setLocation(tpl.location);
    setColor(tpl.color);
    setHasTime(true);
    setStartTime(tpl.startTime);
    setEndTime(tpl.endTime);
    setValue(tpl.value !== undefined ? String(tpl.value) : '');
    setNotes(tpl.notes ?? '');
  }, []);

  const handleSave = useCallback(async () => {
    if (busy) return;
    const data: Partial<Shift> = {
      type,
      location: sanitizeString(location, 100),
      color,
      date,
      hasTime: timed,
      startTime: timed ? startTime : '00:00',
      endTime: timed ? endTime : '00:00',
      value: total,
      billingUnit: usesRate ? activeUnit : undefined,
      unitValue: usesRate ? unitNum : undefined,
      quantity: usesRate ? qtyNum : undefined,
      endDate: isContract && endDate ? endDate : undefined,
      paymentDate: paymentDate || undefined,
      paid,
      notes: notes ? sanitizeString(notes, 1000) : undefined,
    };

    const { valid, errors: validationErrors } = validateShift(data);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setBusy(true);
    try {
      const ok = isEdit && shift ? await onUpdate(shift.id, data)
        : await onSave(data as Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>);
      if (ok) onClose();
    } finally { setBusy(false); }
  }, [
    type, location, color, date, timed, startTime, endTime, total, usesRate,
    activeUnit, unitNum, qtyNum, isContract, endDate, paymentDate, paid, notes,
    isEdit, shift, onUpdate, onSave, onClose, busy,
  ]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (busy) return;
    if (!location.trim()) return;
    const template = {
      name: sanitizeString(timed ? `${location} ${startTime}-${endTime}` : location, 100),
      location: sanitizeString(location, 100),
      color,
      startTime: timed ? startTime : '00:00',
      endTime: timed ? endTime : '00:00',
      value: total,
      notes: notes ? sanitizeString(notes, 1000) : undefined,
    };
    const validation = validateTemplate(template);
    if (!validation.valid) { setErrors(validation.errors); return; }
    setBusy(true);
    try { await onSaveTemplate(template); } finally { setBusy(false); }
  }, [location, timed, startTime, endTime, color, total, notes, onSaveTemplate, busy]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Editar ${SERVICE_TYPE_LABELS[type].toLowerCase()}` : 'Novo serviço'}
      maxWidth="max-w-xl"
      footer={
        <>
          {isEdit && (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={async () => {
                if (shift && confirm('Excluir este serviço?') && await onDelete(shift.id)) {
                  onClose();
                }
              }}
            >
              <Trash2 size={16} /> Excluir
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={busy}>
            <Save size={16} /> {isEdit ? 'Salvar' : 'Adicionar'}
          </Button>
        </>
      }
    >
      {/* Modelos */}
      {templates.length > 0 && (
        <div className="mb-5">
          <div className={`mb-2 flex items-center gap-2 ${labelCls}`}>
            <Layers size={15} className="text-teal-700 dark:text-teal-400" />
            Modelos
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                aria-label={`Aplicar modelo ${tpl.name}`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-700 transition hover:border-teal-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:bg-slate-700"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tpl.color }} />
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Tipo */}
        <div>
          <span className={`mb-2 block ${labelCls}`}>Tipo</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                aria-pressed={type === t}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  type === t
                    ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-600/20 dark:text-teal-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {SERVICE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={type === 'plantao' ? 'Local do plantão *' : 'Empresa / Cliente *'}
          placeholder="Ex: Hospital Central, Empresa X, Cliente Y"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          error={errors.location}
          maxLength={100}
        />

        <div>
          <span className={`mb-2 block ${labelCls}`}>Cor da etiqueta</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {/* Datas */}
        <div className={`grid grid-cols-1 gap-4 ${isContract ? 'sm:grid-cols-2' : ''}`}>
          <Input
            label={isContract ? 'Data de início' : 'Data'}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          {isContract && (
            <Input
              label="Data final (opcional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
            />
          )}
        </div>

        {/* Horário */}
        {(type === 'servico' || isContract) && (
          <div className={`flex items-center justify-between ${boxCls}`}>
            <span className={labelCls}>Definir horário</span>
            <Toggle checked={hasTime} onChange={setHasTime} label="Definir horário" />
          </div>
        )}
        {timed && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              error={errors.startTime}
            />
            <Input
              label="Fim"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              error={errors.endTime}
            />
          </div>
        )}

        {/* Valores */}
        {!usesRate && (
          <Input
            label="Valor total (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={errors.value}
          />
        )}

        {isHourly && (
          <Input
            label="Valor por hora (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={unitValue}
            onChange={(e) => setUnitValue(e.target.value)}
            error={errors.unitValue ?? errors.quantity}
          />
        )}

        {isContract && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="billing-unit" className={labelCls}>
                Cobrança por
              </label>
              <select
                id="billing-unit"
                value={billingUnit}
                onChange={(e) => setBillingUnit(e.target.value as BillingUnit)}
                className={selectCls}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {BILLING_UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
              {errors.billingUnit && (
                <span className="text-xs text-red-600 dark:text-red-400">{errors.billingUnit}</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={`Valor por ${unitName} (R$)`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                error={errors.unitValue}
              />
              <Input
                label={`Quantidade de ${UNIT_PLURAL[activeUnit]}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                error={errors.quantity}
              />
            </div>
          </div>
        )}

        {usesRate && (
          <div className={boxCls}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {qtyNum} {qtyNum === 1 ? unitName : UNIT_PLURAL[activeUnit]} × {formatCurrency(unitNum)}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-400">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}

        <Input
          label="Data de pagamento"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          error={errors.paymentDate}
        />

        {(!usesRate && value !== '') || paymentDate !== '' ? (
          <div className={boxCls}>
            {!usesRate && value !== '' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Valor do serviço</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {formatCurrency(total)}
                </span>
              </div>
            )}
            {paymentDate !== '' && (
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Pagamento em</span>
                <span className="text-slate-800 dark:text-slate-300">{formatDateBR(paymentDate)}</span>
              </div>
            )}
          </div>
        ) : null}

        <div className={`flex items-center justify-between ${boxCls}`}>
          <span className={labelCls}>Marcar como pago</span>
          <Toggle checked={paid} onChange={setPaid} label="Marcar como pago" />
        </div>

        <Textarea
          label="Observações"
          placeholder="Notas adicionais sobre este serviço..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          error={errors.notes}
        />

        {!isEdit && location.trim() && (
          <button
            type="button"
            onClick={handleSaveAsTemplate}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm text-slate-600 transition hover:border-teal-600 hover:text-teal-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-teal-500 dark:hover:text-teal-400"
          >
            <Layers size={15} />
            Salvar como modelo
          </button>
        )}
      </div>
    </Modal>
  );
}
