# Justificación de la herramienta seleccionada para integración de pagos

## Contexto

El enunciado del proyecto sugiere dos categorías de API para el proceso de
pago: una pasarela real en modo de prueba (**PayPal Developer** o **Stripe**,
en su modo *testing*) y una opción de pago simulado (**FakeStoreAPI**). El
equipo decidió implementar ambas rutas: un pago simulado con validación de
formato de tarjeta y tarjetas de prueba de aprobación/rechazo, y un pago real
en un entorno de pruebas (*sandbox*), dejando al usuario final la posibilidad
de elegir el método al momento de pagar (cumpliendo así el requisito de
"selección de método de pago" del enunciado). Para la segunda ruta, se
evaluó específicamente **Stripe** frente a **PayPal**.

## Cuadro comparativo

| Criterio | Stripe (modo test) | PayPal Sandbox (adoptado) |
|---|---|---|
| Requiere backend propio | Sí: crear una sesión de pago (`Checkout Session`) o una intención de pago (`PaymentIntent`) exige la clave secreta de Stripe, que **no puede exponerse en el navegador** por seguridad | No: el SDK de botones de PayPal (`paypal.Buttons`) permite crear y capturar la orden de pago 100% desde el navegador, usando únicamente el *Client ID* público |
| Compatibilidad con la arquitectura sin servidor del proyecto | Rompe la arquitectura: obligaría a construir y desplegar un backend (Node/Express o una función *serverless*) solo para este propósito | Totalmente compatible: no se requiere ningún servidor adicional |
| Naturaleza de la prueba | Simulada mediante tarjetas de prueba, sin flujo de aprobación real | Transacción real de extremo a extremo (crea y captura una orden real) dentro del entorno sandbox, con dinero ficticio |
| Cuenta de prueba de comprador | Tarjetas de prueba (números predefinidos) | Cuentas de comprador de prueba con correo y contraseña, que permiten simular el flujo de aprobación completo tal como lo haría un usuario real |

## Análisis

La razón determinante para descartar Stripe no fue su complejidad de uso,
sino una limitación de seguridad inherente a su diseño: para crear una sesión
de pago o una intención de pago, Stripe requiere autenticarse con una
**clave secreta**, la cual nunca debe incluirse en código que se ejecute en
el navegador (cualquier persona podría inspeccionarla y usarla indebidamente).
Esto implica que, sin excepción, cualquier integración real con Stripe
necesita un backend propio que actúe como intermediario seguro entre el
cliente y la API de Stripe.

Dado que el proyecto se diseñó deliberadamente como una aplicación 100%
estática (sin backend propio, ver justificación del stack de desarrollo),
adoptar Stripe habría obligado a construir, desplegar y mantener un servidor
adicional únicamente para esta funcionalidad, contradiciendo la decisión
arquitectónica tomada para el resto del sistema.

PayPal, en cambio, permite mediante su SDK de JavaScript (`paypal.Buttons`)
crear y capturar órdenes de pago reales directamente desde el navegador,
usando un identificador de cliente (*Client ID*) que es seguro de exponer
públicamente, sin necesidad de exponer ninguna credencial secreta.

## Decisión adoptada

Se implementó **PayPal Sandbox** como pasarela de pago real en modo de
prueba, mediante el SDK oficial de JavaScript de PayPal cargado
dinámicamente en el checkout (`js/paypal-checkout.js`). El flujo fue
verificado de extremo a extremo: creación de la orden, aprobación mediante
una cuenta de comprador de prueba (sandbox), captura de la transacción, y
registro del resultado en la bitácora de transacciones con el identificador
real de la orden de PayPal.

Como complemento, se mantiene la opción de **pago simulado con tarjeta**
(validación de formato según el estándar de 16 dígitos, MM/AA y CVV, con un
conjunto de tarjetas de prueba que simulan aprobación o rechazo, inspirado en
las tarjetas de prueba de Stripe), lo que permite al usuario elegir entre
ambos métodos y documentar casos de prueba tanto del camino de éxito como de
distintos escenarios de rechazo (ver `tests/casos-de-prueba.md`, casos
CP-U01 a CP-U07 y CP-F03/CP-F04).
