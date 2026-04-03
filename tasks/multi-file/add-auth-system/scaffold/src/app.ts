import express from "express";
import { logger } from "./middleware/logger.js";
import { postsRouter } from "./routes/posts.js";
import { commentsRouter } from "./routes/comments.js";

const app = express();

app.use(express.json());
app.use(logger);

// Routes
app.use("/posts", postsRouter);
app.use(commentsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export { app };
