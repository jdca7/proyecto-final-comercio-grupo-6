// CP-F06 y CP-F07: rol admin y mantenimiento de catálogo (CRUD).
// Usa una cuenta de prueba que YA fue promovida a "admin" en Firestore
// (ver README: "Convertir un usuario en administrador"). Si el equipo borra
// esta cuenta o cambia su rol, hay que actualizar las credenciales abajo o
// pasarlas por variables de entorno de Cypress (CYPRESS_ADMIN_EMAIL,
// CYPRESS_ADMIN_PASSWORD, CYPRESS_ADMIN_TOTP_SECRET).

describe("Rol admin y CRUD de catálogo", () => {
  const email = Cypress.env("ADMIN_EMAIL") || "estudiante.grupo6@test.com";
  const password = Cypress.env("ADMIN_PASSWORD") || "password123";
  const secret = Cypress.env("ADMIN_TOTP_SECRET") || "REDACTED_TOTP_SECRET";

  beforeEach(() => {
    cy.visit("/");
    cy.get("#auth-email").type(email);
    cy.get("#auth-password").type(password);
    cy.get("#auth-submit-btn").click();

    cy.get("#view-2fa-verify", { timeout: 10000 }).should("not.have.class", "hidden");
    cy.task("computeTotp", { secret, atMillis: Date.now() }).then((code) => {
      cy.get("#twofa-verify-code").type(code);
      cy.get("#twofa-verify-form").submit();
    });
    cy.get("#view-catalog", { timeout: 10000 }).should("not.have.class", "hidden");
  });

  it("CP-F06: el botón de Administración es visible para el rol admin", () => {
    cy.get("#nav-admin-btn").should("not.have.class", "hidden");
  });

  it("CP-F07: crea, edita y elimina un producto desde el panel de administración", () => {
    cy.get("#nav-admin-btn").click();

    cy.get("#admin-title").type("Producto Cypress");
    cy.get("#admin-price").type("9.99");
    cy.get("#admin-form").submit();
    cy.get("#admin-table").should("contain.text", "Producto Cypress");

    cy.contains("#admin-table tr", "Producto Cypress").within(() => {
      cy.get(".edit-btn").click();
    });
    cy.get("#admin-price").clear().type("15.00");
    cy.get("#admin-form").submit();
    cy.get("#admin-table").should("contain.text", "$15.00");

    cy.contains("#admin-table tr", "Producto Cypress").within(() => {
      cy.get(".delete-btn").click();
    });
    cy.get("#admin-table").should("not.contain.text", "Producto Cypress");
  });
});
