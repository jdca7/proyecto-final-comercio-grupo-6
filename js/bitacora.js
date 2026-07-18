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

const bodyEl = document.getElementById("bitacora-body");

async function logEvent(uid, evento, detalle) {
  if (!uid) return;
  await addDoc(collection(db, "bitacora"), {
    uid,
    evento,
    detalle,
    fecha: serverTimestamp(),
  });
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

document.addEventListener("bitacora:show", () => {
  const user = currentUser();
  if (user) renderBitacora(user.uid);
});
