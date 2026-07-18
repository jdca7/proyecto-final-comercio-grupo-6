# Matriz de requisitos funcionales y no funcionales — TiendaUIA

## Requisitos funcionales (RF)

| ID | Requisito | Módulo relacionado |
|---|---|---|
| RF01 | El sistema debe permitir a un usuario registrarse con correo electrónico y contraseña. | `js/auth.js` |
| RF02 | El sistema debe permitir iniciar sesión con credenciales previamente registradas. | `js/auth.js` |
| RF03 | El sistema debe permitir cerrar sesión en cualquier momento. | `js/auth.js` |
| RF04 | El sistema debe generar una clave de verificación en dos pasos (2FA) la primera vez que un usuario accede, y exigir su confirmación antes de conceder acceso. | `js/twofa.js` |
| RF05 | El sistema debe solicitar un código de 2FA en cada sesión nueva de un usuario que ya lo tenga configurado. | `js/twofa.js` |
| RF06 | El sistema debe mostrar el catálogo de productos disponibles, consumido desde un servicio externo (FakeStoreAPI). | `js/catalog.js` |
| RF07 | El sistema debe permitir buscar/filtrar productos del catálogo por texto. | `js/catalog.js` |
| RF08 | El sistema debe permitir agregar un producto al carrito de compras. | `js/cart.js` |
| RF09 | El sistema debe permitir aumentar o disminuir la cantidad de un producto en el carrito. | `js/cart.js` |
| RF10 | El sistema debe permitir eliminar un producto del carrito. | `js/cart.js` |
| RF11 | El sistema debe conservar el carrito del usuario entre sesiones. | `js/cart.js` (Firestore) |
| RF12 | El sistema debe mostrar un resumen del pedido (productos, cantidades, total) antes de confirmar la compra. | `js/checkout.js` |
| RF13 | El sistema debe permitir seleccionar el método de pago: tarjeta simulada o PayPal. | `js/checkout.js`, `js/paypal-checkout.js` |
| RF14 | El sistema debe validar el formato de los datos de una tarjeta simulada (número, vencimiento, CVV). | `js/lib/payment.js` |
| RF15 | El sistema debe simular la aprobación o el rechazo de una transacción con tarjeta, según el número ingresado. | `js/lib/payment.js` |
| RF16 | El sistema debe procesar pagos reales de prueba mediante PayPal Sandbox (crear y capturar una orden). | `js/paypal-checkout.js` |
| RF17 | El sistema debe confirmar la compra al usuario una vez aprobado el pago, y vaciar el carrito. | `js/checkout.js`, `js/paypal-checkout.js` |
| RF18 | El sistema debe registrar en una bitácora los eventos de inicio de sesión y de compra (aprobada o rechazada). | `js/bitacora.js` |
| RF19 | El sistema debe permitir a un usuario consultar el historial de su propia bitácora de transacciones. | `js/bitacora.js` |
| RF20 | El sistema debe distinguir entre roles de usuario: cliente y administrador. | `js/roles.js` |
| RF21 | El sistema debe permitir a un usuario con rol administrador crear nuevos productos en el catálogo. | `js/admin.js` |
| RF22 | El sistema debe permitir a un administrador editar productos existentes del catálogo. | `js/admin.js` |
| RF23 | El sistema debe permitir a un administrador eliminar productos del catálogo. | `js/admin.js` |
| RF24 | El sistema debe ocultar el panel de administración a los usuarios con rol cliente. | `js/roles.js`, `js/admin.js` |

## Requisitos no funcionales (RNF)

| ID | Categoría | Requisito |
|---|---|---|
| RNF01 | Seguridad | Las credenciales de acceso (correo/contraseña) deben ser gestionadas por Firebase Authentication; la aplicación no debe almacenar contraseñas en texto plano en ningún momento. |
| RNF02 | Seguridad | El acceso a los datos en Firestore debe restringirse mediante reglas de seguridad (`firestore.rules`), de modo que cada usuario solo pueda leer o modificar su propia información. |
| RNF03 | Seguridad | La clave secreta del 2FA debe generarse mediante un generador de números aleatorios criptográficamente seguro (`crypto.getRandomValues`), no un generador pseudoaleatorio simple. |
| RNF04 | Usabilidad | La interfaz debe estar completamente en español y debe poder utilizarse sin instalar software adicional, únicamente con un navegador web. |
| RNF05 | Portabilidad | El sistema debe ejecutarse en cualquier navegador moderno (Chrome, Edge, Firefox) sin requerir un entorno de ejecución adicional (Node.js, máquina virtual, etc.) para su uso final. |
| RNF06 | Rendimiento | Las operaciones sobre el catálogo y el carrito deben reflejarse en la interfaz en menos de un segundo bajo condiciones normales de red, sin bloquear la interacción del usuario. |
| RNF07 | Mantenibilidad | La lógica de negocio pura (validación de pago, cálculo de carrito, algoritmo TOTP) debe estar desacoplada del DOM y de servicios externos, para permitir pruebas unitarias aisladas. |
| RNF08 | Disponibilidad | El sistema depende de la disponibilidad de tres servicios externos (Firebase, FakeStoreAPI, PayPal); una caída de cualquiera de ellos afecta directamente la funcionalidad correspondiente. |
| RNF09 | Compatibilidad | El mecanismo de 2FA debe ser compatible con aplicaciones autenticadoras estándar del mercado (Google Authenticator, Authy, Microsoft Authenticator), al implementar el estándar abierto TOTP (RFC 6238). |
| RNF10 | Escalabilidad | El modelo de datos en Firestore (documentos independientes por `uid`) debe soportar el crecimiento en el número de usuarios sin requerir cambios estructurales en el esquema. |
| RNF11 | Costo | El sistema no debe requerir ningún servicio de pago para operar: todas las herramientas utilizadas (Firebase Spark, FakeStoreAPI, PayPal Sandbox, Jest, Postman, Cypress) cuentan con planes o usos gratuitos. |
| RNF12 | Auditabilidad | Los eventos registrados en la bitácora de transacciones no deben poder modificarse ni eliminarse una vez creados (append-only), para preservar su valor como registro de auditoría. |
