export type ServiceType = 'plantao' | 'servico' | 'hora_extra' | 'contrato';
export type BillingUnit = 'hora' | 'dia' | 'semana' | 'mes';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  plantao: 'Plantão',
  servico: 'Serviço',
  hora_extra: 'Hora extra',
  contrato: 'Contrato',
};

export const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  hora: 'Hora',
  dia: 'Dia',
  semana: 'Semana',
  mes: 'Mês',
};

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Shift {
  id: string;
  location: string; // empresa ou local
  color: string;
  date: string; // ISO yyyy-mm-dd (data de início)
  startTime: string; // HH:mm ("00:00" quando hasTime = false)
  endTime: string; // HH:mm ("00:00" quando hasTime = false)
  value: number; // R$ total
  paymentDate?: string; // ISO yyyy-mm-dd
  paid: boolean;
  payments?: Payment[]; // absent on legacy records: paid retains its original meaning
  notes?: string;
  createdAt: number;
  updatedAt: number;
  // Campos novos (todos opcionais: dados antigos continuam válidos)
  type?: ServiceType; // ausente = plantão
  hasTime?: boolean; // false = serviço sem horário definido
  billingUnit?: BillingUnit; // hora extra e contrato
  unitValue?: number; // valor por hora/dia/semana/mês
  quantity?: number; // quantas horas/dias/semanas/meses
  endDate?: string; // ISO yyyy-mm-dd (fim do contrato)
}

export interface ShiftTemplate {
  id: string;
  name: string;
  location: string;
  color: string;
  startTime: string;
  endTime: string;
  value: number;
  notes?: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  defaultColor: string;
}

export interface AppData {
  shifts: Shift[];
  templates: ShiftTemplate[];
  settings: Settings;
}

export interface PinHashData {
  salt: string;
  iv: string;
  verifier: string;
}

export interface PinAttempts {
  count: number;
  lockedUntil: number;
}

export const PRESET_COLORS = [
  '#0d9488', // teal-600
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#ca8a04', // yellow-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#4b5563', // gray-600
];
