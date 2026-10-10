import type { AppData, PinHashData, PinAttempts, Shift, ShiftTemplate } from '@/types';
import {
  generateSalt,
  generateIV,
  deriveVerifierKey,
  encryptString,
  decryptString,
} from '@/lib/crypto';
import { isValidBackupData, validatePin } from '@/lib/validation';

const DB_NAME = 'escalafacil';
const DB_VERSION = 1;
const STORE_KV = 'kv';

const PIN_KEY = 'pin_hash';
const ATTEMPTS_KEY = 'pin_attempts';
const DATA_KEY = 'app_data';
const DATA_IV_KEY = 'app_data_iv';
const DATA_SALT_KEY = 'app_data_salt';
let expectedCipher: string | null | undefined;

export class DataConflictError extends Error {
  constructor() {
    super('Outra aba alterou os dados. Exporte as alterações pendentes, bloqueie e entre novamente antes de continuar.');
    this.name = 'DataConflictError';
  }
}

const EMPTY_DATA: AppData = {
  shifts: [],
  templates: [],
  settings: { theme: 'dark', defaultColor: '#0d9488' },
};

// Cópia nova (arrays novos) dos dados vazios
export function createEmptyData(): AppData {
  return { shifts: [], templates: [], settings: { ...EMPTY_DATA.settings } };
}

