# Justificación del uso de FakeStoreAPI para el catálogo de productos

## Contexto

El enunciado exige que el sistema consuma al menos una API gratuita de un
tercero, y sugiere explícitamente **FakeStoreAPI** tanto para el catálogo de
productos como para el proceso de pago simulado. El equipo evaluó si el
catálogo debía basarse en una base de datos propia (Firestore) o en
FakeStoreAPI, y qué implicaciones tendría cada opción sobre el CRUD de
mantenimiento de catálogo.

## Cuadro comparativo

| Criterio | Catálogo propio (Firestore) | FakeStoreAPI (adoptado) |
|---|---|---|
| Cumple el requisito de "consumir un API gratuita de un tercero" | No, por sí solo | Sí |
| Esfuerzo de implementación inicial | Requiere diseñar la colección, poblarla con datos de ejemplo, e implementar las cuatro operaciones CRUD desde cero | La lectura (catálogo) está lista de inmediato; el CRUD reutiliza los endpoints ya existentes de la API |
| Persistencia real de los cambios (crear/editar/eliminar) | Sí, total | No: FakeStoreAPI es un servicio de demostración que acepta las peticiones y responde éxito, pero no guarda los cambios en su servidor |
| Consistencia entre sesiones del navegador | Total | Los cambios solo se reflejan durante la sesión activa; al recargar la página, el catálogo vuelve a su estado original |

## Análisis

FakeStoreAPI es explícitamente la API recomendada por el docente para el
catálogo de productos, y su uso satisface directamente el requisito de
integración con un servicio externo. Su principal particularidad —y la
razón por la que este comportamiento se documenta explícitamente en el
proyecto— es que **es una API de demostración**: sus endpoints de escritura
(`POST`, `PUT`, `DELETE`) están implementados y responden con los códigos de
estado HTTP correctos (confirmado mediante las pruebas de integración con
Postman, ver `tests/casos-de-prueba.md`, casos CP-I03 a CP-I05), pero los
cambios no se persisten realmente en su base de datos: una segunda consulta
`GET` seguirá devolviendo el catálogo original de 20 productos.

Esta no es una limitación del código desarrollado, sino una característica
documentada del servicio de terceros, pensada precisamente para permitir
practicar operaciones de escritura sin riesgo de corromper datos compartidos
entre todos sus usuarios.

## Decisión adoptada

Se utilizó FakeStoreAPI como fuente del catálogo (solo lectura para el rol
cliente) y como backend del módulo de mantenimiento de catálogo (CRUD,
exclusivo para el rol admin). Para que la demostración del CRUD sea
consistente durante una sesión de uso —y no se pierda visualmente apenas se
crea, edita o elimina un producto— la aplicación **refleja el cambio también
en el estado local del catálogo** (`js/catalog.js`, funciones
`upsertLocalProduct` / `removeLocalProduct`), además de invocar el endpoint
correspondiente de la API. Esto permite demostrar el flujo completo de CRUD
en el navegador, dejando claro —tanto en el código como en el informe— que la
persistencia real está limitada por el comportamiento propio de la API de
terceros utilizada, no por una falla de la implementación.
