import { User, Post, Comment } from "./types.js";

// In-memory database
// NOTE: passwords are stored in plaintext - this needs to be fixed!
export const users: User[] = [
  {
    id: 1,
    username: "alice",
    email: "alice@example.com",
    password: "password123",
  },
  {
    id: 2,
    username: "bob",
    email: "bob@example.com",
    password: "secret456",
  },
  {
    id: 3,
    username: "charlie",
    email: "charlie@example.com",
    password: "letmein789",
  },
];

export const posts: Post[] = [
  {
    id: 1,
    title: "Getting Started with TypeScript",
    content:
      "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.",
    userId: 1,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: 2,
    title: "Express.js Best Practices",
    content:
      "Here are some best practices for building Express.js applications.",
    userId: 1,
    createdAt: "2026-01-20T14:30:00Z",
  },
  {
    id: 3,
    title: "REST API Design",
    content: "Good REST API design is crucial for building scalable applications.",
    userId: 2,
    createdAt: "2026-02-01T09:15:00Z",
  },
  {
    id: 4,
    title: "Testing with Vitest",
    content: "Vitest is a blazing fast unit test framework powered by Vite.",
    userId: 3,
    createdAt: "2026-02-10T16:45:00Z",
  },
];

export const comments: Comment[] = [
  {
    id: 1,
    postId: 1,
    userId: 2,
    body: "Great introduction to TypeScript!",
    createdAt: "2026-01-16T08:00:00Z",
  },
  {
    id: 2,
    postId: 1,
    userId: 3,
    body: "Very helpful, thanks for sharing.",
    createdAt: "2026-01-16T12:30:00Z",
  },
  {
    id: 3,
    postId: 2,
    userId: 2,
    body: "I learned a lot from this post.",
    createdAt: "2026-01-21T10:00:00Z",
  },
  {
    id: 4,
    postId: 3,
    userId: 1,
    body: "Solid advice on API design.",
    createdAt: "2026-02-02T11:20:00Z",
  },
  {
    id: 5,
    postId: 4,
    userId: 1,
    body: "Vitest is amazing for testing!",
    createdAt: "2026-02-11T09:00:00Z",
  },
];

// Helper to get next ID
export function nextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}
