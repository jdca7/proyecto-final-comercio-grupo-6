import { validatePayment, DECLINE_CARDS } from "../../js/lib/payment.js";

describe("validatePayment", () => {
  const validFutureExpiry = "12/30";
  const now = new Date(2026, 6, 17); // referencia fija: 17/jul/2026

  test("CP-U01: aprueba una tarjeta válida que no está en la lista de rechazo", () => {
    const result = validatePayment(
      { cardNumber: "4242 4242 4242 4242", expiry: validFutureExpiry, cvv: "123" },
      now
    );
    expect(result).toEqual({ ok: true, declined: false });
  });

  test("CP-U02: rechaza número de tarjeta con menos de 16 dígitos", () => {
    const result = validatePayment(
      { cardNumber: "4242 4242 4242", expiry: validFutureExpiry, cvv: "123" },
      now
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/16 dígitos/);
  });

  test("CP-U03: rechaza número de tarjeta con caracteres no numéricos", () => {
    const result = validatePayment(
      { cardNumber: "4242 42AB 4242 4242", expiry: validFutureExpiry, cvv: "123" },
      now
    );
    expect(result.ok).toBe(false);
  });

  test("CP-U04: rechaza formato de vencimiento inválido", () => {
    const result = validatePayment(
      { cardNumber: "4242424242424242", expiry: "13-2030", cvv: "123" },
      now
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/MM\/AA/);
  });

  test("CP-U05: rechaza tarjeta vencida", () => {
    const result = validatePayment(
      { cardNumber: "4242424242424242", expiry: "01/20", cvv: "123" },
      now
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/vencida/);
  });

  test("CP-U06: rechaza CVV con letras o longitud inválida", () => {
    const result = validatePayment(
      { cardNumber: "4242424242424242", expiry: validFutureExpiry, cvv: "12" },
      now
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/CVV/);
  });

  test.each(Object.entries(DECLINE_CARDS))(
    "CP-U07: detecta la tarjeta de rechazo %s (%s)",
    (cardNumber, motivo) => {
      const result = validatePayment({ cardNumber, expiry: validFutureExpiry, cvv: "123" }, now);
      expect(result.ok).toBe(true);
      expect(result.declined).toBe(true);
      expect(result.declineReason).toBe(motivo);
    }
  );
});
