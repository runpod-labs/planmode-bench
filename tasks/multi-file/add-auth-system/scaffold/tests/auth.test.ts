import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Auth - Registration", () => {
  it("POST /auth/register should create a new user and return a token", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "newuser",
      email: "newuser@example.com",
      password: "mypassword",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".").length).toBe(3); // JWT has 3 parts
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.username).toBe("newuser");
    expect(res.body.user.email).toBe("newuser@example.com");
    // Should not return the password
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("POST /auth/register should reject duplicate username", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "alice",
      email: "another@example.com",
      password: "password123",
    });
    expect(res.status).toBe(409);
  });

  it("POST /auth/register should reject missing fields", async () => {
    const res = await request(app).post("/auth/register").send({
      username: "incomplete",
    });
    expect(res.status).toBe(400);
  });
});

describe("Auth - Login", () => {
  it("POST /auth/login should return a token for valid credentials", async () => {
    // First register a user with a known password
    await request(app).post("/auth/register").send({
      username: "logintest",
      email: "logintest@example.com",
      password: "testpass123",
    });

    const res = await request(app).post("/auth/login").send({
      username: "logintest",
      password: "testpass123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".").length).toBe(3);
  });

  it("POST /auth/login should return 401 for invalid password", async () => {
    const res = await request(app).post("/auth/login").send({
      username: "logintest",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("POST /auth/login should return 401 for non-existent user", async () => {
    const res = await request(app).post("/auth/login").send({
      username: "nonexistent",
      password: "whatever",
    });
    expect(res.status).toBe(401);
  });
});

describe("Auth - Protected Routes", () => {
  let token: string;

  beforeAll(async () => {
    // Register and get a token
    const res = await request(app).post("/auth/register").send({
      username: "authuser",
      email: "authuser@example.com",
      password: "authpass",
    });
    token = res.body.token;
  });

  it("POST /posts without token should return 401", async () => {
    const res = await request(app).post("/posts").send({
      title: "Unauthorized Post",
      content: "This should fail",
    });
    expect(res.status).toBe(401);
  });

  it("POST /posts with valid token should create a post", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Authenticated Post",
        content: "This should succeed",
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Authenticated Post");
    // The userId should come from the token, not the request body
    expect(res.body).toHaveProperty("userId");
    expect(typeof res.body.userId).toBe("number");
  });

  it("GET /posts should work without auth (public)", async () => {
    const res = await request(app).get("/posts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /posts/:id should work without auth (public)", async () => {
    const res = await request(app).get("/posts/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
  });

  it("PUT /posts/:id without token should return 401", async () => {
    const res = await request(app).put("/posts/1").send({
      title: "Hacked Title",
    });
    expect(res.status).toBe(401);
  });

  it("DELETE /posts/:id without token should return 401", async () => {
    const res = await request(app).delete("/posts/1");
    expect(res.status).toBe(401);
  });
});

describe("Auth - Ownership", () => {
  let aliceToken: string;
  let bobToken: string;
  let alicePostId: number;

  beforeAll(async () => {
    // Register two users
    const aliceRes = await request(app).post("/auth/register").send({
      username: "alice_owner",
      email: "alice_owner@example.com",
      password: "alicepass",
    });
    aliceToken = aliceRes.body.token;

    const bobRes = await request(app).post("/auth/register").send({
      username: "bob_owner",
      email: "bob_owner@example.com",
      password: "bobpass",
    });
    bobToken = bobRes.body.token;

    // Alice creates a post
    const postRes = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({
        title: "Alice's Post",
        content: "Only Alice can modify this",
      });
    alicePostId = postRes.body.id;
  });

  it("owner can update their own post", async () => {
    const res = await request(app)
      .put(`/posts/${alicePostId}`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ title: "Alice's Updated Post" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Alice's Updated Post");
  });

  it("non-owner cannot update someone else's post (403)", async () => {
    const res = await request(app)
      .put(`/posts/${alicePostId}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ title: "Bob tries to edit" });
    expect(res.status).toBe(403);
  });

  it("non-owner cannot delete someone else's post (403)", async () => {
    const res = await request(app)
      .delete(`/posts/${alicePostId}`)
      .set("Authorization", `Bearer ${bobToken}`);
    expect(res.status).toBe(403);
  });

  it("owner can delete their own post", async () => {
    const res = await request(app)
      .delete(`/posts/${alicePostId}`)
      .set("Authorization", `Bearer ${aliceToken}`);
    expect(res.status).toBe(200);
  });
});

describe("Auth - Comment Protection", () => {
  let userToken: string;
  let otherToken: string;
  let commentId: number;

  beforeAll(async () => {
    const userRes = await request(app).post("/auth/register").send({
      username: "commenter1",
      email: "commenter1@example.com",
      password: "pass1",
    });
    userToken = userRes.body.token;

    const otherRes = await request(app).post("/auth/register").send({
      username: "commenter2",
      email: "commenter2@example.com",
      password: "pass2",
    });
    otherToken = otherRes.body.token;

    // Create a comment (on post 1 which exists in seed data)
    const commentRes = await request(app)
      .post("/posts/1/comments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ body: "My comment" });
    commentId = commentRes.body.id;
  });

  it("POST /posts/:postId/comments without token should return 401", async () => {
    const res = await request(app)
      .post("/posts/1/comments")
      .send({ body: "Unauthorized comment" });
    expect(res.status).toBe(401);
  });

  it("GET /posts/:postId/comments should work without auth", async () => {
    const res = await request(app).get("/posts/1/comments");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("non-owner cannot delete someone else's comment (403)", async () => {
    const res = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  it("owner can delete their own comment", async () => {
    const res = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });
});
