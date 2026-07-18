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

function cartDocRef(uid) {
  return doc(db, "carts", uid);
}

async function loadCart(uid) {
  currentUid = uid;
  const snap = await getDoc(cartDocRef(uid));
  items = snap.exists() ? snap.data().items || [] : [];
  updateCartBadge();
}

async function saveCart() {
  if (!currentUid) return;
  await setDoc(cartDocRef(currentUid), { items });
}

function updateCartBadge() {
  cartCountEl.textContent = calculateCount(items);
}

export function getCartItems() {
  return items;
}

export function getCartTotal() {
  return calculateTotal(items);
}

export async function clearCart() {
  items = [];
  await saveCart();
  updateCartBadge();
}

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

itemsEl.addEventListener("click", async (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  const item = items.find((it) => it.id === id);
  if (!item) return;

  if (e.target.classList.contains("qty-plus")) {
    items = changeQuantity(items, id, 1);
  } else if (e.target.classList.contains("qty-minus")) {
    items = changeQuantity(items, id, -1);
  } else if (e.target.classList.contains("remove")) {
    items = removeItem(items, id);
  } else {
    return;
  }
  await saveCart();
  updateCartBadge();
  renderCart();
});

document.getElementById("cart-back-btn").addEventListener("click", () => {
  showView("view-catalog");
});

checkoutBtn.addEventListener("click", () => {
  showView("view-checkout");
  document.dispatchEvent(new CustomEvent("checkout:show"));
});

document.addEventListener("cart:add", async (e) => {
  items = addOrIncrement(items, e.detail.product);
  await saveCart();
  updateCartBadge();
});

document.addEventListener("cart:show", renderCart);

document.addEventListener("auth:login", (e) => {
  loadCart(e.detail.user.uid);
});

document.addEventListener("auth:logout", () => {
  items = [];
  currentUid = null;
  updateCartBadge();
});
