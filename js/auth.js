import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showView, setNavVisible, setNavEmail } from "./app.js";

let mode = "login"; // "login" | "register"

const form = document.getElementById("auth-form");
const title = document.getElementById("auth-title");
const submitBtn = document.getElementById("auth-submit-btn");
const toggleLink = document.getElementById("auth-toggle-link");
const toggleText = document.getElementById("auth-toggle-text");
const errorEl = document.getElementById("auth-error");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");

export function currentUser() {
  return auth.currentUser;
}

function showAuthError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearAuthError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function mapAuthError(err) {
  switch (err.code) {
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    default:
      return "Ocurrió un error: " + err.message;
  }
}

toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  clearAuthError();
  if (mode === "login") {
    mode = "register";
    title.textContent = "Crear cuenta";
    submitBtn.textContent = "Registrarme";
    toggleText.textContent = "¿Ya tienes cuenta?";
    toggleLink.textContent = "Inicia sesión";
  } else {
    mode = "login";
    title.textContent = "Iniciar sesión";
    submitBtn.textContent = "Iniciar sesión";
    toggleText.textContent = "¿No tienes cuenta?";
    toggleLink.textContent = "Regístrate";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthError();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    if (mode === "register") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    form.reset();
  } catch (err) {
    showAuthError(mapAuthError(err));
  }
});

document.getElementById("nav-logout-btn").addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  document.getElementById("loading-screen").classList.add("hidden");
  if (user) {
    setNavVisible(true);
    setNavEmail(user.email);
    // La vista a mostrar (2FA setup/verify o catálogo) la decide twofa.js,
    // que escucha este mismo evento.
    document.dispatchEvent(new CustomEvent("auth:login", { detail: { user } }));
  } else {
    setNavVisible(false);
    setNavEmail("");
    showView("view-auth");
    document.dispatchEvent(new CustomEvent("auth:logout"));
  }
});
