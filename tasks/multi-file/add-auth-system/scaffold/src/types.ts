export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  body: string;
  createdAt: string;
}
