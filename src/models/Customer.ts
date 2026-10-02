import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import type { CustomerDoc } from "../types/index.js";

// The Session 1 Customer interface, written a second time as a schema.
// TypeScript checks the shape while you type; this checks it when the
// data arrives, which is the only moment that can stop bad data.
const customerSchema = new Schema<CustomerDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
    },
    isActive: { type: Boolean, default: true },
    score: { type: Number, default: 0 },

    // The one field itelect4-project's Customer interface does not have.
    // select: false keeps it out of every query result unless a query
    // asks for it by name -- see the .select("+password") in auth.ts.
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true },
);

// Runs on every .save(). Replaces the plain password with its hash, so
// the plain one is never what gets written.
customerSchema.pre("save", async function (this: CustomerDoc & { isModified: (field: string) => boolean }) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// What this document looks like once it is turned into JSON. Mongo's
// own field is _id; the frontend has been reading .id since Session 1,
// so rename it here rather than change the frontend.
customerSchema.set("toJSON", {
  transform(_doc, ret: Record<string, unknown>) {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export const Customer = model<CustomerDoc>("Customer", customerSchema);