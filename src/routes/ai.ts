import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "@google/genai";
import { requireAuth } from "../middleware/auth.js";
import { aiRequestSchema } from "../schemas/suggestion.js";
import { suggestOrder, AiReplyError } from "../ai/gemini.js";
import { Product } from "../models/Product.js";

export const aiRouter = Router();

// Private, like pre-orders. Every call spends YOUR Gemini quota, so
// an anonymous visitor must not be able to make one.
aiRouter.use(requireAuth);

// Five requests a minute per account. It sits below requireAuth, so
// req.userId exists by the time the limiter reads it -- and the limit
// follows the account, not the network the request came from. A
// whole classroom shares one Wi-Fi address; counting by address
// would make 50 students share 5 requests.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req: Request) => req.userId!,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Five suggestions a minute is the limit. Try again shortly.",
  },
});

aiRouter.use(aiLimiter);

// POST /api/ai
aiRouter.post("/", async (req: Request, res: Response) => {
  // safeParse, not parse: it returns the problem instead of throwing
  // it, so the 400 is written here, next to the rule it reports.
  const parsed = aiRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.issues.map((issue) => issue.message),
    });
    return;
  }

  try {
    // The model only knows what it is handed. The menu comes out of
    // the database on every request, so a product added tomorrow can
    // be suggested tomorrow, with no change to the prompt.
    const products = await Product.find().sort({ name: 1 });
    const menu = products.map((p) => ({
      name: p.name,
      price: p.price,
      category: p.category,
    }));

    const suggestion = await suggestOrder(parsed.data.prompt, menu);
    res.json(suggestion);
  } catch (err) {
    // 429 from Gemini means the quota of the Google project behind
    // GEMINI_API_KEY is used up -- not this API's own limit above.
    if (err instanceof ApiError && err.status === 429) {
      res.status(429).json({
        message: "The AI quota is used up for now. Try again later.",
      });
      return;
    }

    // Gemini refused, failed, or answered with something unusable.
    // Log the real reason for Vercel's Runtime Logs; the browser
    // gets a sentence and none of Google's error text.
    if (err instanceof ApiError || err instanceof AiReplyError) {
      console.error(err);
      res.status(502).json({
        message: "The AI service did not answer properly. Try again.",
      });
      return;
    }

    // Anything else is a bug in this app: app.ts's error handler.
    throw err;
  }
});