# Casos de prueba — TiendaUIA (Portal de Comercio Electrónico)

Este documento reúne los casos de prueba diseñados y **ejecutados** para el
proyecto, organizados por tipo según lo exigido en el enunciado del curso:
unitarias (Jest), de integración (Postman/Newman) y funcionales (Cypress).
Todos los casos fueron ejecutados realmente contra el sistema (Firebase real,
FakeStoreAPI real, no mocks) — no es un documento solo teórico.

- **Herramientas usadas:** Jest 29 (unitarias), Postman/Newman 6 (integración),
  Cypress 15 (funcionales E2E).
- **Cómo reproducir:** ver sección "6. Correr las pruebas automatizadas" del
  [README](../README.md).
- **Resultado global:** 36 de 36 casos aprobados (30 unitarias + 5 integración
  ejecutados dos veces + 7 funcionales), tras corregir 1 defecto detectado
  durante la ejecución (ver sección "Defectos encontrados y corregidos").

## 1. Pruebas unitarias (Jest) — `tests/unit/`

Prueban la lógica pura extraída a `js/lib/` (sin DOM ni red), incluyendo los
**vectores de prueba oficiales de la RFC 6238** para validar criptográficamente
el algoritmo TOTP.

| ID | Módulo | Descripción | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| CP-U01 | Pago | Tarjeta válida (16 dígitos, vencimiento futuro, CVV válido) no listada como rechazo | Aprobada (`ok:true, declined:false`) | ✅ Aprobado |
| CP-U02 | Pago | Número de tarjeta con menos de 16 dígitos | Rechazo con mensaje de formato | ✅ Aprobado |
| CP-U03 | Pago | Número de tarjeta con letras | Rechazo con mensaje de formato | ✅ Aprobado |
| CP-U04 | Pago | Vencimiento con formato inválido (no MM/AA) | Rechazo con mensaje de formato | ✅ Aprobado |
| CP-U05 | Pago | Tarjeta vencida (fecha pasada) | Rechazo, mensaje "vencida" | ✅ Aprobado |
| CP-U06 | Pago | CVV con longitud/formato inválido | Rechazo, mensaje "CVV" | ✅ Aprobado |
| CP-U07 | Pago | Detecta cada una de las 3 tarjetas de prueba de rechazo | `declined:true` con el motivo correcto | ✅ Aprobado (3 variantes) |
| CP-U08 | Carrito | Carrito vacío: total y cantidad en 0 | `calculateTotal=0`, `calculateCount=0` | ✅ Aprobado |
| CP-U09 | Carrito | Suma total considerando precio × cantidad de varios productos | Total y cantidad correctos | ✅ Aprobado |
| CP-U10 | Carrito | Agregar producto nuevo | Se agrega con `qty:1` | ✅ Aprobado |
| CP-U11 | Carrito | Agregar producto ya existente | Incrementa `qty` en 1 | ✅ Aprobado |
| CP-U12 | Carrito | Inmutabilidad: agregar no debe mutar el arreglo original | Arreglo original intacto | ✅ Aprobado |
| CP-U13 | Carrito | Incrementar cantidad (+1) | `qty` aumenta en 1 | ✅ Aprobado |
| CP-U14 | Carrito | Decrementar cantidad (-1) | `qty` disminuye en 1 | ✅ Aprobado |
| CP-U15 | Carrito | Decrementar hasta 0 | El producto se elimina del carrito | ✅ Aprobado |
| CP-U16 | Carrito | Eliminar un producto específico | Solo se elimina ese producto, el resto queda intacto | ✅ Aprobado |
| CP-U17 | 2FA | Round-trip base32 encode/decode | Los bytes decodificados igualan a los originales | ✅ Aprobado |
| CP-U18 | 2FA | `generateSecret()` produce clave de 32 caracteres base32 | Coincide con `/^[A-Z2-7]{32}$/` | ✅ Aprobado |
| CP-U19 | 2FA | Dos llamadas a `generateSecret()` producen claves distintas | Claves diferentes | ✅ Aprobado |
| CP-U20 | 2FA | **Vectores oficiales RFC 6238** (5 tiempos de referencia) | Código HOTP coincide exactamente con el valor oficial de la RFC | ✅ Aprobado (5 variantes) |
| CP-U21 | 2FA | `verifyTotp` acepta el código generado para el instante actual | `true` | ✅ Aprobado |
| CP-U22 | 2FA | `verifyTotp` rechaza un código incorrecto (`000000`) | `false` | ✅ Aprobado |
| CP-U23 | 2FA | Tolerancia de ventana: código de 30s atrás | `true` (tolerado) | ✅ Aprobado |
| CP-U24 | 2FA | Código de 5 minutos atrás (fuera de ventana) | `false` (rechazado) | ✅ Aprobado |

**Resultado de ejecución:** `30 passed, 30 total` (3 suites, 3.8s). Ver salida
completa ejecutando `npm test`.

## 2. Pruebas de integración (Postman/Newman) — `tests/postman/`

Prueban la integración real con FakeStoreAPI (catálogo y CRUD de
mantenimiento).