// Lançado quando EXISTEM dados salvos, mas eles não puderam ser lidos
export class DataUnreadableError extends Error {
  constructor() {
    super('Não foi possível ler os dados salvos.');
    this.name = 'DataUnreadableError';
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readonly');
    const req = tx.objectStore(STORE_KV).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readwrite');
    tx.objectStore(STORE_KV).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Grava vários itens numa única transação: ou grava todos, ou nenhum.
async function idbSetMany(entries: Array<[string, unknown]>, checkConflict = false): Promise<void> {
  const cipherBefore = expectedCipher;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readwrite');
    const store = tx.objectStore(STORE_KV);
    let conflict: Error | null = null;
    const req = store.get(DATA_KEY);
    req.onsuccess = () => {
      if (checkConflict && (req.result ?? null) !== cipherBefore) {
        conflict = new DataConflictError();
        tx.abort();
        return;
      }
      for (const [key, value] of entries) store.put(value, key);
    };
    tx.oncomplete = () => {
      const cipher = entries.find(([key]) => key === DATA_KEY);
      if (cipher) expectedCipher = cipher[1] as string;
      db.close();
      resolve();
    };
    tx.onerror = () => { db.close(); reject(conflict ?? tx.error); };
    tx.onabort = () => { db.close(); reject(conflict ?? tx.error); };
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readwrite');
    tx.objectStore(STORE_KV).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Fila de escrita: uma operação por vez, na ordem em que foram chamadas ───

let writeQueue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

// ─── Montagem dos registros (só calcula, não grava) ────────────

async function buildPinRecord(pin: string): Promise<PinHashData> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveVerifierKey(pin, salt);
  const verifier = await encryptString('VERIFIED', key, iv);
  return { salt, iv, verifier };
}

async function buildDataRecords(
  data: AppData,
  pin: string
): Promise<Array<[string, unknown]>> {
  if (!pin || !isValidBackupData(data)) {
    throw new Error('Dados locais inválidos.');
  }
  const salt = (await idbGet<string>(DATA_SALT_KEY)) ?? generateSalt();
  const iv = generateIV();
  const key = await deriveVerifierKey(pin, salt);
  const cipher = await encryptString(JSON.stringify(data), key, iv);
  return [
    [DATA_SALT_KEY, salt],
    [DATA_IV_KEY, iv],
    [DATA_KEY, cipher],
  ];
}

// ─── PIN management ────────────────────────────────────────────

export async function isPinSet(): Promise<boolean> {
  const data = await idbGet<PinHashData>(PIN_KEY);
  return data !== null;
}

export async function setupPin(pin: string): Promise<void> {
  if (validatePin(pin)) throw new Error('PIN inválido.');
  const record = await buildPinRecord(pin);
  await idbSet(PIN_KEY, record);
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (validatePin(pin)) return false;
  const hash = await idbGet<PinHashData>(PIN_KEY);
  if (!hash) return false;
  try {
    const key = await deriveVerifierKey(pin, hash.salt);
    const result = await decryptString(hash.verifier, key, hash.iv);
    return result === 'VERIFIED';
  } catch {
    return false;
  }
}

// Troca o PIN e recifra os dados com o PIN novo, tudo na mesma transação.
// Se os dados atuais não puderem ser lidos, NÃO troca (lança DataUnreadableError).
export function changePin(oldPin: string, newPin: string): Promise<boolean> {
  return enqueue(async () => {
    const ok = await verifyPin(oldPin);
    if (!ok) return false;
    if (validatePin(newPin)) throw new Error('PIN inválido.');
    const current = await loadData(oldPin);
    const pinRecord = await buildPinRecord(newPin);
    const dataEntries = await buildDataRecords(current, newPin);
    await idbSetMany([[PIN_KEY, pinRecord], ...dataEntries]);
    return true;
  });
}

export async function resetPin(): Promise<void> {
  await idbDel(PIN_KEY);
  await idbDel(ATTEMPTS_KEY);
}

// ─── Brute-force protection ────────────────────────────────────

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30_000; // 30 seconds

export async function getAttempts(): Promise<PinAttempts> {
  return (
    (await idbGet<PinAttempts>(ATTEMPTS_KEY)) ?? {
      count: 0,
      lockedUntil: 0,
    }
  );
}

export async function recordFailedAttempt(): Promise<PinAttempts> {
  const current = await getAttempts();
  const newCount = current.count + 1;
  const attempts: PinAttempts = {
    count: newCount,
    lockedUntil: newCount >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : current.lockedUntil,
  };
  await idbSet(ATTEMPTS_KEY, attempts);
  return attempts;
}

export async function resetAttempts(): Promise<void> {
  await idbSet(ATTEMPTS_KEY, { count: 0, lockedUntil: 0 });
}

// ─── App data (encrypted at rest with PIN-derived key) ─────────

export function saveData(data: AppData, pin: string): Promise<void> {
  return enqueue(async () => {
    if (expectedCipher === undefined) expectedCipher = await idbGet<string>(DATA_KEY);
    const entries = await buildDataRecords(data, pin);
    await idbSetMany(entries, true);
  });
}

// Devolve dados vazios SOMENTE se nunca houve nada salvo.
// Se há dados salvos e eles não abrem, lança DataUnreadableError
// (nunca devolve "vazio", para não sobrescrever o que existe).
export async function loadData(pin: string): Promise<AppData> {
  const db = await openDB();
  const [salt, iv, cipher] = await new Promise<Array<string | null>>((resolve, reject) => {
    const tx = db.transaction(STORE_KV, 'readonly');
    const store = tx.objectStore(STORE_KV);
    const requests = [DATA_SALT_KEY, DATA_IV_KEY, DATA_KEY].map((key) => store.get(key));
    tx.oncomplete = () => { db.close(); resolve(requests.map((req) => req.result ?? null)); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
  expectedCipher = cipher;

  // Primeiro uso: nada salvo ainda
  if (!salt && !iv && !cipher) return createEmptyData();

  // Dados pela metade = corrompidos
  if (!salt || !iv || !cipher) throw new DataUnreadableError();

  try {
    const key = await deriveVerifierKey(pin, salt);
    const json = await decryptString(cipher, key, iv);
    const parsed: unknown = JSON.parse(json);
    if (!isValidBackupData(parsed)) throw new DataUnreadableError();
    return parsed;
  } catch {
    throw new DataUnreadableError();
  }
}

export async function clearAllData(): Promise<void> {
  await idbDel(DATA_KEY);
  await idbDel(DATA_IV_KEY);
  await idbDel(DATA_SALT_KEY);
  await idbDel(PIN_KEY);
  await idbDel(ATTEMPTS_KEY);
}

export async function hasStoredData(): Promise<boolean> {
  const cipher = await idbGet<string>(DATA_KEY);
  return cipher !== null;
}

export { EMPTY_DATA };

// ─── Helpers for mutations ─────────────────────────────────────

export function createShift(
  partial: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>
): Shift {
  return {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createTemplate(
  partial: Omit<ShiftTemplate, 'id'>
): ShiftTemplate {
  return {
    ...partial,
    id: crypto.randomUUID(),
  };
}
