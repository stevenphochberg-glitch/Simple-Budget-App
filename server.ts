import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini with telemetry headers as per guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Smart heuristic fallback parser if API key is unavailable or offline
function fallbackParseExpenses(text: string, categoryNames: string[]) {
  const items: Array<{ amount: number; description: string; predictedCategory: string }> = [];
  
  // Split by common delimiters like comma, "and", newline, period, semicolon
  const parts = text.split(/(?:,|\band\b|\n|\.|\;|\+)+/i);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Look for dollar amounts or numbers
    const amountMatch = trimmed.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      if (isNaN(amount) || amount <= 0) continue;
      
      // Remove the amount from the text to get description
      let desc = trimmed
        .replace(amountMatch[0], '')
        .replace(/^(i paid|spent|paid|for|in|on|at|bought|had to pay|cost)\s+/i, '')
        .replace(/\s+(yesterday|last night|today|this morning|earlier)\b/gi, '')
        .replace(/^[,\s\-\–\:\$\.]+/, '')
        .trim();
        
      if (!desc) {
        desc = "Expense";
      } else {
        // Capitalize first letter
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
      }

      // Infer category from description
      const descLower = desc.toLowerCase();
      let matchedCategory = categoryNames[0] || "Essentials";
      
      if (/gas|fuel|grocery|groceries|market|supermarket|food|fruit|veggies|pharmacy|medicine|hygiene|toilet paper|shampoo|soap|detergent|home goods|cleaning/i.test(descLower)) {
        matchedCategory = categoryNames.find(c => /essentials/i.test(c)) || categoryNames[0];
      } else if (/bar|beer|drinks|cocktail|wine|restaurant|dining|lunch|dinner|takeout|uber eats|doordash|coffee|cafe|latte|shopping|clothes|shoes|game|concert|movie|fun|party|vacation/i.test(descLower)) {
        matchedCategory = categoryNames.find(c => /fun/i.test(c)) || categoryNames[1] || categoryNames[0];
      } else if (/bill|phone|cell|mobile|utility|utilities|water|electric|power|internet|wifi|rent|mortgage|subscription|netflix|spotify|insurance|gym|loan/i.test(descLower)) {
        matchedCategory = categoryNames.find(c => /bills/i.test(c)) || categoryNames[2] || categoryNames[0];
      } else if (/invest|savings|deposit|stock|etf|401k|ira|downpayment|daycare fund|crypto/i.test(descLower)) {
        matchedCategory = categoryNames.find(c => /savings/i.test(c)) || categoryNames[3] || categoryNames[0];
      }

      items.push({
        amount: Math.round(amount * 100) / 100,
        description: desc,
        predictedCategory: matchedCategory
      });
    }
  }

  return items;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Dual-Path Expense Extraction Engine
  app.post("/api/parse-expense", async (req, res) => {
    try {
      const { text, categories } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Please provide a valid text note." });
      }

      const availableCategoryNames = Array.isArray(categories) && categories.length > 0
        ? categories.map((c: any) => typeof c === 'string' ? c : c.name)
        : ["Essentials", "Fun Money", "Bills", "Savings"];

      const ai = getGeminiClient();

      if (ai) {
        try {
          const categoryListString = availableCategoryNames.join(", ");
          const systemInstruction = `You are a financial parsing assistant in a budgeting app.
Extract EVERY single financial expense from the user's natural language note into distinct individual line items.
CRITICAL RULES:
1. Do NOT group or sum items mathematically by category. Every transaction mentioned must be a separate record.
2. For each item provide:
   - "amount": positive floating point number (e.g. 50, 150, 75.50)
   - "description": concise, human-readable title (e.g., "Gas", "Bar Drinks", "Cell Phone Bill", "Case of Beer")
   - "predictedCategory": strictly one of the allowed categories: [${categoryListString}].
3. Category Assignment Guidelines:
   - "Essentials": Groceries, Gas, food staples, personal care, pharmacy, household goods.
   - "Fun Money": Restaurants, bars, drinks, coffee, shopping, entertainment, hobbies, games, gifts.
   - "Bills": Cell phone, electricity, water, internet, subscriptions, rent, mortgage, insurance, recurring fixed spending.
   - "Savings": Investments, emergency fund, downpayment, retirement, daycare fund.
4. If no clear items exist, return an empty array.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: text,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    amount: {
                      type: Type.NUMBER,
                      description: "The numeric expense amount in dollars",
                    },
                    description: {
                      type: Type.STRING,
                      description: "Short, clean description of the item or merchant",
                    },
                    predictedCategory: {
                      type: Type.STRING,
                      description: "The most appropriate category name from the provided list",
                    },
                  },
                  required: ["amount", "description", "predictedCategory"],
                },
              },
            },
          });

          const rawText = response.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Standardize categories to match provided list closely
              const standardized = parsed.map((item: any) => {
                const matched = availableCategoryNames.find(
                  (c: string) => c.toLowerCase() === (item.predictedCategory || "").toLowerCase()
                ) || availableCategoryNames[0];
                return {
                  amount: Number(item.amount) || 0,
                  description: String(item.description || "Expense").trim(),
                  predictedCategory: matched,
                };
              }).filter((item: any) => item.amount > 0);

              if (standardized.length > 0) {
                return res.json({ items: standardized, engine: "gemini-3.7-flash" });
              }
            }
          }
        } catch (geminiError) {
          console.warn("Gemini parsing error, falling back to heuristic:", geminiError);
          // Fall back gracefully below
        }
      }

      // Heuristic fallback if Gemini not configured or experienced an issue
      const fallbackItems = fallbackParseExpenses(text, availableCategoryNames);
      return res.json({ items: fallbackItems, engine: "heuristic-fallback" });
    } catch (err: any) {
      console.error("Parse expense route error:", err);
      res.status(500).json({ error: "Failed to process expense note" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
