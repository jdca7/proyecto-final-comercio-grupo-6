# TiendaUIA — Portal de Comercio Electrónico

Proyecto final del curso Herramientas de Desarrollo de Sistemas de
Información (Grupo 6, tema asignado del Grupo 1). SPA en HTML/CSS/JavaScript
puro (sin frameworks ni bundlers), con Firebase (Auth + Firestore), FakeStoreAPI
y PayPal Sandbox. Implementa el alcance original completo del enunciado.

## Funcionalidades

- Registro e inicio de sesión con Firebase Auth (correo/contraseña)
- **Verificación en dos pasos (2FA)** con TOTP (compatible con Google
  Authenticator/Authy), implementada con la Web Crypto API — sin costo, sin
  necesitar el plan de pago de Firebase
- **Roles de usuario** (cliente/admin) con vista de administración separada
- Catálogo de productos desde FakeStoreAPI, con buscador
- **Mantenimiento de catálogo (CRUD)**: crear, editar y eliminar productos
  (solo rol admin)
- Carrito de compras persistido por usuario en Firestore
- Proceso de compra con resumen de pedido y **selección de método de pago**:
  tarjeta simulada (con simulación de aprobación/rechazo) o **PayPal Sandbox
  real**
- Bitácora de transacciones (login, compras aprobadas/rechazadas) por usuario

## Requisitos previos

- Un navegador moderno (Chrome, Edge, Firefox)
- Un servidor estático local (los módulos ES no funcionan abriendo el HTML
  directamente con `file://`, hay que servirlo por http)
- Una cuenta gratuita de Firebase
- Una cuenta gratuita de developer.paypal.com (para el pago real en sandbox)
- Una app de autenticación en el teléfono (Google Authenticator, Authy, etc.)
  para probar el 2FA

## 1. Clonar el repositorio

```bash
git clone https://github.com/jdca7/proyecto-final-comercio-grupo-6.git
cd proyecto-final-comercio-grupo-6
```

## 2. Firebase y PayPal — ya están configurados

