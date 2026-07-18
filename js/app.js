// Orquesta el cambio entre vistas de la SPA. No usa un router externo:
// cada "vista" es una <section class="view"> que se muestra/oculta.

const VIEWS = [
  "view-auth",
  "view-2fa-setup",
  "view-2fa-verify",
  "view-catalog",
  "view-cart",
  "view-checkout",
  "view-confirmation",
  "view-bitacora",
  "view-admin",
];

export function showView(viewId) {
  for (const id of VIEWS) {
    document.getElementById(id).classList.toggle("hidden", id !== viewId);
  }
}

export function setNavVisible(visible) {
  document.getElementById("nav-user").classList.toggle("hidden", !visible);
}

export function setNavEmail(email) {
  document.getElementById("nav-email").textContent = email || "";
}

document.getElementById("nav-cart-btn").addEventListener("click", () => {
  showView("view-cart");
  document.dispatchEvent(new CustomEvent("cart:show"));
});

document.getElementById("nav-bitacora-btn").addEventListener("click", () => {
  showView("view-bitacora");
  document.dispatchEvent(new CustomEvent("bitacora:show"));
});

document.getElementById("nav-admin-btn").addEventListener("click", () => {
  showView("view-admin");
  document.dispatchEvent(new CustomEvent("admin:show"));
});

document.getElementById("brand-home-btn").addEventListener("click", () => {
  // Solo navega al catálogo si hay una sesión activa (nav visible); antes
  // de iniciar sesión o durante el 2FA, el clic no hace nada.
  if (!document.getElementById("nav-user").classList.contains("hidden")) {
    showView("view-catalog");
  }
});
