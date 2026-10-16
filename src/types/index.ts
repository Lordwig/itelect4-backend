import type { Types } from "mongoose";

// FROM SESSION 1: the interfaces, copied from itelect4-project's
// src/types/index.ts. They are the reason this backend has the shape it
// has: the schemas in src/models/ are these interfaces again, written a
// second time in a form the database can enforce.

export interface Customer {
  id: number;
  name: string;
  email: string;
  role: "customer" | "staff" | "admin";
  isActive: boolean;
  points: number;
}

export interface Product {
  name: string;
  price: number;
  category: string;
}

export interface PreOrder {
  id: number;
  customerId: number;
  productName: string;
  quantity: number;
  pickupTime: string;
  status: string;
  orderedAt: Date;
}

// ---------------------------------------------------------------------
// What the database actually stores.
//
// Session 1 wrote `id: number` because there was no database yet -- the
// mock array in mockData.ts numbered its own rows. MongoDB numbers rows
// itself, with a 24-character hex string, so every id here is a string.
//
// Rather than rewrite the interface, both types below are DERIVED from
// it with Omit -- the utility type from Session 2. PreOrder stays the
// single source of truth: add a field there and these inherit it.
// ---------------------------------------------------------------------

export type CustomerDoc = Omit<Customer, "id"> & {
  password: string;
};

// customerId is an ObjectId, not a string. An ObjectId is an object that
// PRINTS as 24 hex characters -- it only becomes a real string when the
// document is turned into JSON. Typing it as string here compiles until
// the schema declares it, and then fails on every field at once.
export type PreOrderDoc = Omit<PreOrder, "id" | "customerId"> & {
  customerId: Types.ObjectId;
};

// The body a client sends to create one. No id, and no customerId -- the
// server reads that off the token instead of trusting the request.
export type NewPreOrderBody = Pick<
  PreOrder,
  "productName" | "quantity" | "pickupTime"
>;

// ===== GT4 PART 2: the third interface gets its own database type =====
// Omit and Pick both produce a MAPPED type, and an interface is not one.
// The toJSON transform in Product.ts takes Record<string, unknown>;
// TypeScript hands it a mapped type happily and refuses an interface.
export type ProductDoc = Pick<Product, "name" | "price" | "category">;