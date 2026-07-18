// Validación simulada de pago con tarjeta. Módulo puro: no depende del DOM,
// para poder probarse con Jest de forma aislada (ver tests/unit/payment.test.js).

// Tarjetas de prueba (estilo Stripe/PayPal sandbox) que simulan una
// transacción rechazada por el "banco" — cualquier otro número de 16 dígitos
// con formato válido se aprueba. Esto permite documentar casos de prueba
// tanto del camino feliz (aprobada) como de rechazo, sin conectar con una
// pasarela real.
export const DECLINE_CARDS = {
  "4000000000000002": "Fondos insuficientes",
  "4000000000009995": "Tarjeta rechazada por el banco emisor",
  "4000000000000069": "Tarjeta vencida según el emisor",
};

// Exige un formato de tarjeta válido (16 dígitos), MM/AA futura y CVV de 3-4
// dígitos, y luego revisa si el número corresponde a una tarjeta de prueba
// de rechazo. No se conecta a ninguna pasarela real — es una simulación
// acorde al alcance aprobado. `now` es inyectable para poder probar
// vencimientos de forma determinística.
export function validatePayment({ cardNumber, expiry, cvv }, now = new Date()) {
  const digits = String(cardNumber).replace(/\s/g, "");
  if (!/^\d{16}$/.test(digits)) {
    return { ok: false, reason: "El número de tarjeta debe tener 16 dígitos." };
  }
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) {
    return { ok: false, reason: "El vencimiento debe tener el formato MM/AA." };
  }
  const [, mm, yy] = match;
  const expDate = new Date(2000 + Number(yy), Number(mm), 0);
  if (Number(mm) < 1 || Number(mm) > 12 || expDate < now) {
    return { ok: false, reason: "La tarjeta está vencida o el mes no es válido." };
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    return { ok: false, reason: "El CVV no es válido." };
  }
  if (DECLINE_CARDS[digits]) {
    return { ok: true, declined: true, declineReason: DECLINE_CARDS[digits] };
  }
  return { ok: true, declined: false };
}