| ID | Endpoint | Descripción | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| CP-I01 | `GET /products` | Listar catálogo completo | Status 200, arreglo con productos, cada uno con `id/title/price/category/image` | ✅ Aprobado |
| CP-I02 | `GET /products/1` | Detalle de un producto | Status 200, `id` coincide con lo solicitado | ✅ Aprobado |
| CP-I03 | `POST /products` | Crear producto (admin) | Status 201, respuesta incluye `id` generado y el `title` enviado | ✅ Aprobado (ver defecto corregido abajo) |
| CP-I04 | `PUT /products/7` | Editar producto (admin) | Status 200, el `title` editado se refleja en la respuesta | ✅ Aprobado |
| CP-I05 | `DELETE /products/7` | Eliminar producto (admin) | Status 200, respuesta confirma el `id` eliminado | ✅ Aprobado |

**Resultado de ejecución:** `5 requests, 12 assertions, 0 failed` (ver salida
ejecutando `npm run test:integration`).

## 3. Pruebas funcionales E2E (Cypress) — `cypress/e2e/`

Prueban los flujos completos del usuario en el navegador real, contra el
Firebase y FakeStoreAPI reales del proyecto (sin mocks).

| ID | Archivo | Descripción | Precondición | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| CP-F01 | `registro-2fa.cy.js` | Un usuario nuevo se registra y debe configurar 2FA antes de ver el catálogo | Ninguna (crea cuenta nueva) | Tras ingresar el código TOTP correcto, se muestra el catálogo con productos | ✅ Aprobado |
| CP-F02 | `carrito-checkout.cy.js` | Agregar un producto al carrito actualiza el contador de la barra de navegación | Usuario registrado y con 2FA activo | Contador del carrito pasa de 0 a 1 | ✅ Aprobado |
| CP-F03 | `carrito-checkout.cy.js` | Completar una compra con tarjeta simulada aprobada (4242...) | Producto en el carrito | Vista de confirmación visible, mensaje indica estado "aprobada" | ✅ Aprobado |
| CP-F04 | `carrito-checkout.cy.js` | Usar una tarjeta de prueba de rechazo (4000...0002) | Producto en el carrito | Mensaje de error "rechazada" visible, NO navega a confirmación, el carrito conserva el producto | ✅ Aprobado |
| CP-F05 | `carrito-checkout.cy.js` | La bitácora registra el login y la compra del usuario | Compra aprobada completada | La tabla de bitácora contiene un evento "login" y uno "compra" | ✅ Aprobado |
| CP-F06 | `admin-crud.cy.js` | El botón "Administración" es visible solo para el rol admin | Cuenta con `role: "admin"` en Firestore | El botón de administración no tiene la clase `hidden` | ✅ Aprobado |
| CP-F07 | `admin-crud.cy.js` | Crear, editar y eliminar un producto desde el panel de administración | Sesión admin iniciada | El producto aparece, se refleja el precio editado, y desaparece tras eliminarlo | ✅ Aprobado |

**Resultado de ejecución:** `3 specs, 7 tests, 7 passing, 0 failing` (25-38s
de duración total, ver salida ejecutando `npx cypress run`).

## Defectos encontrados y corregidos

Durante la ejecución real de las pruebas (no solo su diseño) se detectó lo
siguiente, documentado aquí como evidencia del proceso de depuración exigido
en la Fase 5 del curso:

1. **CP-I03 (POST /products):** la prueba asumía inicialmente que FakeStoreAPI
   respondía con status `200` al crear un producto, como ocurre con el resto
   de sus endpoints. Al ejecutar la prueba con Newman, falló porque la API
   realmente responde `201 Created`. **Corrección:** se ajustó la aserción de
   la colección Postman a esperar `201`. El código de la aplicación
   (`js/admin.js`) no necesitó cambios porque ya usaba `res.ok` (verdadero
   para cualquier estado 2xx), así que nunca tuvo el bug — solo la prueba
   tenía la aserción incorrecta.
2. **Aislamiento de sesión en Cypress (`carrito-checkout.cy.js`):** al
   encadenar varias pruebas en el mismo archivo, la segunda prueba fallaba
   porque Firebase Auth restaura la sesión del usuario de la prueba anterior
   de forma asíncrona (persistida en IndexedDB, que Cypress no limpia entre
   pruebas como sí hace con `localStorage`/`sessionStorage`), lo que hacía
   que la pantalla de login ya no estuviera visible cuando la prueba
   intentaba interactuar con ella. **Corrección:** se agregó una espera corta
   y un cierre de sesión condicional al inicio de cada prueba, y se generan
   correos únicos por prueba para evitar colisiones de cuentas.

## Resumen

| Tipo | Casos | Aprobados | Herramienta |
|---|---|---|---|
| Unitarias | 24 (30 ejecuciones con variantes) | 30/30 | Jest |
| Integración | 5 | 5/5 (12/12 aserciones) | Postman / Newman |
| Funcionales E2E | 7 | 7/7 | Cypress |
| **Total** | **36 casos** | **36/36** | — |
