import { Router } from "express";
import { orders, products, getNextOrderId } from "../data.js";
import type { CreateOrderInput, OrderItem } from "../types.js";

const router = Router();

// GET /orders - list orders, optionally filter by userId or status
router.get("/orders", (req, res) => {
  const { userId, status } = req.query;

  let filtered = [...orders];

  if (userId && typeof userId === "string") {
    const uid = parseInt(userId, 10);
    if (!isNaN(uid)) {
      filtered = filtered.filter((o) => o.userId === uid);
    }
  }

  if (status && typeof status === "string") {
    filtered = filtered.filter((o) => o.status === status);
  }

  // Calculate summary
  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);

  res.json({
    orders: filtered,
    summary: {
      count: filtered.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
  });
});

// GET /orders/:id
router.get("/orders/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Enrich order items with product names
  const enrichedItems = order.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      productName: product?.name ?? "Unknown",
    };
  });

  res.json({
    ...order,
    items: enrichedItems,
  });
});

// POST /orders - create a new order
router.post("/orders", (req, res) => {
  const input = req.body as CreateOrderInput;

  if (!input.userId || !input.items || !Array.isArray(input.items)) {
    res.status(400).json({ error: "userId and items are required" });
    return;
  }

  if (input.items.length === 0) {
    res.status(400).json({ error: "Order must have at least one item" });
    return;
  }

  // Validate items and calculate totals
  const orderItems: OrderItem[] = [];
  let total = 0;

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }

    if (item.quantity <= 0) {
      res.status(400).json({ error: "Quantity must be positive" });
      return;
    }

    if (product.stock < item.quantity) {
      res
        .status(400)
        .json({ error: `Insufficient stock for ${product.name}` });
      return;
    }

    // Deduct stock
    product.stock -= item.quantity;

    const itemTotal = product.price * item.quantity;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
    });
    total += itemTotal;
  }

  const order = {
    id: getNextOrderId(),
    userId: input.userId,
    items: orderItems,
    total: Math.round(total * 100) / 100,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  res.status(201).json(order);
});

// PATCH /orders/:id/status - update order status
router.patch("/orders/:id/status", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const { status } = req.body as { status: string };
  const validStatuses = ["pending", "confirmed", "shipped", "delivered"];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  // Validate status transitions
  const transitions: Record<string, string[]> = {
    pending: ["confirmed"],
    confirmed: ["shipped"],
    shipped: ["delivered"],
    delivered: [],
  };

  if (!transitions[order.status]?.includes(status)) {
    res.status(400).json({
      error: `Cannot transition from ${order.status} to ${status}`,
    });
    return;
  }

  order.status = status as typeof order.status;

  res.json(order);
});

export { router as orderRouter };
