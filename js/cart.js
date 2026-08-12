import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showView } from "./app.js";
import { calculateTotal, calculateCount, addOrIncrement, changeQuantity, removeItem } from "./lib/cart-utils.js";

let items = []; // [{ id, title, price, image, qty }]
let currentUid = null;

const itemsEl = document.getElementById("cart-items");
const totalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("cart-checkout-btn");
const cartCountEl = document.getElementById("nav-cart-count");

// Referencia al documento de Firestore donde se guarda el carrito de un usuario.
function cartDocRef(uid) {
  return doc(db, "carts", uid);
}

// Carga el carrito guardado del usuario al iniciar sesión.
async function loadCart(uid) {
  currentUid = uid;
  const snap = await getDoc(cartDocRef(uid));
  items = snap.exists() ? snap.data().items || [] : [];
  updateCartBadge();
}

// Guarda el estado actual del carrito en Firestore.
async function saveCart() {
  if (!currentUid) return;
  await setDoc(cartDocRef(currentUid), { items });
}

// Actualiza el contador de productos en la barra de navegación.
function updateCartBadge() {
  cartCountEl.textContent = calculateCount(items);
}

// Expone los productos del carrito a otros módulos (checkout.js).
export function getCartItems() {
  return items;
}

// Expone el total del carrito a otros módulos (checkout.js).
export function getCartTotal() {
  return calculateTotal(items);
}

// Vacía el carrito (se usa al completar una compra).
export async function clearCart() {
  items = [];
  await saveCart();
  updateCartBadge();
}

// Dibuja las filas del carrito (nombre, cantidad, precio, botones) en la vista.
function renderCart() {
  itemsEl.innerHTML = "";
  if (items.length === 0) {
    itemsEl.innerHTML = "<p class=\"cart-empty\">El carrito está vacío.</p>";
  }
  for (const it of items) {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <span class="cart-item-name">${it.title}</span>
      <span class="qty-controls">
        <button class="qty-minus" data-id="${it.id}" aria-label="Disminuir cantidad">−</button>
        <span class="qty-value">${it.qty}</span>
        <button class="qty-plus" data-id="${it.id}" aria-label="Aumentar cantidad">+</button>
      </span>
      <span class="cart-item-price">$${(it.price * it.qty).toFixed(2)}</span>
      <button class="remove" data-id="${it.id}">Quitar</button>
    `;
    itemsEl.appendChild(row);
  }
  totalEl.textContent = "$" + calculateTotal(items).toFixed(2);
  checkoutBtn.disabled = items.length === 0;
}

// Maneja los clics en los botones +/-/Quitar de cada fila del carrito.
itemsEl.addEventListener("click", async (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  const item = items.find((it) => it.id === id);
  if (!item) return;

  let removedItem = null;
  if (e.target.classList.contains("qty-plus")) {
    items = changeQuantity(items, id, 1);
  } else if (e.target.classList.contains("qty-minus")) {
    items = changeQuantity(items, id, -1);
    // Decrementar hasta 0 elimina el producto del carrito (ver
    // lib/cart-utils.js), así que cuenta como quitarlo para la bitácora.
    if (item.qty === 1) removedItem = item;
  } else if (e.target.classList.contains("remove")) {
    items = removeItem(items, id);
    removedItem = item;
  } else {
    return;
  }
  await saveCart();
  updateCartBadge();
  renderCart();

  if (removedItem) {
    document.dispatchEvent(
      new CustomEvent("carrito:producto_eliminado", { detail: { uid: currentUid, product: removedItem } })
    );
  }
});

// Botón "Seguir comprando": vuelve al catálogo.
document.getElementById("cart-back-btn").addEventListener("click", () => {
  showView("view-catalog");
});

// Botón "Proceder al pago": avanza a la pantalla de checkout.
checkoutBtn.addEventListener("click", () => {
  showView("view-checkout");
  document.dispatchEvent(new CustomEvent("checkout:show"));
});

// Agrega un producto al carrito (o incrementa su cantidad si ya estaba).
document.addEventListener("cart:add", async (e) => {
  items = addOrIncrement(items, e.detail.product);
  await saveCart();
  updateCartBadge();
  document.dispatchEvent(
    new CustomEvent("carrito:producto_agregado", { detail: { uid: currentUid, product: e.detail.product } })
  );
});

// Dibuja el carrito al abrir esa vista.
document.addEventListener("cart:show", renderCart);

// Carga el carrito del usuario al iniciar sesión.
document.addEventListener("auth:login", (e) => {
  loadCart(e.detail.user.uid);
});

// Limpia el carrito en memoria al cerrar sesión (no lo borra de Firestore).
document.addEventListener("auth:logout", () => {
  items = [];
  currentUid = null;
  updateCartBadge();
});
