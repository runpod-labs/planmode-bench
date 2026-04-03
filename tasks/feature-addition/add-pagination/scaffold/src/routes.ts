import { Router } from "express";
import { users } from "./data.js";

const router = Router();

// GET /users - returns all users
router.get("/users", (req, res) => {
  res.json(users);
});

// GET /users/:id - returns a single user
router.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export { router };
