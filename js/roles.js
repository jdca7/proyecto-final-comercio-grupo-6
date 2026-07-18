// Gestión de roles de usuario (cliente/administrador). Todo usuario nuevo
// recibe el rol "cliente" por defecto. Para convertir a alguien en
// administrador, un integrante del equipo debe editar manualmente el campo
// "role" a "admin" en el documento users/{uid} desde la consola de Firestore
// (Firestore Database > colección "users" > el documento del usuario).

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentRole = "cliente";

export function getCurrentRole() {
  return currentRole;
}

export function isAdmin() {
  return currentRole === "admin";
}

const adminBtn = document.getElementById("nav-admin-btn");

async function loadRole(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  if (!data.role) {
    await setDoc(userRef, { role: "cliente", email: user.email }, { merge: true });
    currentRole = "cliente";
  } else {
    currentRole = data.role;
    // Mantiene el correo sincronizado para que el panel de administración
    // de usuarios pueda mostrarlo (Firestore no lo guarda automáticamente).
    if (data.email !== user.email) {
      await setDoc(userRef, { email: user.email }, { merge: true });
    }
  }

  adminBtn.classList.toggle("hidden", !isAdmin());
  document.dispatchEvent(new CustomEvent("role:ready", { detail: { role: currentRole } }));
}

document.addEventListener("auth:login", (e) => {
  loadRole(e.detail.user);
});

document.addEventListener("auth:logout", () => {
  currentRole = "cliente";
  adminBtn.classList.add("hidden");
});
