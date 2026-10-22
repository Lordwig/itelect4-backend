import { GoogleGenAI, type Content } from "@google/genai";
import { MODEL, SYSTEM_PROMPT, EXAMPLES, EXAMPLE_MENU, wrap } from "./prompt.js";
import {
  suggestionSchema,
  suggestionJsonSchema,
  type Suggestion,
} from "../schemas/suggestion.js";
import type { ProductDoc } from "../types/index.js";

// The same shape as connectDB in src/config/db.ts: nothing happens
// when this file is imported. The client is made on the first call,
// so a missing key is a sentence on the first AI request -- not a
// crash for every route in the app.
let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to .env, and to Vercel.");
  }
  if (client === null) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// The two examples become two finished exchanges -- a user turn, then
// the model's reply -- and the real request is the last turn. To the
// model it looks like a conversation it has already had twice.
function buildContents(menu: ProductDoc[], message: string): Content[] {
  const shots: Content[] = EXAMPLES.flatMap((example) => [
    { role: "user", parts: [{ text: wrap(EXAMPLE_MENU, example.message) }] },
    { role: "model", parts: [{ text: JSON.stringify(example.suggestion) }] },
  ]);
  return [...shots, { role: "user", parts: [{ text: wrap(menu, message) }] }];
}

// Thrown when Gemini answered but the answer is unusable. The route
// turns it into a 502; anything else stays a 500.
export class AiReplyError extends Error {}

export async function suggestOrder(
  message: string,
  menu: ProductDoc[],
): Promise<Suggestion> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: buildContents(menu, message),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      // JSON, in exactly this shape. Without these two lines the
      // reply is prose, and prose cannot be put on a screen field
      // by field.
      responseMimeType: "application/json",
      responseJsonSchema: suggestionJsonSchema,
      // No temperature here, on purpose. Google's guide for the
      // Gemini 3 models says to leave it at its default of 1.0.
    },
  });

  // 1. undefined when there is no text at all -- for example a reply
  // that was blocked by Gemini's safety filters.
  const text = response.text;
  if (!text) {
    throw new AiReplyError("Gemini sent back no text");
  }

  // 2. Asking for JSON makes a non-JSON reply rare, not impossible.
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AiReplyError("Gemini's reply was not JSON");
  }

  // 3. The schema was a request, and this is the check: nothing that
  // arrived over the network is a Suggestion until something has
  // checked it is one.
  const result = suggestionSchema.safeParse(data);
  if (!result.success) {
    throw new AiReplyError("Gemini's reply did not match the schema");
  }
  return result.data;
}