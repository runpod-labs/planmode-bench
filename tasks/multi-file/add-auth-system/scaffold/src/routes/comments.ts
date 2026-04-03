import { Router } from "express";
import { comments, posts, nextId } from "../db.js";
import { Comment } from "../types.js";

const router = Router();

// GET /posts/:postId/comments - list all comments for a post
router.get("/posts/:postId/comments", (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const postComments = comments.filter((c) => c.postId === postId);
  res.json(postComments);
});

// GET /comments/:id - get a single comment
router.get("/comments/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const comment = comments.find((c) => c.id === id);
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  res.json(comment);
});

// POST /posts/:postId/comments - create a comment on a post
router.post("/posts/:postId/comments", (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const { body, userId } = req.body;
  if (!body) {
    res.status(400).json({ error: "body is required" });
    return;
  }
  const newComment: Comment = {
    id: nextId(comments),
    postId,
    userId: userId || 1,
    body,
    createdAt: new Date().toISOString(),
  };
  comments.push(newComment);
  res.status(201).json(newComment);
});

// PUT /comments/:id - update a comment
router.put("/comments/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  const { body } = req.body;
  if (body) comments[index].body = body;
  res.json(comments[index]);
});

// DELETE /comments/:id - delete a comment
router.delete("/comments/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  const deleted = comments.splice(index, 1);
  res.json(deleted[0]);
});

export { router as commentsRouter };
