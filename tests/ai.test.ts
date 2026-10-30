import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Replaces the real database connection BEFORE the app is imported.
// app.ts calls connectDB() on every request; on GitHub's computer there
// is no MongoDB to reach, and a test that waited on one would time out
// or fail for a reason that has nothing to do with the code under test.
// vi.mock is hoisted above the imports by Vitest, so this still runs first.
vi.mock("../src/config/db", () => ({
  connectDB: async () => {},
}));

import { app } from "../src/app";

// A real token, signed with the same secret requireAuth verifies with.
// On your laptop that secret comes from .env; in CI it comes from the
// JWT_SECRET repository secret.
function tokenFor(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

// A message long enough to pass the 20-character rule, so that when a
// request is rejected, the reason can only be the token.
const VALID_PROMPT = "Something cold to drink and a pastry, please.";

describe("POST /api/ai", () => {
  it("answers 401 with no token", async () => {
    const res = await request(app).post("/api/ai").send({ prompt: VALID_PROMPT });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("No token. Send Authorization: Bearer <token>");
  });

  it("answers 401 with a token signed with the wrong secret", async () => {
    const forged = jwt.sign({ userId: "u1" }, "not-the-real-secret");
    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${forged}`)
      .send({ prompt: VALID_PROMPT });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token is invalid or has expired");
  });

  it("lets a valid token past requireAuth and stops a short message at the schema", async () => {
    // Too short on purpose: the request is rejected by our own rule, so it
    // never reaches Gemini or the database, and the test costs no quota.
    // A 400 here (not a 401) is the proof the token got through.
    const res = await request(app)
      .post("/api/ai")
      .set("Authorization", `Bearer ${tokenFor("u1")}`)
      .send({ prompt: "Too short" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toEqual([
      "Describe what you feel like ordering in at least 20 characters.",
    ]);
  });
});