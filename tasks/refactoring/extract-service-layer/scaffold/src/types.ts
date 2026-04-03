export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  userId: number;
  items: { productId: number; quantity: number }[];
}
