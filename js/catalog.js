// Catálogo de productos consumido desde FakeStoreAPI. Los clientes solo
// pueden verlo/buscarlo; el mantenimiento (crear/editar/eliminar) está
// disponible únicamente para el rol admin, ver js/admin.js.

let allProducts = [];

const grid = document.getElementById("catalog-grid");
const statusEl = document.getElementById("catalog-status");
const searchInput = document.getElementById("catalog-search");

export function getAllProducts() {
  return allProducts;
}

// FakeStoreAPI es una API simulada: acepta POST/PUT/DELETE y responde éxito,
// pero no persiste los cambios en su servidor. Por eso además de llamarla,
// reflejamos el cambio localmente para que la demo se vea consistente
// durante la sesión (ver js/admin.js).
export function upsertLocalProduct(product) {
  const idx = allProducts.findIndex((p) => p.id === product.id);
  if (idx >= 0) allProducts[idx] = product;
  else allProducts.push(product);
  renderProducts(currentFilter());
}

export function removeLocalProduct(id) {
  allProducts = allProducts.filter((p) => p.id !== id);
  renderProducts(currentFilter());
}

function currentFilter() {
  const term = searchInput.value.trim().toLowerCase();
  return term ? allProducts.filter((p) => p.title.toLowerCase().includes(term)) : allProducts;
}

async function loadProducts() {
  statusEl.textContent = "Cargando productos...";
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    if (!res.ok) throw new Error("Respuesta no válida de FakeStoreAPI");
    allProducts = await res.json();
    statusEl.textContent = "";
    renderProducts(allProducts);
  } catch (err) {
    statusEl.textContent = "No se pudo cargar el catálogo: " + err.message;
  }
}

function renderProducts(products) {
  grid.innerHTML = "";
  if (products.length === 0) {
    grid.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }
  for (const p of products) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}" loading="lazy" />
      <h3>${p.title}</h3>
      <span class="price">$${p.price.toFixed(2)}</span>
      <button data-id="${p.id}">Agregar al carrito</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("cart:add", { detail: { product: p } }));
    });
    grid.appendChild(card);
  }
}

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = term
    ? allProducts.filter((p) => p.title.toLowerCase().includes(term))
    : allProducts;
  renderProducts(filtered);
});

document.addEventListener("auth:login", loadProducts);
