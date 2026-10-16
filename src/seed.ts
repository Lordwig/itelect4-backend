import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Product } from "./models/Product.js";
import { PRODUCTS } from "./data/products.js";

// npm run seed. Run it once after the database is created, and again
// after anything that empties it. Nothing else in the project writes
// a product.
async function seed() {
  await connectDB();

  for (const product of PRODUCTS) {
    // upsert: update the row with this name, or insert it if there is
    // none. Running this a second time leaves four products, not eight.
    await Product.updateOne({ name: product.name }, product, { upsert: true });
  }

  console.log(`${PRODUCTS.length} products in ${mongoose.connection.name}`);

  // Without this the script never ends: the connection is an open
  // socket, and Node keeps running while one is still open.
  await mongoose.disconnect();
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});