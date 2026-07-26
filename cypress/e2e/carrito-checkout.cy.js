// CP-F02 a CP-F05: carrito de compras, checkout con tarjeta simulada
// (aprobada y rechazada) y bitácora de transacciones.

// Cierra sesión primero si Firebase restauró una sesión persistida de una
// prueba anterior (Cypress limpia localStorage/sessionStorage entre tests,
// pero no el IndexedDB donde Firebase Auth guarda la sesión). Firebase
// resuelve el estado de sesión de forma asíncrona tras cargar la página, así
// que esperamos un momento antes de decidir si hay que cerrar sesión.
function logoutIfNeeded() {
  cy.wait(1500);
  cy.get("#nav-user").then(($nav) => {
    if (!$nav.hasClass("hidden")) {
      cy.get("#nav-logout-btn").click();
      cy.get("#view-auth", { timeout: 10000 }).should("not.have.class", "hidden");
    }
  });
}

function registerAndPass2fa(email, password) {
  cy.visit("/");
  logoutIfNeeded();
  cy.get("#auth-toggle-link").click();
  cy.get("#auth-email").type(email);
  cy.get("#auth-password").type(password);
  cy.get("#auth-submit-btn").click();

  cy.get("#view-2fa-setup", { timeout: 10000 }).should("not.have.class", "hidden");
  cy.get("#twofa-setup-secret")
    .invoke("text")
    .then((secretText) => {
      const secret = secretText.replace(/\s/g, "");
      cy.task("computeTotp", { secret, atMillis: Date.now() }).then((code) => {
        cy.get("#twofa-setup-code").type(code);
        cy.get("#twofa-setup-form").submit();
      });
    });
  cy.get("#view-catalog", { timeout: 10000 }).should("not.have.class", "hidden");
}

function addFirstProductToCart(screenshotName) {
  cy.get("#catalog-grid .product-card").first().as("firstProduct");
  if (screenshotName) {
    // Captura solo la tarjeta del producto (imagen, título, precio y
    // botón), no toda la pantalla — así siempre se ve el producto
    // completo sin depender de cuánto haya que hacer scroll.
    cy.get("@firstProduct").screenshot(screenshotName);
  }
  cy.get("@firstProduct").within(() => cy.get("button").click());
}

describe("Carrito y checkout", () => {
  const password = "password123";

  beforeEach(() => {
    // Correo único por prueba: cada test crea su propia cuenta, para no
    // chocar con la sesión de Firebase (persiste en IndexedDB) que haya
    // quedado de una prueba anterior.
    const email = `cypress.cart.${Date.now()}.${Math.random().toString(36).slice(2)}@test.com`;
    registerAndPass2fa(email, password);
  });

  it("CP-F02: agregar un producto al carrito actualiza el contador", () => {
    // Único test donde importa mostrar el producto en sí, ya que es
    // justo lo que este caso está probando.
    addFirstProductToCart("CP-F02-producto-agregado");
    cy.get("#nav-cart-count").should("have.text", "1");
  });

  it("CP-F03: completa una compra con tarjeta aprobada", () => {
    addFirstProductToCart();
    cy.get("#nav-cart-btn").click();
    cy.get("#cart-items .cart-row").should("have.length.greaterThan", 0);
    cy.get("#cart-items").screenshot("CP-F03-1-carrito-antes-de-pagar");
    cy.get("#cart-checkout-btn").click();

    cy.get("#checkout-name").type("Cypress Test");
    cy.get("#checkout-card").type("4242 4242 4242 4242");
    cy.get("#checkout-expiry").type("12/30");
    cy.get("#checkout-cvv").type("123");
    cy.get("#checkout-submit-btn").click();

    cy.get("#view-confirmation", { timeout: 10000 }).should("not.have.class", "hidden");
    cy.get("#confirmation-details").should("contain.text", "aprobada");
    cy.get("#view-confirmation").screenshot("CP-F03-2-compra-aprobada");
  });

  it("CP-F04: una tarjeta de prueba de rechazo muestra el error y no vacía el carrito", () => {
    addFirstProductToCart();
    cy.get("#nav-cart-btn").click();
    cy.get("#cart-items .cart-row").should("have.length.greaterThan", 0);
    cy.get("#cart-checkout-btn").click();

    cy.get("#checkout-name").type("Cypress Test");
    cy.get("#checkout-card").type("4000 0000 0000 0002");
    cy.get("#checkout-expiry").type("12/30");
    cy.get("#checkout-cvv").type("123");
    cy.get("#checkout-submit-btn").click();

    cy.get("#checkout-error").should("be.visible").and("contain.text", "rechazada");
    cy.get("#view-confirmation").should("have.class", "hidden");
    cy.get("#nav-cart-count").should("have.text", "1");
    cy.get("#checkout-form").screenshot("CP-F04-compra-rechazada");
  });

  it("CP-F05: la bitácora registra el login y la compra del usuario", () => {
    addFirstProductToCart();
    cy.get("#nav-cart-btn").click();
    cy.get("#cart-checkout-btn").click();
    cy.get("#checkout-name").type("Cypress Test");
    cy.get("#checkout-card").type("4242 4242 4242 4242");
    cy.get("#checkout-expiry").type("12/30");
    cy.get("#checkout-cvv").type("123");
    cy.get("#checkout-submit-btn").click();
    cy.get("#view-confirmation", { timeout: 10000 }).should("not.have.class", "hidden");

    cy.get("#nav-bitacora-btn").click();
    cy.get("#bitacora-body", { timeout: 10000 }).should("contain.text", "login");
    cy.get("#bitacora-body").should("contain.text", "compra");
    cy.screenshot("CP-F05-bitacora-con-eventos", { capture: "viewport" });
  });
});
