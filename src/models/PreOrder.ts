import { Schema, model } from "mongoose";
import type { PreOrderDoc } from "../types/index.js";

const preOrderSchema = new Schema<PreOrderDoc>({
  // Not a number any more. This holds the _id of a Customer document, and
  // ref tells Mongoose which collection that id points into.
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  // Rule 1: required
  productName: {
    type: String,
    required: [true, "productName is required"],
    trim: true,
  },

  // Rule 2: min/max -- an interface can say "a number", but only a
  // schema can say "a number between 1 and 10".
  quantity: {
    type: Number,
    required: [true, "quantity is required"],
    min: [1, "Order at least 1 item."],
    max: [10, "Max 10 per pre-order -- contact staff for bulk orders."],
  },

  pickupTime: {
    type: String,
    required: [true, "pickupTime is required"],
  },

  // Rule 3: enum -- the same idea as GT3's status field, now enforced
  // here as well. The browser check was a courtesy; this one is the rule.
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Ready", "Completed"],
    default: "Pending",
  },

  orderedAt: { type: Date, default: Date.now },
});

// FROM GT3 PART 2: ApiPreOrder in itelect4-project's src/types/index.ts
// exists because json-server returned string ids and ISO date strings
// instead of the number and Date that Session 1 declared. MongoDB does
// the same thing. This transform closes that gap, so the frontend keeps
// reading .id exactly as it has since Session 1.
preOrderSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PreOrder = model<PreOrderDoc>("PreOrder", preOrderSchema);