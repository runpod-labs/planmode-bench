import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("GET /posts/:postId/comments", () => {
  it("should return comments for a post", async () => {
    const res = await request(app).get("/posts/1/comments");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("should return comments with correct shape", async () => {
    const res = await request(app).get("/posts/1/comments");
    expect(res.status).toBe(200);
    const comment = res.body[0];
    expect(comment).toHaveProperty("id");
    expect(comment).toHaveProperty("postId");
    expect(comment).toHaveProperty("userId");
    expect(comment).toHaveProperty("body");
    expect(comment).toHaveProperty("createdAt");
  });

  it("should return 404 for comments on non-existent post", async () => {
    const res = await request(app).get("/posts/999/comments");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found");
  });
});

describe("GET /comments/:id", () => {
  it("should return a single comment", async () => {
    const res = await request(app).get("/comments/1");
    expect(res.status).toBe(200);
    expect(res.body.body).toBe("Great introduction to TypeScript!");
    expect(res.body.postId).toBe(1);
    expect(res.body.userId).toBe(2);
  });

  it("should return 404 for non-existent comment", async () => {
    const res = await request(app).get("/comments/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Comment not found");
  });
});
