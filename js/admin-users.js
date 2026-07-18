// Administración de usuarios (solo rol admin): listar todos los usuarios,
// cambiar su rol, y eliminar su documento de datos de la app.
//
// Limitación importante: eliminar aquí borra el documento del usuario en
// Firestore (su rol y sus datos de 2FA) — NO elimina la cuenta de acceso
// (correo/contraseña) de Firebase Authentication. Eso requeriría el SDK de
// administración de Firebase desde un backend con credenciales de servicio,
// algo que este proyecto no usa a propósito (arquitectura sin servidor). Si
// esa persona vuelve a iniciar sesión, la app la tratará como una cuenta
// nueva (rol "cliente", 2FA por configurar de cero).

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { isAdmin } from "./roles.js";
import { currentUser } from "./auth.js";

const statusEl = document.getElementById("admin-users-status");
const contentEl = document.getElementById("admin-users-content");

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function render() {
  if (!isAdmin()) {
    statusEl.textContent = "Acceso restringido: esta sección es solo para administradores.";
    contentEl.innerHTML = "";
    return;
  }

  statusEl.textContent =
    "Nota: eliminar un usuario borra su rol y sus datos de 2FA en la app. " +
    "Su cuenta de acceso (correo/contraseña) sigue existiendo en Firebase " +
    "Authentication — eliminarla por completo requeriría un backend con " +
    "permisos administrativos, que este proyecto no usa.";
  contentEl.innerHTML = "Cargando usuarios...";

  const myUid = currentUser()?.uid;
  const snap = await getDocs(collection(db, "users"));
  const users = [];
  snap.forEach((d) => users.push({ uid: d.id, ...d.data() }));

  contentEl.innerHTML = `
    <table id="admin-users-table">
      <thead><tr><th>Correo</th><th>Rol</th><th>2FA</th><th>Acciones</th></tr></thead>
      <tbody>
        ${users
          .map(
            (u) => `
          <tr data-uid="${u.uid}">
            <td>${escapeHtml(u.email || "(sin correo registrado)")}${u.uid === myUid ? " <em>(tú)</em>" : ""}</td>
            <td>
              <select class="role-select" data-uid="${u.uid}" ${u.uid === myUid ? "disabled" : ""}>
                <option value="cliente" ${u.role === "cliente" ? "selected" : ""}>cliente</option>
                <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
              </select>
            </td>
            <td>${u.totpEnabled ? "Activado" : "Sin configurar"}</td>
            <td>
              <button class="delete-user-btn" data-uid="${u.uid}" ${u.uid === myUid ? "disabled" : ""}>Eliminar</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  contentEl.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", () => handleRoleChange(select.dataset.uid, select.value));
  });
  contentEl.querySelectorAll(".delete-user-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.uid));
  });
}

async function handleRoleChange(uid, newRole) {
  try {
    await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
    render();
  } catch (err) {
    statusEl.textContent = "Error al cambiar el rol: " + err.message;
  }
}

async function handleDelete(uid) {
  if (uid === currentUser()?.uid) return; // defensa extra, el botón ya está deshabilitado
  try {
    await deleteDoc(doc(db, "users", uid));
    render();
  } catch (err) {
    statusEl.textContent = "Error al eliminar el usuario: " + err.message;
  }
}

document.addEventListener("admin-users:show", render);
