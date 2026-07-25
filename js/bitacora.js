import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { currentUser } from "./auth.js";
import { isAdmin } from "./roles.js";

const bodyEl = document.getElementById("bitacora-body");
const pickerEl = document.getElementById("bitacora-user-picker");
const selectEl = document.getElementById("bitacora-user-select");

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function logEvent(uid, evento, detalle) {
  if (!uid) return;
  try {
    await addDoc(collection(db, "bitacora"), {
      uid,
      evento,
      detalle,
      fecha: serverTimestamp(),
    });
  } catch (err) {
    // No dejamos que un fallo al registrar la bitácora (ej. un reintento
    // duplicado de red) tumbe el resto de la app: es un registro de mejor
    // esfuerzo, no una operación crítica para el usuario.
    console.warn("No se pudo registrar el evento en la bitácora:", err.message);
  }
}

async function renderBitacora(uid) {
  bodyEl.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>";
  try {
    const q = query(
      collection(db, "bitacora"),
      where("uid", "==", uid),
      orderBy("fecha", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      bodyEl.innerHTML = "<tr><td colspan='3'>Sin eventos registrados todavía.</td></tr>";
      return;
    }
    bodyEl.innerHTML = "";
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const fecha = d.fecha?.toDate ? d.fecha.toDate().toLocaleString() : "—";
      const row = document.createElement("tr");
      row.innerHTML = `<td>${fecha}</td><td>${d.evento}</td><td>${d.detalle}</td>`;
      bodyEl.appendChild(row);
    });
  } catch (err) {
    bodyEl.innerHTML = `<tr><td colspan='3'>No se pudo cargar la bitácora: ${err.message}</td></tr>`;
  }
}

document.addEventListener("auth:login", (e) => {
  logEvent(e.detail.user.uid, "login", `Inicio de sesión de ${e.detail.user.email}`);
});

document.addEventListener("order:completed", (e) => {
  const { order, user } = e.detail;
  if (!user) return;
  const motivo = order.motivo ? ` (motivo: ${order.motivo})` : "";
  logEvent(
    user.uid,
    order.status === "rechazada" ? "compra_rechazada" : "compra",
    `Pedido por $${order.total.toFixed(2)} (${order.items.length} producto(s)), estado: ${order.status}${motivo}`
  );
});

async function setupUserPicker(myUid) {
  const snap = await getDocs(collection(db, "users"));
  const users = [];
  snap.forEach((d) => users.push({ uid: d.id, ...d.data() }));

  selectEl.innerHTML = users
    .map(
      (u) =>
        `<option value="${u.uid}">${escapeHtml(u.email || u.uid)}${u.uid === myUid ? " (tú)" : ""}</option>`
    )
    .join("");
  selectEl.value = myUid;
  pickerEl.classList.remove("hidden");
}

document.addEventListener("bitacora:show", async () => {
  const user = currentUser();
  if (!user) return;

  if (isAdmin()) {
    await setupUserPicker(user.uid);
    renderBitacora(selectEl.value);
  } else {
    pickerEl.classList.add("hidden");
    renderBitacora(user.uid);
  }
});

selectEl.addEventListener("change", () => {
  renderBitacora(selectEl.value);
});
