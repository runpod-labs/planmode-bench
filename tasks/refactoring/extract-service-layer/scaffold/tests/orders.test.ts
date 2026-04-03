import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("GET /orders", () => {
  it("should return all orders with summary", async () => {
    const res = await request(app).get("/orders");
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThanOrEqual(2);
    expect(res.body.summary).toHaveProperty("count");
    expect(res.body.summary).toHaveProperty("totalRevenue");
  });

  it("should filter by status", async () => {
    const res = await request(app).get("/orders?status=confirmed");
    expect(res.status).toBe(200);
    for (const o of res.body.orders) {
      expect(o.status).toBe("confirmed");
    }
  });
});

describe("GET /orders/:id", () => {
  it("should return an order with enriched items", async () => {
    const res = await request(app).get("/orders/1");
    expect(res.status).toBe(200);
    expect(res.body.items[0]).toHaveProperty("productName");
    expect(res.body.items[0].productName).toBe("Laptop");
  });

  it("should return 404 for non-existent order", async () => {
    const res = await request(app).get("/orders/999");
    expect(res.status).toBe(404);
  });
});

describe("POST /orders", () => {
  it("should create a new order", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        userId: 1,
        items: [{ productId: 2, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.total).toBe(29.99);
  });

  it("should reject order with invalid items", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ userId: 1, items: [] });
    expect(res.status).toBe(400);
  });

  it("should reject order for non-existent product", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        userId: 1,
        items: [{ productId: 999, quantity: 1 }],
      });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /orders/:id/status", () => {
  it("should update order status", async () => {
    const res = await request(app)
      .patch("/orders/2/status")
      .send({ status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  });

  it("should reject invalid status transition", async () => {
    const res = await request(app)
      .patch("/orders/1/status")
      .send({ status: "delivered" });
    expect(res.status).toBe(400);
  });
});
