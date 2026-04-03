import { Router } from "express";
import { products } from "../data.js";

const router = Router();

// GET /products - list all products, optionally filter by category
router.get("/products", (req, res) => {
  const { category, minPrice, maxPrice } = req.query;

  let filtered = [...products];

  if (category && typeof category === "string") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (minPrice && typeof minPrice === "string") {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) {
      filtered = filtered.filter((p) => p.price >= min);
    }
  }

  if (maxPrice && typeof maxPrice === "string") {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      filtered = filtered.filter((p) => p.price <= max);
    }
  }

  // Calculate summary stats
  const totalValue = filtered.reduce((sum, p) => sum + p.price * p.stock, 0);
  const avgPrice =
    filtered.length > 0
      ? filtered.reduce((sum, p) => sum + p.price, 0) / filtered.length
      : 0;

  res.json({
    products: filtered,
    summary: {
      count: filtered.length,
      totalInventoryValue: Math.round(totalValue * 100) / 100,
      averagePrice: Math.round(avgPrice * 100) / 100,
    },
  });
});

// GET /products/:id
router.get("/products/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Calculate if product is low stock
  const isLowStock = product.stock < 10;
  const inventoryValue = Math.round(product.price * product.stock * 100) / 100;

  res.json({
    ...product,
    isLowStock,
    inventoryValue,
  });
});

// PATCH /products/:id/stock - update stock
router.patch("/products/:id/stock", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = products.find((p) => p.id === id);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const { adjustment } = req.body as { adjustment: number };
  if (typeof adjustment !== "number") {
    res.status(400).json({ error: "adjustment must be a number" });
    return;
  }

  const newStock = product.stock + adjustment;
  if (newStock < 0) {
    res.status(400).json({ error: "Insufficient stock" });
    return;
  }

  product.stock = newStock;

  res.json({
    ...product,
    isLowStock: product.stock < 10,
    inventoryValue: Math.round(product.price * product.stock * 100) / 100,
  });
});

export { router as productRouter };
