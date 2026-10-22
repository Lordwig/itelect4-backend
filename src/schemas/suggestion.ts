import { z } from "zod";

// What a client is allowed to send to POST /api/ai. Checked before
// anything is sent to Gemini, because every request that reaches
// Gemini is counted against your free quota -- a request that was
// never going to work should cost nothing.
export const aiRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(20, "Describe what you feel like ordering in at least 20 characters.")
    .max(2000, "Keep your message under 2000 characters."),
});

// What Gemini has to send BACK. This one schema is used three ways:
//   1. z.infer below turns it into the Suggestion type for TypeScript.
//   2. z.toJSONSchema at the bottom turns it into the JSON Schema
//      that is sent to Gemini with every request.
//   3. suggestionSchema.safeParse in src/ai/gemini.ts checks the reply.
// .describe() is not a comment: the text travels to Gemini inside
// the JSON Schema and tells the model what each field is for.
export const suggestionSchema = z.object({
  summary: z
    .string()
    .describe("One sentence restating what the customer is in the mood for."),
  picks: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe(
      "Items from the menu that fit, each as the product name followed by a short reason.",
    ),
  match: z
    .enum(["good", "partial", "none"])
    .describe("How well the menu fits what the customer asked for."),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

// Computed once, when this file is first imported -- not per request.
export const suggestionJsonSchema = z.toJSONSchema(suggestionSchema);