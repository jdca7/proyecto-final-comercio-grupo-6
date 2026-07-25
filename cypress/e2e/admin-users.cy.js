// CP-F08 a CP-F11: panel de administración de usuarios (listar, cambiar
// rol, eliminar, y auto-protección). Requiere una cuenta admin (mismas
// variables de entorno que admin-crud.cy.js):
//   CYPRESS_ADMIN_EMAIL, CYPRESS_ADMIN_PASSWORD, CYPRESS_ADMIN_TOTP_SECRET
//
// El admin no puede cambiarse el rol ni eliminarse a sí mismo (por diseño),
// así que cada caso registra primero una cuenta cliente descartable para
// operar sobre ella desde el panel.

describe("Panel de administración de usuarios", () => {
  before(function () {
    cy.env(["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_TOTP_SECRET"]).then((vars) => {
      const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_TOTP_SECRET: secret } = vars;
      if (!email || !password || !secret) {
        cy.log("Faltan variables de entorno ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_TOTP_SECRET — se omite esta suite.");
        this.skip();
        return;
      }
      this.adminEmail = email;
      this.adminPassword = password;
      this.adminSecret = secret;
    });
  });

  // Mismo patrón que en admin-crud.cy.js / carrito-checkout.cy.js: Firebase
  // Auth restaura la sesión anterior de forma asíncrona, así que esperamos
  // un momento antes de decidir si hay que cerrar sesión.
  function logoutIfNeeded() {
    cy.wait(1500);
    cy.get("#nav-user").then(($nav) => {
      if (!$nav.hasClass("hidden")) {
        cy.get("#nav-logout-btn").click();
        cy.get("#view-auth", { timeout: 10000 }).should("not.have.class", "hidden");
      }
    });
  }

  function registerClientAccount(email, password) {
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

  function loginAsAdmin(email, password, secret) {
    cy.visit("/");
    logoutIfNeeded();
    cy.get("#auth-email").type(email);
    cy.get("#auth-password").type(password);
    cy.get("#auth-submit-btn").click();

    cy.get("#view-2fa-verify", { timeout: 10000 }).should("not.have.class", "hidden");
    cy.task("computeTotp", { secret, atMillis: Date.now() }).then((code) => {
      cy.get("#twofa-verify-code").type(code);
      cy.get("#twofa-verify-form").submit();
    });
    cy.get("#view-catalog", { timeout: 10000 }).should("not.have.class", "hidden");
  }

  it("CP-F08 a CP-F11: listar, cambiar rol, eliminar, y auto-protección", function () {
    const clientEmail = `cypress.adminusers.${Date.now()}@test.com`;
    const clientPassword = "password123";

    // Cuenta cliente descartable sobre la que van a operar CP-F09/CP-F10.
    registerClientAccount(clientEmail, clientPassword);

    // Ahora sí, como admin.
    loginAsAdmin(this.adminEmail, this.adminPassword, this.adminSecret);
    cy.get("#nav-admin-btn").click();
    cy.get("#admin-tab-users").click();

    // CP-F08: la cuenta cliente recién creada aparece en la lista.
    cy.get("#admin-users-table", { timeout: 10000 }).should("contain.text", clientEmail);
    cy.screenshot("CP-F08-lista-usuarios", { capture: "viewport" });

    // CP-F09: cambiar su rol a admin se refleja en el selector.
    cy.contains("#admin-users-table tr", clientEmail).within(() => {
      cy.get(".role-select").select("admin");
    });
    cy.contains("#admin-users-table tr", clientEmail, { timeout: 10000 }).within(() => {
      cy.get(".role-select").should("have.value", "admin");
    });
    cy.screenshot("CP-F09-rol-cambiado", { capture: "viewport" });

    // CP-F11: la fila propia del admin tiene el selector y el botón
    // "Eliminar" deshabilitados (no puede auto-cambiarse el rol ni
    // eliminarse a sí mismo).
    cy.contains("#admin-users-table tr", this.adminEmail).within(() => {
      cy.get(".role-select").should("be.disabled");
      cy.get(".delete-user-btn").should("be.disabled");
    });

    // CP-F10: eliminar la cuenta cliente la quita de la tabla.
    cy.contains("#admin-users-table tr", clientEmail).within(() => {
      cy.get(".delete-user-btn").click();
    });
    cy.get("#admin-users-table", { timeout: 10000 }).should("not.contain.text", clientEmail);
    cy.screenshot("CP-F10-usuario-eliminado", { capture: "viewport" });
  });
});
