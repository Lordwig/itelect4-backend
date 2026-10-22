import "dotenv/config";
import { suggestOrder } from "./ai/gemini.js";
import { PRODUCTS } from "./data/products.js";

// npm run try-ai. One real request to Gemini from your terminal --
// the same function POST /api/ai calls, with no Express, no token
// and no database. Run it once the key is in .env: if this prints a
// suggestion, the key, the model name and the schema all work.
async function tryAi() {
  const suggestion = await suggestOrder(
    "Something cold to drink and a pastry, and I want to spend " +
      "less than 250 pesos in total.",
    PRODUCTS,
  );
  console.log(JSON.stringify(suggestion, null, 2));
}

tryAi().catch((err: unknown) => {
  console.error("Gemini call failed:", err);
  process.exit(1);
});