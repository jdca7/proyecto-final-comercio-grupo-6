# Diagrama de casos de uso — TiendaUIA

> Mermaid no tiene un tipo de diagrama "use case" nativo, así que se modela
> con un `flowchart` usando óvalos (`([Texto])`) para los casos de uso y
> rectángulos para los actores — es la convención más común para representar
> diagramas de casos de uso con Mermaid. Para pegarlo en el informe de Word:
> abrir este bloque en https://mermaid.live/, exportar como PNG/SVG, e
> insertar la imagen.

```mermaid
flowchart LR
  Cliente["🧑 Actor: Cliente"]
  Admin["🧑‍💼 Actor: Administrador"]
  Firebase[["☁️ Firebase Auth / Firestore"]]
  FakeStoreAPI[["☁️ FakeStoreAPI"]]
  PayPal[["☁️ PayPal Sandbox"]]

  UC1(["Registrarse"])
  UC2(["Iniciar sesión"])
  UC3(["Configurar 2FA"])
  UC4(["Verificar 2FA"])
  UC5(["Cerrar sesión"])
  UC6(["Ver / buscar catálogo"])
  UC7(["Agregar producto al carrito"])
  UC8(["Modificar cantidad en el carrito"])
  UC9(["Eliminar producto del carrito"])
  UC10(["Realizar compra"])
  UC11(["Seleccionar método de pago"])
  UC12(["Pagar con tarjeta simulada"])
  UC13(["Pagar con PayPal"])
  UC14(["Ver bitácora de transacciones"])
  UC15(["Crear producto"])
  UC16(["Editar producto"])
  UC17(["Eliminar producto"])

  Cliente --> UC1
  Cliente --> UC2
  Cliente --> UC3
  Cliente --> UC4
  Cliente --> UC5
  Cliente --> UC6
  Cliente --> UC7
  Cliente --> UC8
  Cliente --> UC9
  Cliente --> UC10
  Cliente --> UC14

  UC10 -.include.-> UC11
  UC11 -.include.-> UC12
  UC11 -.include.-> UC13

  Admin -->|hereda todos los casos de uso de Cliente| Cliente
  Admin --> UC15
  Admin --> UC16
  Admin --> UC17

  UC2 -.include.-> Firebase
  UC1 -.include.-> Firebase
  UC4 -.include.-> Firebase
  UC6 -.include.-> FakeStoreAPI
  UC15 -.include.-> FakeStoreAPI
  UC16 -.include.-> FakeStoreAPI
  UC17 -.include.-> FakeStoreAPI
  UC13 -.include.-> PayPal
```

## Descripción de los casos de uso principales

| Caso de uso | Actor | Descripción breve |
|---|---|---|
| Registrarse | Cliente | Crea una cuenta con correo y contraseña (Firebase Auth) |
| Iniciar sesión | Cliente | Inicia sesión con credenciales existentes |
| Configurar 2FA | Cliente | Al primer ingreso, genera y confirma una clave TOTP con una app autenticadora |
| Verificar 2FA | Cliente | En logins posteriores, confirma un código de 6 dígitos antes de acceder |
| Ver/buscar catálogo | Cliente | Consulta el catálogo de productos (FakeStoreAPI) y lo filtra por texto |
| Agregar/modificar/eliminar del carrito | Cliente | Gestiona los productos y cantidades de su carrito (persistido en Firestore) |
| Realizar compra | Cliente | Genera el resumen del pedido y procede al pago |
| Seleccionar método de pago | Cliente | Elige entre tarjeta simulada o PayPal Sandbox |
| Ver bitácora de transacciones | Cliente | Consulta el historial de sus propios eventos (login, compras) |
| Crear/editar/eliminar producto | Administrador | Mantenimiento del catálogo (CRUD contra FakeStoreAPI) |
