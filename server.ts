import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in your deployment platform (Vercel/Firebase).");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// Gemini Recommendation AI Endpoint
app.post("/api/recommendations", async (req, res) => {
  try {
    const { preferences, dietaryGoals, products } = req.body;

    if (!preferences || !dietaryGoals || !products) {
      return res.status(400).json({ error: "Missing required fields: preferences, dietaryGoals, and products" });
    }

    const ai = getGenAI();

    const systemInstruction = `You are a nutrition expert and meal recommendation assistant for "Eat Right Foods", a healthy Nigerian and continental meal delivery service.
    Your goal is to suggest 3 personalized meals from the provided menu based on the user's preferences and dietary goals.
    
    Menu items available:
    ${products.map((p: any) => `- ${p.name}: ${p.description} (Category: ${p.category}, Calories: ${p.calories || 'N/A'})`).join('\n')}
    
    Format your response as a JSON object with the following structure:
    {
      "recommendations": [
        {
          "productId": "id of the product from the menu",
          "reasoning": "A brief explanation of why this meal fits their preferences/goals"
        }
      ],
      "advice": "General nutrition advice based on their goals"
    }
    
    If no products match perfectly, suggest the closest healthy options.
    Be encouraging and highlight the health benefits.`;

    const prompt = `User Preferences: ${preferences}
    Dietary Goals: ${dietaryGoals}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    res.status(500).json({ error: "Failed to generate recommendations. " + error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
