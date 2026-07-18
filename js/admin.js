// Mantenimiento de catálogo (CRUD), solo accesible para el rol "admin".
// Usa los endpoints de escritura de FakeStoreAPI (POST/PUT/DELETE). Nota
// importante: FakeStoreAPI es una API simulada de solo demostración — acepta
// estas peticiones y responde éxito, pero NO persiste los cambios en su
// servidor real. Por eso, además de llamarla, reflejamos el cambio en el
// catálogo local (ver js/catalog.js) para que la demo se vea consistente
// durante la sesión del navegador.

import { isAdmin } from "./roles.js";
import { getAllProducts, upsertLocalProduct, removeLocalProduct } from "./catalog.js";

const statusEl = document.getElementById("admin-status");
const contentEl = document.getElementById("admin-content");

const API_BASE = "https://fakestoreapi.com/products";

let editingId = null;

function emptyForm() {
  return { title: "", price: "", description: "", image: "", category: "" };
}

function render() {
  if (!isAdmin()) {
    statusEl.textContent = "Acceso restringido: esta sección es solo para administradores.";
    contentEl.innerHTML = "";
    return;
  }
  statusEl.textContent =
    "Nota: FakeStoreAPI no persiste los cambios en su servidor; se reflejan solo en esta sesión.";

  const products = getAllProducts();
  const editing = editingId != null ? products.find((p) => p.id === editingId) : null;
  const formData = editing || emptyForm();

  contentEl.innerHTML = `
    <form id="admin-form" class="admin-form">
      <h3>${editing ? "Editar producto #" + editing.id : "Nuevo producto"}</h3>
      <label>Título
        <input type="text" id="admin-title" required value="${escapeAttr(formData.title)}" />
      </label>
      <label>Precio
        <input type="number" id="admin-price" step="0.01" min="0" required value="${formData.price}" />
      </label>
      <label>Categoría
        <input type="text" id="admin-category" value="${escapeAttr(formData.category)}" />
      </label>
      <label>Imagen (URL)
        <input type="text" id="admin-image" value="${escapeAttr(formData.image)}" />
      </label>
      <label>Descripción
        <input type="text" id="admin-description" value="${escapeAttr(formData.description)}" />
      </label>
      <button type="submit">${editing ? "Guardar cambios" : "Crear producto"}</button>
      ${editing ? '<button type="button" id="admin-cancel-edit">Cancelar edición</button>' : ""}
    </form>
    <table id="admin-table">
      <thead><tr><th>ID</th><th>Título</th><th>Precio</th><th>Acciones</th></tr></thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td>${p.id}</td>
            <td>${escapeHtml(p.title)}</td>
            <td>$${Number(p.price).toFixed(2)}</td>
            <td>
              <button class="edit-btn" data-id="${p.id}">Editar</button>
              <button class="delete-btn" data-id="${p.id}">Eliminar</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  document.getElementById("admin-form").addEventListener("submit", handleSubmit);
  const cancelBtn = document.getElementById("admin-cancel-edit");
  if (cancelBtn) cancelBtn.addEventListener("click", () => { editingId = null; render(); });

  contentEl.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingId = Number(btn.dataset.id);
      render();
    });
  });
  contentEl.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str ?? "");
}

async function handleSubmit(e) {
  e.preventDefault();
  const body = {
    title: document.getElementById("admin-title").value.trim(),
    price: Number(document.getElementById("admin-price").value),
    category: document.getElementById("admin-category").value.trim(),
    image: document.getElementById("admin-image").value.trim(),
    description: document.getElementById("admin-description").value.trim(),
  };

  try {
    if (editingId != null) {
      const res = await fetch(`${API_BASE}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("FakeStoreAPI respondió " + res.status);
      upsertLocalProduct({ id: editingId, ...body });
      editingId = null;
    } else {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("FakeStoreAPI respondió " + res.status);
      const created = await res.json();
      // FakeStoreAPI a veces reutiliza el mismo id (ej. 21) en cada POST de
      // prueba; si ya existe localmente, generamos uno temporal único.
      const products = getAllProducts();
      const id = products.some((p) => p.id === created.id)
        ? Math.max(...products.map((p) => p.id)) + 1
        : created.id;
      upsertLocalProduct({ id, ...body });
    }
    render();
  } catch (err) {
    statusEl.textContent = "Error al guardar el producto: " + err.message;
  }
}

async function handleDelete(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("FakeStoreAPI respondió " + res.status);
    removeLocalProduct(id);
    if (editingId === id) editingId = null;
    render();
  } catch (err) {
    statusEl.textContent = "Error al eliminar el producto: " + err.message;
  }
}

document.addEventListener("admin:show", () => {
  editingId = null;
  render();
  showCatalogTab();
});

// --- Pestañas del panel de administración (Catálogo / Usuarios) ---

const tabCatalogBtn = document.getElementById("admin-tab-catalog");
const tabUsersBtn = document.getElementById("admin-tab-users");
const panelCatalog = document.getElementById("admin-panel-catalog");
const panelUsers = document.getElementById("admin-panel-users");

function showCatalogTab() {
  tabCatalogBtn.classList.add("active");
  tabUsersBtn.classList.remove("active");
  panelCatalog.classList.remove("hidden");
  panelUsers.classList.add("hidden");
}

function showUsersTab() {
  tabCatalogBtn.classList.remove("active");
  tabUsersBtn.classList.add("active");
  panelCatalog.classList.add("hidden");
  panelUsers.classList.remove("hidden");
  document.dispatchEvent(new CustomEvent("admin-users:show"));
}

tabCatalogBtn.addEventListener("click", showCatalogTab);
tabUsersBtn.addEventListener("click", showUsersTab);
