// Implementación de TOTP (RFC 6238) sobre HOTP (RFC 4226), usando la Web
// Crypto API estándar (disponible en navegadores y en Node 20+). Módulo puro:
// no depende del DOM ni de Firebase, para poder probarse con Jest de forma
// aislada (ver tests/unit/totp.test.js).

export const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const TIME_STEP_SECONDS = 30;
export const CODE_DIGITS = 6;
export const VERIFY_WINDOW = 1; // tolera +/- 1 paso de 30s por desfase de reloj

export function base32Encode(bytes) {
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    let chunk = bits.slice(i, i + 5);
    if (chunk.length === 0) break;
    chunk = chunk.padEnd(5, "0");
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return output;
}

export function base32Decode(str) {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

export function generateSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function counterToBytes(counter) {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(counter), false);
  return new Uint8Array(buf);
}

export async function hotp(secretBytes, counter) {
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, counterToBytes(counter));
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binCode % 10 ** CODE_DIGITS;
  return otp.toString().padStart(CODE_DIGITS, "0");
}

export async function totpAt(secretBase32, unixMillis) {
  const counter = Math.floor(unixMillis / 1000 / TIME_STEP_SECONDS);
  return hotp(base32Decode(secretBase32), counter);
}

export async function verifyTotp(secretBase32, code, now = Date.now()) {
  const secretBytes = base32Decode(secretBase32);
  const currentCounter = Math.floor(now / 1000 / TIME_STEP_SECONDS);
  const cleanCode = String(code).trim();
  for (let delta = -VERIFY_WINDOW; delta <= VERIFY_WINDOW; delta++) {
    const candidate = await hotp(secretBytes, currentCounter + delta);
    if (candidate === cleanCode) return true;
  }
  return false;
}

export function formatSecret(secret) {
  return secret.match(/.{1,4}/g).join(" ");
}
