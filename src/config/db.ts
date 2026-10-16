import mongoose from "mongoose";

// Holds the one connection ATTEMPT, not a true/false flag. A serverless
// function can be asked for something twice while the first connect is
// still in flight; with a promise stored here, the second request waits
// on the same attempt instead of starting another.
let connection: Promise<typeof mongoose> | null = null;

export function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env and fill it in.",
    );
  }

  // ??= only runs the connect when nothing is stored yet. Every later
  // call gets the same promise back.
  connection ??= mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then((m) => {
      console.log("MongoDB connected:", m.connection.name);
      return m;
    })
    .catch((err: unknown) => {
      // A failed attempt must not be remembered, or every later request
      // would get the same dead promise and never try again.
      connection = null;
      throw err;
    });

  return connection;
}