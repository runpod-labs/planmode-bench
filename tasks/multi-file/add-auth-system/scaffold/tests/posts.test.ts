import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("GET /posts", () => {
  it("should return all posts", async () => {
    const res = await request(app).get("/posts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  it("should return posts with correct shape", async () => {
    const res = await request(app).get("/posts");
    expect(res.status).toBe(200);
    const post = res.body[0];
    expect(post).toHaveProperty("id");
    expect(post).toHaveProperty("title");
    expect(post).toHaveProperty("content");
    expect(post).toHaveProperty("userId");
    expect(post).toHaveProperty("createdAt");
  });
});

describe("GET /posts/:id", () => {
  it("should return a single post", async () => {
    const res = await request(app).get("/posts/1");
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Getting Started with TypeScript");
    expect(res.body.userId).toBe(1);
  });

  it("should return 404 for non-existent post", async () => {
    const res = await request(app).get("/posts/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });
});

describe("GET /health", () => {
  it("should return ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