`js/firebase-config.js` y `js/paypal-config.js` **ya traen credenciales reales
y funcionando** del proyecto compartido del equipo (proyecto de Firebase
`proyecto-uia` y una app de PayPal Sandbox). No hace falta crear nada para
correr el proyecto tal cual está — pasa directo al paso 4 ("Correr el
proyecto localmente").

Solo sigue estos pasos si alguien del equipo necesita **su propio** proyecto
separado (por ejemplo, para probar algo sin afectar los datos del proyecto
compartido):

**Firebase:**
1. Entrar a https://console.firebase.google.com y crear un proyecto nuevo
   (gratis, plan Spark).
2. En el menú lateral: **Authentication** → pestaña "Sign-in method" →
   habilitar **Correo electrónico/contraseña**.
3. En el menú lateral: **Firestore Database** → crear base de datos → modo de
   prueba (para desarrollo; luego se pueden ajustar las reglas).
4. En **Configuración del proyecto** (ícono de engranaje) → pestaña
   "General" → sección "Tus apps" → agregar una app **Web** (ícono `</>`).
5. Copiar el objeto `firebaseConfig` que Firebase genera y pegarlo en
   [`js/firebase-config.js`](js/firebase-config.js).

**PayPal Sandbox:**
1. Crear una cuenta gratuita en https://developer.paypal.com
2. En el Dashboard: "Apps & Credentials", modo **Sandbox** → copiar el
   **Client ID** de la app por defecto.
3. Pegarlo en [`js/paypal-config.js`](js/paypal-config.js).
4. (Opcional) En "Sandbox > Accounts" hay una cuenta de comprador de prueba
   con correo/contraseña ficticios para completar el pago de extremo a
   extremo sin usar dinero real.

## 3. Convertir un usuario en administrador

No hay una pantalla para esto (es intencional, para no complicar el alcance).
Un integrante del equipo debe ir a la consola de Firebase → Firestore
Database → colección `users` → abrir el documento del usuario → cambiar el
campo `role` de `"cliente"` a `"admin"`. Al recargar la página, ese usuario
verá el botón "Administración" en la barra superior.

## 4. Correr el proyecto localmente

**Opción A — con Docker (recomendada: mismo entorno para todo el equipo,
sin depender de qué tenga instalado cada quien):**

```bash
docker compose up -d app
```

Luego abrir http://localhost:8000 en el navegador. Para detenerlo:
`docker compose down`.

**Opción B — con Python, sin Docker:**

```bash
python -m http.server 8000
```

Luego abrir http://localhost:8000 en el navegador.

(Alternativa: extensión "Live Server" de VS Code, clic derecho sobre
`index.html` → "Open with Live Server".)

## 5. Notas técnicas

- **Índice de Firestore**: la bitácora usa una consulta con `where` +
  `orderBy` sobre campos distintos, lo que requiere un **índice compuesto**.
  La primera vez que se consulte, la consola del navegador mostrará un error
  con un enlace directo para crearlo — solo hay que hacer clic y esperar unos
  minutos a que se construya.
- **2FA (TOTP)**: al registrarse o iniciar sesión por primera vez, la app
  genera una clave secreta y pide configurarla en una app de autenticación
  antes de dar acceso. La verificación se recuerda solo para esa sesión del
  navegador (`sessionStorage`); al cerrar el navegador y volver a entrar, se
  vuelve a pedir el código.
- **CRUD de catálogo**: FakeStoreAPI es una API simulada de solo demostración
  — acepta las peticiones de crear/editar/eliminar y responde éxito, pero
  **no persiste los cambios en su servidor real**. Por eso la app también
  refleja el cambio localmente durante la sesión; al recargar la página, el
  catálogo vuelve a su estado original desde FakeStoreAPI. Esto es una
  limitación conocida de la API de terceros, no un error del código — vale la
  pena explicarlo así en el informe.
- **PayPal Sandbox**: es un pago real de extremo a extremo (crea y captura
  una orden real) pero dentro del entorno de pruebas de PayPal, con dinero
  ficticio — no se cobra nada real.

## Estructura del proyecto

```
index.html
css/styles.css
js/firebase-config.js     # Credenciales de Firebase (ya configurado)
js/paypal-config.js       # Client ID de PayPal sandbox (ya configurado)
js/auth.js                # Registro, login, logout
js/twofa.js                # Verificación en dos pasos (TOTP)
js/roles.js                # Rol de usuario (cliente/admin)
js/catalog.js              # Catálogo (FakeStoreAPI, solo lectura para clientes)
js/admin.js                 # CRUD de catálogo (solo admin)
js/cart.js                 # Carrito de compras
js/checkout.js             # Checkout con tarjeta simulada (aprobada/rechazada)
js/paypal-checkout.js       # Checkout con PayPal Sandbox real
js/bitacora.js             # Bitácora de transacciones
js/app.js                  # Ruteo entre vistas
js/lib/                    # Lógica pura sin DOM (TOTP, validación de pago, carrito) — testeada con Jest
tests/unit/                # Pruebas unitarias (Jest)
tests/postman/             # Colección de pruebas de integración (Postman/Newman)
cypress/e2e/                # Pruebas funcionales E2E (Cypress)
```

## 6. Correr las pruebas automatizadas

**Opción A — con Docker (recomendada):** cada comando corre en un contenedor
con Node, navegador y todas las dependencias ya listas — nadie del equipo
necesita instalar Node, Cypress ni nada más.

```bash
docker compose run --rm test-unit          # pruebas unitarias (Jest)
docker compose run --rm test-integration   # pruebas de integración (Postman/Newman)
docker compose up -d app                   # necesario antes de correr las E2E
docker compose run --rm test-e2e           # pruebas funcionales E2E (Cypress)
```

**¿Dónde quedan los resultados?** Además de imprimirse en la terminal, quedan
guardados en tu carpeta del proyecto (sobreviven aunque el contenedor se
borre con `--rm`):

- `test-results/jest-results.json` — resultado de las pruebas unitarias
- `test-results/newman-results.json` — resultado de las pruebas de integración
- `cypress/screenshots/` — capturas de pantalla automáticas de cualquier caso
  de Cypress que falle (si todo pasa, queda vacío)

Estas carpetas están en `.gitignore`: se generan localmente, no se suben al
repositorio.

Para la suite `admin-crud` (ver más abajo), crear un archivo `.env` en la raíz
del proyecto (ya está en `.gitignore`) con:

```
CYPRESS_ADMIN_EMAIL=correo-de-la-cuenta-admin@ejemplo.com
CYPRESS_ADMIN_PASSWORD=la-contraseña-de-esa-cuenta
CYPRESS_ADMIN_TOTP_SECRET=la-clave-secreta-totp-de-esa-cuenta
```

Docker Compose lo carga automáticamente. Si no existe, esa suite específica
se omite sola (las otras dos corren igual).

**Opción B — con Node/npm instalado localmente, sin Docker:**

```bash
npm install          # una sola vez, instala Jest, Newman y Cypress
npm test             # pruebas unitarias (Jest) — 30 casos, no requieren red
npm run test:integration   # pruebas de integración (Postman/Newman) contra FakeStoreAPI real
```

Para las pruebas funcionales E2E (Cypress) sin Docker, primero debe estar
corriendo el servidor estático en `http://localhost:8000` (ver sección 4)
con Firebase y PayPal ya configurados.

La suite `cypress/e2e/admin-crud.cy.js` necesita una cuenta ya promovida a
`role: "admin"` en Firestore (ver sección 3), con 2FA configurado. Sus
credenciales **no están en el código** — hay que pasarlas por variables de
entorno de Cypress, creando un archivo `cypress.env.json` en la raíz del
proyecto (ya está en `.gitignore`, nunca se sube al repositorio):

```json
{
  "ADMIN_EMAIL": "correo-de-la-cuenta-admin@ejemplo.com",
  "ADMIN_PASSWORD": "la-contraseña-de-esa-cuenta",
  "ADMIN_TOTP_SECRET": "la-clave-secreta-totp-de-esa-cuenta"
}
```

Si no se define este archivo, esa suite específica se omite automáticamente
(las otras dos corren igual, ya que crean su propia cuenta de prueba en cada
ejecución).

```bash
npx cypress open     # modo interactivo (recomendado para ver el navegador)
npx cypress run       # modo headless, imprime resultados en la terminal
```

Los 3 archivos de prueba (`registro-2fa`, `carrito-checkout`, `admin-crud`)
cubren 7 casos funcionales de extremo a extremo, ejecutando registro real,
cálculo real del código TOTP, login, carrito, checkout (aprobado/rechazado),
bitácora y CRUD de catálogo — todo contra el Firebase y FakeStoreAPI reales
del proyecto, no mocks.

### Solución de problemas: "self-signed certificate in certificate chain"

Si al construir la imagen de pruebas (`docker compose run --rm test-unit` o
cualquiera de las otras) ves un error como `SELF_SIGNED_CERT_IN_CHAIN` al
correr `npm ci`, significa que tu red (institucional, corporativa, o cierto
antivirus) está inspeccionando el tráfico HTTPS con su propio certificado, y
Docker no confía en él por defecto — no es un problema del proyecto.

Solución: crear un archivo `.env` en la raíz del proyecto (ya está en
`.gitignore`, nunca se sube) con:

```
NPM_CONFIG_STRICT_SSL=false
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Esto relaja la verificación de certificados **solo dentro del contenedor de
pruebas**, nunca en la app en sí ni en el repositorio. Si no tienes este
problema, no hace falta crear este archivo — por defecto todo se valida
normalmente.

## Documentación adicional

Este repositorio contiene únicamente el código fuente, la configuración y las
pruebas automatizadas. La documentación del proyecto (justificación de
herramientas, diseño de base de datos, diagramas UML, matriz de requisitos,
casos de prueba documentados, e informe final en Word) se maneja aparte y
fue compartida directamente con el equipo.

Pendiente para la entrega final del curso (fuera del alcance de este
repositorio): portada del informe, presentación en PowerPoint con la
plantilla del docente, y las bitácoras de trabajo firmadas por el equipo.
