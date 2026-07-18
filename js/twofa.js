// Verificación en dos pasos (2FA) basada en TOTP — el mismo algoritmo que usan
// Google Authenticator / Authy (RFC 6238), implementado con la Web Crypto API
// nativa del navegador. No depende de ningún servicio de pago (a diferencia
// del 2FA por SMS de Firebase, que requiere el plan Blaze).

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showView } from "./app.js";
import { generateSecret, verifyTotp, formatSecret } from "./lib/totp.js";

function sessionKey(uid) {
  return `2fa_verified_${uid}`;
}

let pendingUid = null;
let pendingSecret = null;

const setupForm = document.getElementById("twofa-setup-form");
const setupCodeInput = document.getElementById("twofa-setup-code");
const setupSecretEl = document.getElementById("twofa-setup-secret");
const setupErrorEl = document.getElementById("twofa-setup-error");

const verifyForm = document.getElementById("twofa-verify-form");
const verifyCodeInput = document.getElementById("twofa-verify-code");
const verifyErrorEl = document.getElementById("twofa-verify-error");

function showSetupError(msg) {
  setupErrorEl.textContent = msg;
  setupErrorEl.classList.remove("hidden");
}
function clearSetupError() {
  setupErrorEl.textContent = "";
  setupErrorEl.classList.add("hidden");
}
function showVerifyError(msg) {
  verifyErrorEl.textContent = msg;
  verifyErrorEl.classList.remove("hidden");
}
function clearVerifyError() {
  verifyErrorEl.textContent = "";
  verifyErrorEl.classList.add("hidden");
}

async function handleAuthLogin(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};

  if (!data.totpEnabled) {
    // Usuario nuevo o que nunca terminó de configurar el 2FA.
    const secret = data.totpSecret || generateSecret();
    if (!data.totpSecret) {
      await setDoc(userRef, { totpSecret: secret, totpEnabled: false }, { merge: true });
    }
    pendingUid = user.uid;
    pendingSecret = secret;
    clearSetupError();
    setupCodeInput.value = "";
    setupSecretEl.textContent = formatSecret(secret);
    showView("view-2fa-setup");
    return;
  }

  if (sessionStorage.getItem(sessionKey(user.uid)) === "1") {
    showView("view-catalog");
    return;
  }

  pendingUid = user.uid;
  pendingSecret = data.totpSecret;
  clearVerifyError();
  verifyCodeInput.value = "";
  showView("view-2fa-verify");
}

setupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearSetupError();
  const ok = await verifyTotp(pendingSecret, setupCodeInput.value);
  if (!ok) {
    showSetupError("Código incorrecto. Verifica la hora de tu dispositivo e inténtalo de nuevo.");
    return;
  }
  await setDoc(doc(db, "users", pendingUid), { totpEnabled: true }, { merge: true });
  sessionStorage.setItem(sessionKey(pendingUid), "1");
  showView("view-catalog");
});

verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearVerifyError();
  const ok = await verifyTotp(pendingSecret, verifyCodeInput.value);
  if (!ok) {
    showVerifyError("Código incorrecto.");
    return;
  }
  sessionStorage.setItem(sessionKey(pendingUid), "1");
  showView("view-catalog");
});

document.getElementById("twofa-verify-logout-link").addEventListener("click", (e) => {
  e.preventDefault();
  signOut(auth);
});

document.addEventListener("auth:login", (e) => {
  handleAuthLogin(e.detail.user);
});
