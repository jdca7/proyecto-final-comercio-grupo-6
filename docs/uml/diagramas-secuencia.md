# Diagramas de secuencia — TiendaUIA

Se documentan los dos flujos más complejos del sistema. Para pegarlos en el
informe: abrir cada bloque en https://mermaid.live/, exportar como PNG/SVG.

## 1. Registro, configuración y verificación de 2FA

```mermaid
sequenceDiagram
    actor Cliente
    participant App as App (navegador)
    participant FirebaseAuth as Firebase Authentication
    participant Firestore

    Cliente->>App: Ingresa correo y contraseña (registro)
    App->>FirebaseAuth: createUserWithEmailAndPassword()
    FirebaseAuth-->>App: Usuario creado (uid)
    App->>Firestore: getDoc(users/{uid})
    Firestore-->>App: No existe documento
    App->>App: generateSecret() (TOTP, RFC 6238)
    App->>Firestore: setDoc(users/{uid}, {totpSecret, totpEnabled:false, role:"cliente"})
    App-->>Cliente: Muestra la clave secreta TOTP en pantalla

    Cliente->>App: Ingresa el código de 6 dígitos de su app autenticadora
    App->>App: verifyTotp(secret, codigo)

    alt código correcto
        App->>Firestore: setDoc(users/{uid}, {totpEnabled:true})
        App->>App: sessionStorage.setItem("2fa_verified_uid")
        App-->>Cliente: Acceso concedido al catálogo
    else código incorrecto
        App-->>Cliente: Muestra error, solicita el código nuevamente
    end

    Note over Cliente,App: En sesiones posteriores (2FA ya activado),<br/>solo se repite el paso de verificación, no el de configuración.
```

## 2. Proceso de compra (tarjeta simulada o PayPal Sandbox)

```mermaid
sequenceDiagram
    actor Cliente
    participant App as App (navegador)
    participant Firestore
    participant Validador as ValidadorPago (js/lib/payment.js)
    participant PayPal as PayPal Sandbox

    Cliente->>App: Agrega producto al carrito
    App->>Firestore: setDoc(carts/{uid}, {items})
    Cliente->>App: Va al checkout y ve el resumen del pedido
    Cliente->>App: Selecciona método de pago

    alt Tarjeta simulada
        Cliente->>App: Ingresa datos de tarjeta (número, vencimiento, CVV)
        App->>Validador: validatePayment(datosTarjeta)
        Validador-->>App: { ok, declined, reason }

        alt tarjeta aprobada
            App->>Firestore: addDoc(bitacora, {evento:"compra", estado:"aprobada"})
            App->>Firestore: setDoc(carts/{uid}, {items:[]})
            App-->>Cliente: Muestra confirmación de compra
        else tarjeta de prueba de rechazo
            App->>Firestore: addDoc(bitacora, {evento:"compra_rechazada", motivo})
            App-->>Cliente: Muestra error de rechazo, conserva el carrito
        end

    else PayPal Sandbox
        Cliente->>App: Hace clic en el botón de PayPal
        App->>PayPal: actions.order.create({ total })
        PayPal-->>Cliente: Solicita iniciar sesión (cuenta de comprador de prueba)
        Cliente->>PayPal: Aprueba el pago
        PayPal-->>App: onApprove(orderId)
        App->>PayPal: actions.order.capture()
        PayPal-->>App: Detalle de la transacción capturada
        App->>Firestore: addDoc(bitacora, {evento:"compra", metodo:"paypal_sandbox", paypalOrderId})
        App->>Firestore: setDoc(carts/{uid}, {items:[]})
        App-->>Cliente: Muestra confirmación de compra
    end
```
