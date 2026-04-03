import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("GET /products", () => {
  it("should return all products with summary", async () => {
    const res = await request(app).get("/products");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(5);
    expect(res.body.summary).toHaveProperty("count");
    expect(res.body.summary).toHaveProperty("totalInventoryValue");
    expect(res.body.summary).toHaveProperty("averagePrice");
  });

  it("should filter by category", async () => {
    const res = await request(app).get("/products?category=furniture");
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(2);
    expect(res.body.products.every((p: any) => p.category === "furniture")).toBe(
      true
    );
  });

  it("should filter by price range", async () => {
    const res = await request(app).get("/products?minPrice=100&maxPrice=500");
    expect(res.status).toBe(200);
    for (const p of res.body.products) {
      expect(p.price).toBeGreaterThanOrEqual(100);
      expect(p.price).toBeLessThanOrEqual(500);
    }
  });
});

describe("GET /products/:id", () => {
  it("should return a product with extra fields", async () => {
    const res = await request(app).get("/products/1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Laptop");
    expect(res.body).toHaveProperty("isLowStock");
    expect(res.body).toHaveProperty("inventoryValue");
  });

  it("should return 404 for non-existent product", async () => {
    const res = await request(app).get("/products/999");
    expect(res.status).toBe(404);
  });
});
