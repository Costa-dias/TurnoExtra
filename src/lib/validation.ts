import type { AppData, Shift, ShiftTemplate } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const MAX_LOCATION = 100;
const MAX_NOTES = 1000;
const MAX_NAME = 100;
const MAX_SHIFTS = 20_000;
const MAX_TEMPLATES = 1_000;
const MAX_VALUE = 10_000_000;
const MAX_QUANTITY = 100_000;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const SERVICE_TYPES: readonly string[] = ['plantao', 'servico', 'hora_extra', 'contrato'];
const BILLING_UNITS: readonly string[] = ['hora', 'dia', 'semana', 'mes'];

export function sanitizeString(input: string, maxLen: number): string {
  const stripped = input
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  return stripped.slice(0, maxLen);
}

function isFiniteNonNegative(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
}

function isFinitePositive(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= max;
}

function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

export function isValidBackupData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<AppData>;
  if (!Array.isArray(data.shifts) || data.shifts.length > MAX_SHIFTS) return false;
  if (!Array.isArray(data.templates) || data.templates.length > MAX_TEMPLATES) return false;
  if (!data.settings || typeof data.settings !== 'object') return false;
  if (data.settings.theme !== 'dark' && data.settings.theme !== 'light') return false;
  if (!isValidColor(data.settings.defaultColor)) return false;

  const shiftIds = new Set<string>();
  for (const shift of data.shifts) {
    if (!shift || typeof shift !== 'object') return false;
    if (typeof shift.id !== 'string' || shift.id.length > 100 || shiftIds.has(shift.id)) return false;
    shiftIds.add(shift.id);
    if (typeof shift.location !== 'string' || shift.location.length > MAX_LOCATION) return false;
    if (!isValidColor(shift.color) || !isValidISODate(shift.date)) return false;
    if (typeof shift.startTime !== 'string' || !TIME.test(shift.startTime)) return false;
    if (typeof shift.endTime !== 'string' || !TIME.test(shift.endTime)) return false;
    if (!isFiniteNonNegative(shift.value, MAX_VALUE)) return false;
    if (shift.paymentDate !== undefined && !isValidISODate(shift.paymentDate)) return false;
    if (typeof shift.paid !== 'boolean') return false;
    if (shift.notes !== undefined && (typeof shift.notes !== 'string' || shift.notes.length > MAX_NOTES)) return false;
    if (!Number.isSafeInteger(shift.createdAt) || !Number.isSafeInteger(shift.updatedAt)) return false;
    if (shift.payments !== undefined) {
      if (!Array.isArray(shift.payments) || shift.payments.length > 1000) return false;
      const ids = new Set<string>();
      let total = 0;
      for (const payment of shift.payments) {
        if (!payment || typeof payment.id !== 'string' || !payment.id || payment.id.length > 100 || ids.has(payment.id)) return false;
        if (!isValidISODate(payment.date) || !isFinitePositive(payment.amount, MAX_VALUE)) return false;
        ids.add(payment.id); total += Math.round(payment.amount * 100);
      }
      if (total > Math.round(shift.value * 100)) return false;
      if (shift.paid !== (total === Math.round(shift.value * 100))) return false;
    }
    if (shift.history !== undefined && (!Array.isArray(shift.history) || shift.history.length > 100 || shift.history.some(h => !h || !Number.isSafeInteger(h.at) || typeof h.before !== 'string' || h.before.length > 20000 || typeof h.after !== 'string' || h.after.length > 20000))) return false;
    if (shift.collection !== undefined) {
      const c = shift.collection;
      if (!c || typeof c !== 'object') return false;
      if (c.lastContact !== undefined && !isValidISODate(c.lastContact)) return false;
      if (c.expectedDate !== undefined && !isValidISODate(c.expectedDate)) return false;
      if (c.status !== undefined && !['Aguardando retorno', 'Pagamento combinado', 'Precisa de contato'].includes(c.status)) return false;
      if (c.note !== undefined && (typeof c.note !== 'string' || c.note.length > 500)) return false;
    }
    // Campos novos (opcionais)
    if (shift.type !== undefined && !SERVICE_TYPES.includes(shift.type)) return false;
    if (shift.hasTime !== undefined && typeof shift.hasTime !== 'boolean') return false;
    if (shift.billingUnit !== undefined && !BILLING_UNITS.includes(shift.billingUnit)) return false;
    if (shift.unitValue !== undefined && !isFiniteNonNegative(shift.unitValue, MAX_VALUE)) return false;
    if (shift.quantity !== undefined && !isFiniteNonNegative(shift.quantity, MAX_QUANTITY)) return false;
    if (shift.endDate !== undefined && !isValidISODate(shift.endDate)) return false;
  }

  const templateIds = new Set<string>();
  for (const template of data.templates) {
    if (!template || typeof template !== 'object') return false;
    if (typeof template.id !== 'string' || template.id.length > 100 || templateIds.has(template.id)) return false;
    templateIds.add(template.id);
    if (template.type !== undefined && !SERVICE_TYPES.includes(template.type)) return false;
    if (template.hasTime !== undefined && typeof template.hasTime !== 'boolean') return false;
    if (template.billingUnit !== undefined && !BILLING_UNITS.includes(template.billingUnit)) return false;
    if (template.unitValue !== undefined && !isFiniteNonNegative(template.unitValue, MAX_VALUE)) return false;
    if (template.quantity !== undefined && !isFiniteNonNegative(template.quantity, MAX_QUANTITY)) return false;
    if (typeof template.name !== 'string' || template.name.length > MAX_NAME) return false;
    if (typeof template.location !== 'string' || template.location.length > MAX_LOCATION) return false;
    if (!isValidColor(template.color) || typeof template.startTime !== 'string' || !TIME.test(template.startTime)) return false;
    if (typeof template.endTime !== 'string' || !TIME.test(template.endTime)) return false;
    if (!isFiniteNonNegative(template.value, MAX_VALUE)) return false;
    if (template.notes !== undefined && (typeof template.notes !== 'string' || template.notes.length > MAX_NOTES)) return false;
  }
  return true;
}

