// Integración real con PayPal Sandbox (dinero de prueba, no cobros reales).
// Se eligió PayPal sobre Stripe porque permite crear y capturar la orden
// 100% desde el navegador con el Client ID público — Stripe en modo test
// requiere un backend propio para crear la sesión de pago de forma segura,
// lo cual rompería la arquitectura sin servidor de este proyecto.

import { PAYPAL_CLIENT_ID } from "./paypal-config.js";
import { getCartItems, getCartTotal, clearCart } from "./cart.js";
import { currentUser } from "./auth.js";
import { showView } from "./app.js";

const methodCardRadio = document.getElementById("method-card");
const methodPaypalRadio = document.getElementById("method-paypal");
const cardForm = document.getElementById("checkout-form");
const paypalSection = document.getElementById("paypal-section");
const paypalButtonContainer = document.getElementById("paypal-button-container");
const paypalErrorEl = document.getElementById("paypal-error");
const confirmationTitle = document.getElementById("confirmation-title");
const confirmationDetails = document.getElementById("confirmation-details");

let sdkLoadPromise = null;
let buttonsRendered = false;

function showPaypalError(message) {
  paypalErrorEl.textContent = message;
  paypalErrorEl.classList.remove("hidden");
}
function clearPaypalError() {
  paypalErrorEl.textContent = "";
  paypalErrorEl.classList.add("hidden");
}

function loadPaypalSdk() {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal);
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD`;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("No se pudo cargar el SDK de PayPal."));
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

async function renderPaypalButtons() {
  if (buttonsRendered) return;
  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "TODO") {
    showPaypalError(
      "PayPal no está configurado todavía: falta el Client ID de sandbox en js/paypal-config.js."
    );
    return;
  }
  try {
    const paypal = await loadPaypalSdk();
    buttonsRendered = true;
    paypal
      .Buttons({
        createOrder: (data, actions) => {
          const total = getCartTotal().toFixed(2);
          return actions.order.create({
            purchase_units: [{ amount: { value: total, currency_code: "USD" } }],
          });
        },
        onApprove: async (data, actions) => {
          clearPaypalError();
          const details = await actions.order.capture();
          const items = getCartItems();
          const total = getCartTotal();
          const order = {
            items,
            total,
            date: new Date().toISOString(),
            status: "aprobada",
            metodo: "paypal_sandbox",
            paypalOrderId: details.id,
          };
          confirmationTitle.textContent = "¡Compra confirmada!";
          confirmationDetails.textContent =
            `Pedido PayPal #${details.id} por $${total.toFixed(2)} (${items.length} producto(s)) — estado: aprobada.`;
          document.dispatchEvent(
            new CustomEvent("order:completed", { detail: { order, user: currentUser() } })
          );
          await clearCart();
          showView("view-confirmation");
        },
        onError: (err) => {
          showPaypalError("Ocurrió un error con el pago de PayPal: " + err.message);
        },
        onCancel: () => {
          showPaypalError("Pago cancelado.");
        },
      })
      .render("#paypal-button-container");
  } catch (err) {
    showPaypalError(err.message);
  }
}

function updatePaymentMethodView() {
  const usePaypal = methodPaypalRadio.checked;
  cardForm.classList.toggle("hidden", usePaypal);
  paypalSection.classList.toggle("hidden", !usePaypal);
  if (usePaypal) renderPaypalButtons();
}

methodCardRadio.addEventListener("change", updatePaymentMethodView);
methodPaypalRadio.addEventListener("change", updatePaymentMethodView);

document.getElementById("paypal-cancel-btn").addEventListener("click", () => {
  clearPaypalError();
  showView("view-cart");
});

document.addEventListener("checkout:show", () => {
  methodCardRadio.checked = true;
  updatePaymentMethodView();
  clearPaypalError();
});
