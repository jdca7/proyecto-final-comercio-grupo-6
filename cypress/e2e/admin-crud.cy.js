// CP-F06 y CP-F07: rol admin y mantenimiento de catálogo (CRUD).
// Requiere una cuenta de prueba YA promovida a "admin" en Firestore (ver
// README: "Convertir un usuario en administrador"), con sus credenciales
// pasadas por variables de entorno de Cypress — nunca hardcodeadas aquí:
//   CYPRESS_ADMIN_EMAIL, CYPRESS_ADMIN_PASSWORD, CYPRESS_ADMIN_TOTP_SECRET
// Definirlas en cypress.env.json (no versionado) o como variables de entorno
// del sistema antes de correr `npx cypress run`.

describe("Rol admin y CRUD de catálogo", () => {
  // cy.env() (a diferencia de Cypress.env()) sigue funcionando con
  // allowCypressEnv: false, pero solo acepta la forma de lista de claves y
  // resuelve via .then() con un objeto { CLAVE: valor } (omite las claves
  // sin definir), en vez de devolver el valor de forma sincrona.
  before(function () {
    cy.env(["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_TOTP_SECRET"]).then((vars) => {
      const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_TOTP_SECRET: secret } = vars;
      if (!email || !password || !secret) {
        cy.log("Faltan variables de entorno ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_TOTP_SECRET — se omite esta suite.");
        this.skip();
        return;
      }
      this.email = email;
      this.password = password;
      this.secret = secret;
    });
  });

  beforeEach(function () {
    const { email, password, secret } = this;
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
