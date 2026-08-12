// Lógica pura del carrito de compras (sin DOM ni Firestore), para poder
// probarla con Jest de forma aislada (ver tests/unit/cart-utils.test.js).
// Cada función recibe el arreglo de items y devuelve un arreglo NUEVO
// (no muta el original), para que sea fácil de razonar y de probar.

// Suma precio * cantidad de todos los productos del carrito.
export function calculateTotal(items) {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

// Suma la cantidad total de unidades en el carrito (para el contador de la barra).
export function calculateCount(items) {
  return items.reduce((sum, it) => sum + it.qty, 0);
}

// Agrega un producto nuevo con cantidad 1, o incrementa en 1 si ya estaba en el carrito.
export function addOrIncrement(items, product) {
  const existing = items.find((it) => it.id === product.id);
  if (existing) {
    return items.map((it) => (it.id === product.id ? { ...it, qty: it.qty + 1 } : it));
  }
  return [...items, { id: product.id, title: product.title, price: product.price, image: product.image, qty: 1 }];
}

// Suma/resta `delta` a la cantidad de un producto; si llega a 0, lo elimina del carrito.
export function changeQuantity(items, id, delta) {
  const updated = items.map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it));
  return updated.filter((it) => it.qty > 0);
}

// Elimina un producto específico del carrito, sin importar su cantidad.
export function removeItem(items, id) {
  return items.filter((it) => it.id !== id);
}
