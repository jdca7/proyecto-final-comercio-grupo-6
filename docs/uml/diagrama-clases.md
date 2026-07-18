# Diagrama de clases — TiendaUIA

> Modela las entidades principales del sistema tal como existen en Firestore
> y en la lógica de la aplicación (`js/lib/*.js`). Para pegarlo en el informe:
> abrir el bloque en https://mermaid.live/, exportar como PNG/SVG.

```mermaid
classDiagram
  class Usuario {
    +String uid
    +String email
    +String role
    +String totpSecret
    +Boolean totpEnabled
    +registrarse(email, password)
    +iniciarSesion(email, password)
    +cerrarSesion()
    +configurarTotp(codigo) Boolean
    +verificarTotp(codigo) Boolean
  }

  class Producto {
    +Number id
    +String title
    +Number price
    +String description
    +String image
    +String category
  }

  class ItemCarrito {
    +Number id
    +String title
    +Number price
    +String image
    +Number qty
  }

  class Carrito {
    +String uid
    +ItemCarrito[] items
    +calcularTotal() Number
    +calcularCantidad() Number
    +agregarProducto(producto)
    +cambiarCantidad(id, delta)
    +eliminarProducto(id)
    +vaciar()
  }

  class Pedido {
    +ItemCarrito[] items
    +Number total
    +String date
    +String status
    +String motivo
    +String metodo
    +String paypalOrderId
  }

  class ValidadorPago {
    +Map DECLINE_CARDS
    +validatePayment(datosTarjeta) ResultadoPago
  }

  class ResultadoPago {
    +Boolean ok
    +Boolean declined
    +String reason
    +String declineReason
  }

  class EventoBitacora {
    +String uid
    +String evento
    +String detalle
    +Timestamp fecha
  }

  class Rol {
    <<enumeration>>
    cliente
    admin
  }

  Usuario "1" --> "1" Carrito : posee
  Carrito "1" o-- "0..*" ItemCarrito : contiene
  Usuario "1" --> "0..*" Pedido : realiza
  Pedido "1" o-- "1..*" ItemCarrito : incluye
  Usuario "1" --> "0..*" EventoBitacora : genera
  Usuario "1" -- "1" Rol : tiene
  ItemCarrito "0..*" --> "1" Producto : referencia
  Pedido ..> ValidadorPago : usa
  ValidadorPago ..> ResultadoPago : produce
```

## Notas sobre el modelo

- **Usuario**, **Carrito**, **Pedido** y **EventoBitacora** se persisten en
  Cloud Firestore, en las colecciones `users/{uid}`, `carts/{uid}`,
  (los pedidos no se guardan en una colección aparte en la versión actual,
  solo se registra su resultado en `bitacora`) y `bitacora` respectivamente.
- **Producto** no es una entidad propia del sistema: proviene de FakeStoreAPI
  y se trata como un objeto de solo lectura para el cliente (ver
  `js/catalog.js`) y de lectura/escritura para el administrador
  (`js/admin.js`).
- **ValidadorPago** corresponde al módulo puro `js/lib/payment.js`,
  desacoplado del DOM para poder probarse con Jest de forma aislada.
- **Rol** se modela como una enumeración simple (`"cliente"` | `"admin"`)
  almacenada como cadena en el documento del usuario, no como una clase
  independiente en Firestore.
