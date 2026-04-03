import { Router } from "express";
import { posts, nextId } from "../db.js";
import { Post } from "../types.js";

const router = Router();

// GET /posts - list all posts
router.get("/", (req, res) => {
  res.json(posts);
});

// GET /posts/:id - get a single post
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(post);
});

// POST /posts - create a new post
router.post("/", (req, res) => {
  const { title, content, userId } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }
  const newPost: Post = {
    id: nextId(posts),
    title,
    content,
    userId: userId || 1,
    createdAt: new Date().toISOString(),
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// PUT /posts/:id - update a post
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const { title, content } = req.body;
  if (title) posts[index].title = title;
  if (content) posts[index].content = content;
  res.json(posts[index]);
});

// DELETE /posts/:id - delete a post
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const deleted = posts.splice(index, 1);
  res.json(deleted[0]);
});

export { router as postsRouter };
