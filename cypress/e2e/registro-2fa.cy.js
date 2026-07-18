// CP-F01: un usuario nuevo se registra, configura 2FA (TOTP) y accede al
// catálogo. Usa cy.task('computeTotp', ...) para calcular el código real a
// partir de la clave que la app muestra en pantalla, reutilizando la misma
// implementación de js/lib/totp.js (no se duplica el algoritmo en la prueba).

describe("Registro y verificación en dos pasos (2FA)", () => {
  const email = `cypress.${Date.now()}@test.com`;
  const password = "password123";

  it("CP-F01: un usuario nuevo debe configurar 2FA antes de ver el catálogo", () => {
    cy.visit("/");

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
    cy.get("#catalog-grid .product-card").should("have.length.greaterThan", 0);
  });
});
