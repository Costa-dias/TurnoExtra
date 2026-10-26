// Web Crypto helpers: PBKDF2 key derivation, AES-GCM encrypt/decrypt, SHA-256

const PBKDF2_ITERATIONS = 150_000;
const KEY_LENGTH = 256;

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function randomBytes(len: number): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return arr;
}

export function generateSalt(): string {
  return bufToB64(randomBytes(16));
}

export function generateIV(): string {
  return bufToB64(randomBytes(12));
}

async function deriveKey(
  pin: string,
  saltB64: string,
  usage: KeyUsage[] = ['encrypt', 'decrypt']
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: b64ToBuf(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    usage
  );
}

export async function deriveVerifierKey(pin: string, saltB64: string): Promise<CryptoKey> {
  return deriveKey(pin, saltB64, ['encrypt', 'decrypt']);
}

export async function encryptString(
  plaintext: string,
  key: CryptoKey,
  ivB64: string
): Promise<string> {
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: b64ToBuf(ivB64) },
    key,
    enc.encode(plaintext)
  );
  return bufToB64(cipher);
}

export async function decryptString(
  cipherB64: string,
  key: CryptoKey,
  ivB64: string
): Promise<string> {
  const dec = new TextDecoder();
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(ivB64) },
    key,
    b64ToBuf(cipherB64)
  );
  return dec.decode(plain);
}

export async function sha256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufToB64(hash);
}
