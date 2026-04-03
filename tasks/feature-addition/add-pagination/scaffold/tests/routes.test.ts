import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("GET /users", () => {
  it("should return paginated users with default page and limit", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
    expect(res.body.data.length).toBe(10);
    expect(res.body.pagination.total).toBe(15);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it("should return second page", async () => {
    const res = await request(app).get("/users?page=2&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination.page).toBe(2);
  });

  it("should respect custom limit", async () => {
    const res = await request(app).get("/users?limit=5");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it("should return empty data for out-of-range page", async () => {
    const res = await request(app).get("/users?page=100");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.page).toBe(100);
  });
});

describe("GET /users/:id", () => {
  it("should return a single user", async () => {
    const res = await request(app).get("/users/1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Alice Johnson");
  });

  it("should return 404 for non-existent user", async () => {
    const res = await request(app).get("/users/999");
    expect(res.status).toBe(404);
  });
});
