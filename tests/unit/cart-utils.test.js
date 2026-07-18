import {
  calculateTotal,
  calculateCount,
  addOrIncrement,
  changeQuantity,
  removeItem,
} from "../../js/lib/cart-utils.js";

const productA = { id: 1, title: "Mochila", price: 100, image: "a.png" };
const productB = { id: 2, title: "Camiseta", price: 20, image: "b.png" };

describe("calculateTotal / calculateCount", () => {
  test("CP-U08: el carrito vacío suma 0 y tiene 0 unidades", () => {
    expect(calculateTotal([])).toBe(0);
    expect(calculateCount([])).toBe(0);
  });

  test("CP-U09: suma el total considerando precio y cantidad", () => {
    const items = [
      { ...productA, qty: 2 },
      { ...productB, qty: 3 },
    ];
    expect(calculateTotal(items)).toBe(260); // 2*100 + 3*20
    expect(calculateCount(items)).toBe(5);
  });
});

describe("addOrIncrement", () => {
  test("CP-U10: agrega un producto nuevo con cantidad 1", () => {
    const result = addOrIncrement([], productA);
    expect(result).toEqual([{ id: 1, title: "Mochila", price: 100, image: "a.png", qty: 1 }]);
  });

  test("CP-U11: incrementa la cantidad si el producto ya está en el carrito", () => {
    const initial = [{ id: 1, title: "Mochila", price: 100, image: "a.png", qty: 1 }];
    const result = addOrIncrement(initial, productA);
    expect(result).toEqual([{ id: 1, title: "Mochila", price: 100, image: "a.png", qty: 2 }]);
  });

  test("CP-U12: no muta el arreglo original", () => {
    const initial = [{ id: 1, title: "Mochila", price: 100, image: "a.png", qty: 1 }];
    addOrIncrement(initial, productA);
    expect(initial[0].qty).toBe(1);
  });
});

describe("changeQuantity", () => {
  const initial = [{ id: 1, title: "Mochila", price: 100, image: "a.png", qty: 2 }];

  test("CP-U13: incrementa la cantidad en +1", () => {
    const result = changeQuantity(initial, 1, 1);
    expect(result[0].qty).toBe(3);
  });

  test("CP-U14: decrementa la cantidad en -1", () => {
    const result = changeQuantity(initial, 1, -1);
    expect(result[0].qty).toBe(1);
  });

  test("CP-U15: elimina el producto si la cantidad llega a 0", () => {
    const oneItem = [{ id: 1, title: "Mochila", price: 100, image: "a.png", qty: 1 }];
    const result = changeQuantity(oneItem, 1, -1);
    expect(result).toEqual([]);
  });
});

describe("removeItem", () => {
  test("CP-U16: elimina el producto indicado y deja el resto intacto", () => {
    const items = [
      { ...productA, qty: 1 },
      { ...productB, qty: 1 },
    ];
    const result = removeItem(items, 1);
    expect(result).toEqual([{ ...productB, qty: 1 }]);
  });
});
