import {
  base32Encode,
  base32Decode,
  generateSecret,
  hotp,
  verifyTotp,
  totpAt,
} from "../../js/lib/totp.js";

describe("base32Encode / base32Decode", () => {
  test("CP-U17: round-trip conserva los bytes originales", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 250, 251, 252]);
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });
});

describe("generateSecret", () => {
  test("CP-U18: genera una clave base32 de longitud consistente (20 bytes -> 32 caracteres)", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  });

  test("CP-U19: genera claves distintas en cada llamada", () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
  });
});

describe("hotp (vectores oficiales RFC 6238, Apéndice B)", () => {
  // La RFC usa el secreto ASCII "12345678901234567890" con SHA-1 y códigos de
  // 8 dígitos; como nuestra implementación trunca a 6 dígitos, verificamos
  // que coincidan los últimos 6 dígitos del valor de referencia.
  const secretBytes = new TextEncoder().encode("12345678901234567890");

  test.each([
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ])("CP-U20: tiempo=%i produce el código %s (RFC 6238)", async (unixSeconds, expected) => {
    const counter = Math.floor(unixSeconds / 30);
    const code = await hotp(secretBytes, counter);
    expect(code).toBe(expected);
  });
});

describe("verifyTotp", () => {
  test("CP-U21: acepta el código generado para el instante actual", async () => {
    const secret = generateSecret();
    const now = Date.now();
    const code = await totpAt(secret, now);
    await expect(verifyTotp(secret, code, now)).resolves.toBe(true);
  });

  test("CP-U22: rechaza un código incorrecto", async () => {
    const secret = generateSecret();
    await expect(verifyTotp(secret, "000000", Date.now())).resolves.toBe(false);
  });

  test("CP-U23: tolera un paso de 30s de desfase de reloj", async () => {
    const secret = generateSecret();
    const now = Date.now();
    const codeFromPast = await totpAt(secret, now - 30_000);
    await expect(verifyTotp(secret, codeFromPast, now)).resolves.toBe(true);
  });

  test("CP-U24: rechaza un código fuera de la ventana de tolerancia", async () => {
    const secret = generateSecret();
    const now = Date.now();
    const codeFromFarPast = await totpAt(secret, now - 5 * 60_000); // 5 minutos antes
    await expect(verifyTotp(secret, codeFromFarPast, now)).resolves.toBe(false);
  });
});
