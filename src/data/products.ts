import type { ProductDoc } from "../types/index.js";

// The four products db.json held in itelect4-project, word for word.
// They are reference data: nobody creates a product through the API, so
// they live here and go into the database once, from src/seed.ts.
export const PRODUCTS: ProductDoc[] = [
  { name: "Iced Coffee", price: 120, category: "Beverage" },
  { name: "Croissant", price: 95, category: "Pastry" },
  { name: "Matcha Latte", price: 150, category: "Beverage" },
  { name: "Ham & Cheese Sandwich", price: 135, category: "Food" },
];