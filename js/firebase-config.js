// Configuración de Firebase (SDK modular v9, vía CDN — sin npm/bundler).
//
// PASOS PARA CONFIGURAR (uno de los integrantes del equipo debe hacerlo):
// 1. Ir a https://console.firebase.google.com y crear un proyecto gratuito.
// 2. Dentro del proyecto: Authentication > Sign-in method > habilitar "Correo electrónico/contraseña".
// 3. Dentro del proyecto: Firestore Database > crear base de datos (modo de prueba).
// 4. Ir a Configuración del proyecto > General > "Tus apps" > agregar app web (</>)
//    y copiar el objeto firebaseConfig que se genera ahí abajo, reemplazando los valores "TODO".
const firebaseConfig = {
  apiKey: "AIzaSyAPQmVPsP6SZfkFmO4jraxfr9Ix2byPksQ",
  authDomain: "proyecto-uia.firebaseapp.com",
  projectId: "proyecto-uia",
  storageBucket: "proyecto-uia.firebasestorage.app",
  messagingSenderId: "462902195424",
  appId: "1:462902195424:web:2dfd4240db3ce7a0254c85",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
