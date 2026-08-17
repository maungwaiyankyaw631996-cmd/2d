import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// OCR Endpoint: Scan Slip Image to 2D Betting Numbers
app.post("/api/gemini/ocr-slip", async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "No image base64 provided" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment secrets.",
      });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an expert Myanmar 2D Lottery (နှစ်လုံးထီ / ၂လုံးဒိုင်) Slip Reader and OCR specialist.
Extract all 2D lottery numbers, formulas, and bet amounts from the provided slip image (handwritten or digital/chat screenshot).

Key Myanmar 2D terminology:
- အပူး (Double/Twins: 00, 11, 22, ..., 99)
- အခွေ / ခွေ (Permutations of digits, e.g. ခွေ 1234)
- နက္ခတ် (Astrological pairs: 07,70, 18,81, 24,42, 35,53, 46,64, 59,95)
- ပါဝါ (Power pairs: 05,50, 16,61, 27,72, 38,83, 49,94)
- ညီကို (Consecutive: 01,10, 12,21, 23,32, 34,43, 45,54, 56,65, 67,76, 78,87, 89,98, 90,09)
- အပတ် / ပတ် (Rounds of a digit, e.g. 7 ပတ်, 7 အပတ် = all 19 numbers with 7)
- ထိပ် (Head/first digit, e.g. 5 ထိပ် = 50-59)
- နောက် / ပိတ် (Tail/last digit, e.g. 3 နောက် = 03,13,23...93)
- R / r / အာ / အပြန် (Reverses, e.g. 12 R 500 = 12: 500, 21: 500)
- Ranges (e.g. 01 to 09 500)

Return your extraction in JSON with:
1. rawText: The full extracted slip text line by line.
2. customerName: Name of customer if visible or empty string.
3. items: Array of { numbers: string[], formulaName: string, amount: number, notes: string }
4. totalAmount: Sum of all bets.

Respond strictly with valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(resultText);
    } catch {
      parsedData = { rawText: resultText, items: [] };
    }

    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in OCR slip:", err);
    res.status(500).json({ error: err.message || "Failed to process image OCR" });
  }
});

// Voice / Audio transcription endpoint
app.post("/api/gemini/audio-transcribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: "No audio base64 provided" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment secrets.",
      });
      return;
    }

    const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    const prompt = `You are a Burmese speech recognition system specialized for Myanmar 2D Lottery (၂လုံးဒိုင်) bet recording.
Listen carefully to the audio and transcribe what numbers and amounts were spoken in Burmese or English.
Convert Burmese spoken numbers like 'အပူး ငါးရာ' (Twins 500), '၁၂ ၃၄ ၅၀၀' (12, 34 500), '၇ ပတ် တစ်ထောင်' (7 round 1000), '၂၃ အာ သုံးရာ' (23 R 300) into standard slip text format.

Return valid JSON:
{
  "transcription": "Burmese spoken words transcribed",
  "formattedSlip": "Clean slip text ready for parser e.g. 12,34-500\\n7 ပတ် 1000\\n23 R 300\\nအပူး 500"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanAudio,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(resultText);
    } catch {
      parsedData = { transcription: resultText, formattedSlip: resultText };
    }

    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Error in audio transcribe:", err);
    res.status(500).json({ error: err.message || "Failed to transcribe audio" });
  }
});

// AI 2D Assistant Parser endpoint
app.post("/api/gemini/parse-slip", async (req: Request, res: Response): Promise<void> => {
  try {
    const { slipText } = req.body;
    if (!slipText) {
      res.status(400).json({ error: "No slip text provided" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({ error: "Gemini API key is not configured" });
      return;
    }

    const prompt = `Parse the following Myanmar 2D lottery slip text into individual 2-digit numbers (00-99) and their respective bet amounts:
Text:
${slipText}

Support Burmese numbers (၀-၉), special functions (အပူး, အခွေ, နက္ခတ်, ပါဝါ, ညီကို, အပတ်, ထိပ်, နောက်, R / အပြန်).
Return valid JSON:
{
  "customerName": "detected customer name or empty",
  "entries": [
    { "number": "12", "amount": 500, "sourceRule": "12 R 500" }
  ],
  "totalAmount": 1000
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Error parsing slip with AI:", err);
    res.status(500).json({ error: err.message || "Failed to parse slip" });
  }
});

// Vite middleware for development & static file serving for production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`2D Ledger Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
