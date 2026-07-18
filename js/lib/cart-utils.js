// Lógica pura del carrito de compras (sin DOM ni Firestore), para poder
// probarla con Jest de forma aislada (ver tests/unit/cart-utils.test.js).
// Cada función recibe el arreglo de items y devuelve un arreglo NUEVO
// (no muta el original), para que sea fácil de razonar y de probar.

export function calculateTotal(items) {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

export function calculateCount(items) {
  return items.reduce((sum, it) => sum + it.qty, 0);
}

export function addOrIncrement(items, product) {
  const existing = items.find((it) => it.id === product.id);
  if (existing) {
    return items.map((it) => (it.id === product.id ? { ...it, qty: it.qty + 1 } : it));
  }
  return [...items, { id: product.id, title: product.title, price: product.price, image: product.image, qty: 1 }];
}

export function changeQuantity(items, id, delta) {
  const updated = items.map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it));
  return updated.filter((it) => it.qty > 0);
}

export function removeItem(items, id) {
  return items.filter((it) => it.id !== id);
}