export function validateShift(data: Partial<Shift>): ValidationResult {
  const errors: Record<string, string> = {};
  const type = data.type ?? 'plantao';
  const withTime = data.hasTime !== false;

  if (!data.location || data.location.trim().length === 0) {
    errors.location = 'Informe o local, a empresa ou o cliente.';
  } else if (data.location.length > MAX_LOCATION) {
    errors.location = `Máximo de ${MAX_LOCATION} caracteres.`;
  }

  if (!isValidISODate(data.date)) {
    errors.date = 'Data inválida.';
  }

  if (withTime) {
    if (!data.startTime || !TIME.test(data.startTime)) {
      errors.startTime = 'Hora de início inválida.';
    }
    if (!data.endTime || !TIME.test(data.endTime)) {
      errors.endTime = 'Hora de término inválida.';
    }
  }

  if (data.value !== undefined && data.value !== null && !isFiniteNonNegative(data.value, MAX_VALUE)) {
    errors.value = 'Valor inválido.';
  }

  if (type === 'hora_extra' || type === 'contrato') {
    if (type === 'contrato' && (!data.billingUnit || !BILLING_UNITS.includes(data.billingUnit))) {
      errors.billingUnit = 'Escolha a forma de cobrança.';
    }
    if (!isFinitePositive(data.unitValue, MAX_VALUE)) {
      errors.unitValue = 'Informe o valor por unidade.';
    }
    if (!isFinitePositive(data.quantity, MAX_QUANTITY)) {
      errors.quantity = 'Informe a quantidade.';
    }
  }

  if (data.endDate) {
    if (!isValidISODate(data.endDate)) {
      errors.endDate = 'Data final inválida.';
    } else if (isValidISODate(data.date) && data.endDate < data.date) {
      errors.endDate = 'A data final deve ser igual ou posterior ao início.';
    }
  }

  if (data.notes && data.notes.length > MAX_NOTES) {
    errors.notes = `Máximo de ${MAX_NOTES} caracteres.`;
  }

  if (data.paymentDate && !isValidISODate(data.paymentDate)) {
    errors.paymentDate = 'Data de pagamento inválida.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTemplate(data: Partial<ShiftTemplate>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Nome do modelo é obrigatório.';
  } else if (data.name.length > MAX_NAME) {
    errors.name = `Máximo de ${MAX_NAME} caracteres.`;
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = 'O local é obrigatório.';
  } else if (data.location.length > MAX_LOCATION) {
    errors.location = `Máximo de ${MAX_LOCATION} caracteres.`;
  }

  if (!data.startTime || !TIME.test(data.startTime)) {
    errors.startTime = 'Hora de início inválida.';
  }

  if (!data.endTime || !TIME.test(data.endTime)) {
    errors.endTime = 'Hora de término inválida.';
  }

  if (data.value !== undefined && !isFiniteNonNegative(data.value, MAX_VALUE)) {
    errors.value = 'Valor inválido.';
  }

  if (data.notes && data.notes.length > MAX_NOTES) {
    errors.notes = `Máximo de ${MAX_NOTES} caracteres.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// Só confere o formato (4 a 6 dígitos). Usado também no login,
// por isso NÃO recusa PINs fracos: quem já tem um continua entrando.
export function validatePin(pin: string): string | null {
  if (!/^\d{4,6}$/.test(pin)) {
    return 'O PIN deve ter entre 4 e 6 dígitos numéricos.';
  }
  return null;
}

// Usar só ao CRIAR ou TROCAR o PIN: além do formato, recusa PINs óbvios.
export function checkNewPin(pin: string): string | null {
  const formatError = validatePin(pin);
  if (formatError) return formatError;

  if (/^(\d{1,3})\1+$/.test(pin)) {
    return 'PIN muito fácil de adivinhar. Evite repetições como 1111 ou 1212.';
  }

  const digits = pin.split('').map(Number);
  const steps = digits.slice(1).map((digit, i) => digit - digits[i]);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) {
    return 'PIN muito fácil de adivinhar. Evite sequências como 1234 ou 4321.';
  }

  return null;
}
