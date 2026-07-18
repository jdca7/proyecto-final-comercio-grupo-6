# Justificación del lenguaje de programación y stack de desarrollo

## Contexto

El enunciado del curso permite seleccionar libremente el lenguaje de
programación entre las opciones sugeridas (Java, Python, JavaScript, C#, u
otro), exigiendo únicamente que la elección se justifique. El equipo evaluó
tres alternativas concretas antes de iniciar el desarrollo: **JavaScript
puro** (sin framework ni herramientas de compilación), **React + Node/Express**,
y **Python** (con un backend tipo Flask/FastAPI).

## Cuadro comparativo

| Criterio | React + Node/Express | Python (Flask/FastAPI) | JavaScript puro (adoptado) |
|---|---|---|---|
| Curva de configuración inicial | Requiere Node, npm, bundler (Vite/CRA), y un paso de compilación antes de ver resultados | Requiere un servidor backend corriendo aparte del frontend | Ninguna: se abre `index.html` con un servidor estático y ya funciona |
| Compatibilidad con Firebase Authentication | Buena, pero añade una capa de componentes/estado que no aporta valor para este alcance | Baja: Firebase Auth está diseñado para ejecutarse en el cliente (navegador); usarlo desde Python exigiría un puente adicional solo para autenticación | Nativa: Firebase Auth se ejecuta directamente en el navegador, que es su caso de uso principal |
| Necesidad de backend propio | No estrictamente, pero suele acompañarse de uno | Sí, obligatorio (Python no puede servir el frontend por sí solo) | No: toda la lógica corre en el navegador, con Firebase y FakeStoreAPI como únicos servicios externos |
| Piezas móviles adicionales que pueden fallar | Bundler, transpilador, gestor de paquetes | Servidor backend, enrutador de API, gestión de procesos | Ninguna adicional |
| Alineación con las herramientas de prueba sugeridas por el docente (Jest, Postman, Cypress) | Alta | Media (Jest/Cypress son herramientas de JavaScript, no de Python) | Alta |

## Análisis

React aporta una arquitectura de componentes y gestión de estado que resulta
valiosa en aplicaciones grandes o con múltiples desarrolladores trabajando en
paralelo sobre la misma interfaz, pero para el alcance de este proyecto
(un portal con seis vistas y flujos relativamente lineales) introduce
complejidad de configuración — instalación de Node, gestor de paquetes,
bundler y un paso de compilación — sin un beneficio proporcional.

Python obligaría a mantener un servidor backend además del frontend, lo cual
no es necesario dado que Firebase Authentication y Cloud Firestore ya actúan
como backend as a service (BaaS), y FakeStoreAPI y PayPal exponen APIs REST
consumibles directamente desde el navegador. Sumar un servidor Python
únicamente para intermediar esas llamadas habría duplicado responsabilidades
sin necesidad real.

## Decisión adoptada

Se optó por **JavaScript puro (ES2020+, módulos nativos `<script
type="module">`)**, sin frameworks ni herramientas de compilación, por ser la
opción que:

1. Permite ejecutar el proyecto con un simple servidor estático (`python -m
   http.server`, o la extensión Live Server de VS Code), sin instalar Node
   ni dependencias para correr la aplicación en sí.
2. Se integra de forma nativa con el SDK de Firebase (pensado para
   ejecutarse en el navegador) y con las API REST de FakeStoreAPI y PayPal.
3. Es compatible con las herramientas de prueba recomendadas por el docente
   (Jest para pruebas unitarias, Postman para integración, Cypress para
   pruebas funcionales E2E), todas ejecutadas y documentadas en este
   proyecto (ver `tests/casos-de-prueba.md`).
4. Minimiza el número de piezas que pueden fallar, priorizando tener un
   sistema funcional cuanto antes — una decisión relevante considerando el
   tiempo disponible para el desarrollo.

Como IDE se utilizó **Visual Studio Code**, por ser gratuito, multiplataforma,
y contar con soporte nativo para depuración de JavaScript en el navegador
(integración con las herramientas de desarrollador de Chrome/Edge) y con la
extensión Live Server usada para servir el proyecto localmente.
