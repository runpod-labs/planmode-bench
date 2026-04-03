import express from "express";
import { productRouter } from "./routes/products.js";
import { orderRouter } from "./routes/orders.js";

const app = express();
app.use(express.json());
app.use(productRouter);
app.use(orderRouter);

export { app };
