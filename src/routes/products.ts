import { Router, type Request, type Response } from "express";
import { Product } from "../models/Product.js";

export const productRouter = Router();

// There is no requireAuth line in this file, and that is the point.
// preorders.ts puts one at the top so every route below it is private;
// the product list is what the app shows before anybody has logged in,
// so these two are public on purpose.

// GET /api/products
productRouter.get("/", async (_req: Request, res: Response) => {
  const products = await Product.find().sort({ name: 1 });
  res.json(products);
});

interface NameParam {
  name: string;
}

// GET /api/products/Croissant
productRouter.get("/:name", async (req: Request<NameParam>, res: Response) => {
  // GT3 asked json-server for /products?name=Croissant and read
  // matches[0], because json-server has no route for a single row. A
  // real API can have one, so the frontend stops unwrapping an array
  // that only ever had one thing in it.
  // Express has already decoded %20 and %26 in req.params.name.
  const product = await Product.findOne({ name: req.params.name });

  if (!product) {
    res.status(404).json({
      message: `No product with name "${req.params.name}"`,
    });
    return;
  }

  res.json(product);
});