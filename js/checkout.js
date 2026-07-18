import { showView } from "./app.js";
import { getCartItems, getCartTotal, clearCart } from "./cart.js";
import { currentUser } from "./auth.js";
import { validatePayment } from "./lib/payment.js";

const summaryEl = document.getElementById("checkout-summary");
const form = document.getElementById("checkout-form");
const errorEl = document.getElementById("checkout-error");
const confirmationTitle = document.getElementById("confirmation-title");
const confirmationDetails = document.getElementById("confirmation-details");

function renderSummary() {
  const items = getCartItems();
  const total = getCartTotal();
  summaryEl.innerHTML =
    "<ul>" +
    items.map((it) => `<li>${it.qty} x ${it.title} — $${(it.price * it.qty).toFixed(2)}</li>`).join("") +
    "</ul>" +
    `<p><strong>Total a pagar: $${total.toFixed(2)}</strong></p>`;
}

function showCheckoutError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearCheckoutError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearCheckoutError();

  const payment = {
    cardNumber: document.getElementById("checkout-card").value,
    expiry: document.getElementById("checkout-expiry").value,
    cvv: document.getElementById("checkout-cvv").value,
  };

  const result = validatePayment(payment);
  if (!result.ok) {
    showCheckoutError(result.reason);
    return;
  }

  const items = getCartItems();
  const total = getCartTotal();

  if (result.declined) {
    const order = {
      items,
      total,
      date: new Date().toISOString(),
      status: "rechazada",
      motivo: result.declineReason,
    };
    document.dispatchEvent(new CustomEvent("order:completed", { detail: { order, user: currentUser() } }));
    showCheckoutError(`Transacción rechazada: ${result.declineReason}. Intenta con otra tarjeta.`);
    return;
  }

  const order = {
    items,
    total,
    date: new Date().toISOString(),
    status: "aprobada",
  };

  confirmationTitle.textContent = "¡Compra confirmada!";
  confirmationDetails.textContent =
    `Pedido por $${total.toFixed(2)} (${items.length} producto(s)) — estado: aprobada.`;

  document.dispatchEvent(new CustomEvent("order:completed", { detail: { order, user: currentUser() } }));

  clearCart();
  form.reset();
  showView("view-confirmation");
});

document.getElementById("checkout-cancel-btn").addEventListener("click", () => {
  clearCheckoutError();
  form.reset();
  showView("view-cart");
});

document.getElementById("confirmation-continue-btn").addEventListener("click", () => {
  showView("view-catalog");
});

document.addEventListener("checkout:show", renderSummary);
