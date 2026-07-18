const { defineConfig } = require("cypress");
const path = require("path");
const { pathToFileURL } = require("url");

module.exports = defineConfig({
  // Cypress.env() se usa en los specs para leer credenciales del admin
  // (ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_TOTP_SECRET). Por defecto Cypress
  // tambien expone Cypress.env() al codigo de la app bajo prueba (el
  // iframe), lo cual no necesitamos y es innecesariamente riesgoso para
  // datos sensibles. Esto no afecta el uso de Cypress.env() en los specs.
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://localhost:8000",
    supportFile: false,
    setupNodeEvents(on, config) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
          launchOptions.args.push("--disable-gpu");
          launchOptions.args.push("--no-sandbox");
          launchOptions.args.push("--disable-software-rasterizer");
          launchOptions.args.push("--disable-dev-shm-usage");
        }
        return launchOptions;
      });
      on("task", {
        // Reutiliza la implementación real de TOTP (js/lib/totp.js) para
        // calcular el código de 6 dígitos durante las pruebas, en vez de
        // duplicar el algoritmo en el test.
        async computeTotp({ secret, atMillis }) {
          // Cypress empaqueta cypress.config.js con esbuild, que envuelve los
          // exports nombrados de un módulo ESM dentro de `default` al hacer
          // import() dinámico desde un archivo CommonJS — de ahí el fallback.
          const totpUrl = pathToFileURL(path.join(__dirname, "js", "lib", "totp.js")).href;
          const totpModule = await import(totpUrl);
          const totpAt = totpModule.totpAt || totpModule.default.totpAt;
          return totpAt(secret, atMillis);
        },
      });
      return config;
    },
  },
});
