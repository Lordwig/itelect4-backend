import { Schema, model } from "mongoose";
import type { ProductDoc } from "../types/index.js";

// The third Session 1 interface, written a second time as a schema.
// Products are the one thing this API serves to somebody who is not
// logged in.
const productSchema = new Schema<ProductDoc>({
  // unique here is the reason GET /api/products/Croissant can use
  // findOne and be sure there is nothing else it could have matched.
  name: {
    type: String,
    required: [true, "name is required"],
    unique: true,
    trim: true,
  },

  // An interface can say "a number". Only a schema can say
  // "a number that is not negative".
  price: {
    type: Number,
    required: [true, "price is required"],
    min: [0, "price cannot be negative"],
  },

  category: {
    type: String,
    required: [true, "category is required"],
    trim: true,
  },
});

// Customer and PreOrder rename _id to id because the frontend reads .id.
// ApiProduct on the frontend is Product & { id: string }, so this one
// does the same, and the two fields Mongo added come out.
productSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Product = model<ProductDoc>("Product", productSchema);