import type { Product, Order } from "./types.js";

export const products: Product[] = [
  { id: 1, name: "Laptop", price: 999.99, stock: 50, category: "electronics" },
  { id: 2, name: "Mouse", price: 29.99, stock: 200, category: "electronics" },
  { id: 3, name: "Keyboard", price: 79.99, stock: 150, category: "electronics" },
  { id: 4, name: "Desk", price: 299.99, stock: 30, category: "furniture" },
  { id: 5, name: "Chair", price: 199.99, stock: 40, category: "furniture" },
];

export const orders: Order[] = [
  {
    id: 1,
    userId: 1,
    items: [{ productId: 1, quantity: 1, price: 999.99 }],
    total: 999.99,
    status: "confirmed",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: 2,
    userId: 2,
    items: [
      { productId: 2, quantity: 2, price: 29.99 },
      { productId: 3, quantity: 1, price: 79.99 },
    ],
    total: 139.97,
    status: "pending",
    createdAt: "2026-03-20T14:30:00Z",
  },
];

let nextOrderId = 3;

export function getNextOrderId(): number {
  return nextOrderId++;
}
