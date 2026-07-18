# Justificación de la herramienta seleccionada para autenticación de dos factores (2FA)

## Contexto

El enunciado del proyecto recomienda tres posibles herramientas para
implementar el método de autenticación de dos factores (2FA): **Auth0**,
**Okta** y **Firebase** (mediante su módulo de Multi-Factor Authentication
por SMS). Antes de seleccionar una, el equipo evaluó las tres alternativas
frente a la arquitectura ya definida para el resto del sistema, que utiliza
Firebase Authentication para el inicio de sesión estándar y Cloud Firestore
como base de datos para el carrito de compras, los roles de usuario y la
bitácora de transacciones.

## Cuadro comparativo

| Criterio | Auth0 | Okta | Firebase MFA (SMS) | TOTP propio (implementado) |
|---|---|---|---|---|
| Costo | Plan gratuito con MFA incluido hasta cierto límite de usuarios | Plan gratuito limitado; MFA en planes superiores | Requiere plan de pago Blaze (aunque con cuota gratuita, exige tarjeta registrada) | Sin costo, sin necesidad de cuenta ni tarjeta |
| Compatibilidad con la arquitectura actual | Requiere migrar el sistema de identidad completo (login, sesión) de Firebase a Auth0 | Igual que Auth0: requiere migrar la identidad completa | Se integra de forma nativa, pero exige el cambio de plan | Se integra de forma nativa, sin cambios en Firebase Auth ni Firestore |
| Impacto en el resto del sistema | Alto: el carrito, los roles y la bitácora dependen del UID de Firebase Auth; usarlo obligaría a "puentear" identidades (Firebase Custom Auth Tokens) o migrar todos los datos | Igual que Auth0 | Bajo: usa el mismo UID de Firebase Auth | Nulo: usa el mismo UID de Firebase Auth |
| Estándar utilizado | Propietario (Auth0) | Propietario (Okta) | SMS (propietario, requiere número telefónico real) | TOTP — RFC 6238, el mismo estándar abierto que usan Google Authenticator, Authy, y que Auth0/Okta implementan internamente |
| Dependencia de servicios externos adicionales | Sí (una cuarta cuenta/servicio, sumado a Firebase, FakeStoreAPI y PayPal) | Sí | No (ya se usa Firebase) | No |

## Análisis

Adoptar Auth0 u Okta habría significado remplazar el sistema de identidad
completo del proyecto, no únicamente agregar una verificación adicional. Esto
se debe a que el carrito de compras (`carts/{uid}`), el rol del usuario
(`users/{uid}`) y la bitácora de transacciones (filtrada por `uid`) dependen
directamente del identificador de usuario (UID) que genera Firebase
Authentication. Introducir Auth0 u Okta como proveedor de identidad habría
requerido, además de migrar el flujo de inicio de sesión, establecer un
puente entre ambos sistemas (por ejemplo, mediante *Firebase Custom Auth
Tokens*) o migrar toda la persistencia de datos de usuario a un esquema
distinto — un cambio de arquitectura considerable para un beneficio
funcional idéntico al que ya podía obtenerse dentro del propio ecosistema de
Firebase.

Por su parte, el módulo nativo de Multi-Factor Authentication de Firebase sí
se integra sin fricción con la arquitectura existente, pero su variante más
común (verificación por SMS) exige que el proyecto se mueva del plan gratuito
*Spark* al plan de pago por uso *Blaze*, lo cual introduce un requisito de
tarjeta de crédito registrada no deseable para un proyecto académico de este
alcance.

## Solución adoptada

En consecuencia, el equipo optó por implementar **TOTP (Time-based One-Time
Password, RFC 6238)** de forma propia, utilizando exclusivamente la Web
Crypto API nativa del navegador (`crypto.subtle`, con HMAC-SHA1), sin
dependencias externas ni costo. Esta es la misma familia de algoritmo que
utilizan por debajo tanto Google Authenticator como los propios Auth0 y Okta
al ofrecer 2FA por aplicación autenticadora, por lo que cumple el mismo
estándar de la industria y es compatible con cualquier aplicación
autenticadora (Google Authenticator, Authy, Microsoft Authenticator, etc.).

La implementación fue validada mediante pruebas unitarias que reproducen los
**vectores de prueba oficiales del Apéndice B de la RFC 6238**, confirmando
que el algoritmo implementado produce exactamente los mismos códigos que
especifica el estándar (ver `tests/unit/totp.test.js` y el documento de casos
de prueba, casos CP-U17 a CP-U24).

Esta decisión permitió cumplir el requisito funcional de "método de
autenticación 2FA" del enunciado sin incurrir en costos, sin depender de un
cuarto proveedor externo, y sin alterar la arquitectura de identidad ya
construida sobre Firebase.
