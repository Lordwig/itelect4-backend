import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/auth.js";
import { productRouter } from "./routes/products.js";
import { preOrderRouter } from "./routes/preorders.js";

// This file builds the app and stops. It never opens a port. server.ts
// opens one on your laptop; on Vercel nothing does, and the platform
// calls this app directly through the default export at the bottom.
export const app = express();

// CORS_ORIGIN holds the frontend's address. Several can be listed,
// separated by commas. Unset means an EMPTY list -- nobody is allowed --
// rather than everybody, so a missing variable fails closed.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Serverless has no "start up, then listen" moment, so each request
// makes sure the database is connected before it goes any further.
// After the first one, connectDB hands back the stored promise at once.
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await connectDB();
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/preorders", preOrderRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
});

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        message: "Validation failed",
        errors: Object.values(err.errors).map((e) => e.message),
      });
      return;
    }

    if (err instanceof mongoose.Error.CastError) {
      res.status(400).json({
        message: `"${err.value}" is not a valid id`,
      });
      return;
    }

    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  },
);

// Vercel looks for this. It is the whole reason the file works there.
export default app;