# Diseño de la base de datos — TiendaUIA

## Motor de base de datos y justificación

Se utilizó **Cloud Firestore** (base de datos NoSQL orientada a documentos,
del ecosistema Firebase) en lugar de una base de datos relacional, por las
siguientes razones:

- **Coherencia con la arquitectura sin servidor** del proyecto: Firestore se
  consulta directamente desde el navegador mediante su SDK de cliente, sin
  necesitar un backend propio que administre conexiones a una base de datos
  relacional.
- **Integración nativa con Firebase Authentication**: el `uid` que genera
  Firebase Auth al registrarse se usa directamente como identificador de
  documento en Firestore, sin necesidad de tablas de mapeo adicionales.
- **Reglas de seguridad declarativas** (`firestore.rules`) que reemplazan la
  capa de autorización que normalmente viviría en un backend, permitiendo
  restringir el acceso dato-por-dato directamente desde el cliente de forma
  segura.
- El volumen y la complejidad relacional de los datos del proyecto (perfil de
  usuario, carrito, bitácora) son bajos y no requieren las garantías
  transaccionales multi-tabla de una base relacional.

El catálogo de productos **no se almacena** en esta base de datos: se
consume en vivo desde FakeStoreAPI (ver justificación correspondiente en
`docs/justificacion-fakestoreapi.md`).

## Diagrama entidad-relación (conceptual)

> Firestore no tiene relaciones ni llaves foráneas reales como una base
> relacional; este diagrama representa el modelo de forma conceptual, usando
> el `uid` de Firebase Auth como identificador compartido entre colecciones.

```mermaid
erDiagram
    USUARIO ||--|| CARRITO : "posee (mismo uid)"
    USUARIO ||--o{ EVENTO_BITACORA : "genera"

    USUARIO {
        string uid PK "generado por Firebase Auth"
        string email
        string role "cliente | admin"
        string totpSecret
        boolean totpEnabled
    }

    CARRITO {
        string uid PK_FK "= users/{uid}"
        array items "lista de ItemCarrito embebidos"
    }

    EVENTO_BITACORA {
        string id PK "autogenerado"
        string uid FK "referencia al usuario"
        string evento "login | compra | compra_rechazada"
        string detalle
        timestamp fecha
    }
```

## Colecciones y estructura de documentos

### `users/{uid}`

Un documento por usuario registrado, usando el mismo `uid` que le asigna
Firebase Authentication.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `role` | string | Rol del usuario: `"cliente"` (por defecto) o `"admin"` | `"cliente"` |
| `totpSecret` | string | Clave secreta en base32 usada para generar/verificar los códigos TOTP del 2FA | `"RTSNFLHYLHTN6C5E..."` |
| `totpEnabled` | boolean | Indica si el usuario ya completó la configuración del 2FA | `true` |

El correo electrónico y la contraseña **no se guardan en Firestore**: los
administra directamente Firebase Authentication como parte de la cuenta del
usuario.

### `carts/{uid}`

Un documento por usuario, con el estado actual de su carrito de compras.

| Campo | Tipo | Descripción |
|---|---|---|
| `items` | array de objetos | Lista de productos en el carrito |

Cada objeto dentro de `items` tiene esta forma (subdocumento embebido, no una
subcolección — se eligió así porque el carrito se lee y escribe siempre como
una unidad completa, no elemento por elemento):

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | ID del producto (proviene de FakeStoreAPI) |
| `title` | string | Nombre del producto |
| `price` | number | Precio unitario |
| `image` | string | URL de la imagen |
| `qty` | number | Cantidad en el carrito |

### `bitacora` (colección, documentos con ID autogenerado)

Un documento por cada evento registrado (login o intento de compra). A
diferencia de `users` y `carts`, aquí **no** se usa el `uid` como ID del
documento, porque un mismo usuario genera muchos eventos a lo largo del
tiempo.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `uid` | string | Usuario que generó el evento | `"a1b2c3..."` |
| `evento` | string | Tipo de evento: `"login"`, `"compra"` o `"compra_rechazada"` | `"compra"` |
| `detalle` | string | Descripción legible del evento | `"Pedido por $109.95 (1 producto(s)), estado: aprobada"` |
| `fecha` | timestamp | Marca de tiempo del servidor (`serverTimestamp()`) | — |

## Índices

La consulta de la bitácora filtra por `uid` (`where`) y ordena por `fecha`
(`orderBy`) simultáneamente, lo cual requiere un **índice compuesto** en
Firestore sobre la colección `bitacora` con los campos `uid` (ascendente) y
`fecha` (descendente). Este índice se generó desde la consola de Firebase
siguiendo el enlace que la propia API devuelve la primera vez que se ejecuta
la consulta (ver README, sección "Notas técnicas").

## Reglas de seguridad

Durante el desarrollo se usó el "modo de prueba" de Firestore (acceso
abierto por 30 días), suficiente para construir y probar la aplicación. Para
la entrega final se definieron las reglas de seguridad formales en
[`firestore.rules`](../firestore.rules), que restringen el acceso para que:

- Un usuario solo pueda leer o escribir **su propio** documento en `users` y
  `carts` (comparando `request.auth.uid` contra el ID del documento).
- Un usuario solo pueda leer o crear eventos de bitácora **donde `uid`
  coincide con su propia sesión**, y no pueda modificar ni eliminar eventos
  ya existentes (la bitácora es de solo agregar — *append-only* — para que
  siga siendo una fuente confiable de auditoría).
- Cualquier otra ruta o colección quede denegada por defecto.

**Pendiente para el equipo:** copiar el contenido de `firestore.rules` en
Firebase Console → Firestore Database → pestaña "Reglas", y publicarlas,
antes de la entrega final (o usar `firebase deploy --only firestore:rules`
si se instala el Firebase CLI).

## Decisiones de diseño y alcance

- **No existe una colección `pedidos`/`orders` separada**: el resultado de
  cada compra (aprobada o rechazada) se registra como una entrada de texto
  dentro de `bitacora`, no como un documento estructurado independiente. Se
  eligió así para mantener el alcance simple, dado que el enunciado pide
  explícitamente una "bitácora de transacciones", no un historial de pedidos
  con estructura propia. Como mejora futura, se podría introducir una
  colección `orders/{orderId}` con el detalle completo de cada pedido,
  referenciada desde la bitácora por su ID.
- **Los productos no se persisten localmente**: se consumen en vivo desde
  FakeStoreAPI. El CRUD de mantenimiento de catálogo (rol admin) actualiza el
  estado en memoria de la aplicación durante la sesión, pero no una
  colección propia en Firestore (ver `docs/justificacion-fakestoreapi.md`
  para el detalle de esta decisión y su limitación conocida).
