import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("Server initialized with API key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

  // Load system prompt from AGENTS.md if available
  let agentPrompt = "";
  try {
    agentPrompt = fs.readFileSync(path.join(process.cwd(), "AGENTS.md"), "utf-8");
  } catch (e) {
    console.log("AGENTS.md not found, using default");
  }

  app.post("/api/generate", async (req, res) => {
    const { character, customPrompt, duration } = req.body;
    const maxRetries = 3;
    let attempt = 0;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    while (attempt < maxRetries) {
      try {
        const plannerPrompt = `Please generate a creative Viral POV short-form video plan in Korean.
Focus Character: ${character?.name}
Instructions: Look at the reference formulas. Focus on relatable, cute everyday moments without forcing unnecessary twists. Ensure you strictly follow constraints and never repeat the same physical ailment or setup as the previous outputs. Make it highly engaging and creative.
User Idea/Twist: ${customPrompt || "Impress me with a fun, VERY diverse, and creative idea without relying on the 'forward head posture' (turtle neck) or 'staring at a monitor' trope."}
Duration: ${duration}`;

        const plannerResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: plannerPrompt,
          config: { 
            systemInstruction: agentPrompt,
            temperature: 1.0,
          },
        });

        const plannerText = plannerResponse.text || "";

        const converterPrompt = `You are an expert prompt converter. Based on the following Korean video plan, convert it into a structured JSON format containing the title, location, full scenario (Korean), and English prompts for both images (initial frames) and video generation for each clip.

Korean Plan:
${plannerText}

Ensure the image prompts strictly follow the character reference instructions and environment details.
Ensure the video prompts follow the strict format with REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY, ENVIRONMENT, CHARACTER DESIGN, ACTION, STRICT RULES.`;

        const converterResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: converterPrompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Catchy YouTube Shorts style title in Korean" },
                location: { type: "STRING", description: "Background location in Korean" },
                scenario: { type: "STRING", description: "The full step-by-step storyboard in Korean" },
                clips: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING", description: "Clip title" },
                      imageTitle: { type: "STRING", description: "Image scene title" },
                      imagePrompt: { type: "STRING", description: "English prompt for image generation" },
                      videoTitle: { type: "STRING", description: "Video clip title" },
                      videoPrompt: { type: "STRING", description: "English prompt for video generation" }
                    },
                    required: ["title", "imageTitle", "imagePrompt", "videoTitle", "videoPrompt"]
                  }
                }
              },
              required: ["title", "location", "scenario", "clips"]
            }
          }
        });

        res.json({ success: true, result: converterResponse.text });
        return;
      } catch (error: any) {
        if (error?.status === 429) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          res.status(500).json({ error: error.message });
          return;
        }
      }
    }
    res.status(429).json({ error: "Rate limit exceeded" });
  });

  app.post("/api/generate-image", async (req, res) => {
    const { parts } = req.body;
    const maxRetries = 3;
    let attempt = 0;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    while (attempt < maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image",
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "9:16",
              imageSize: "1K",
              addWatermark: false
            } as any
          }
        });
        
        let imageUrl = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
        
        if (!imageUrl) throw new Error("No image generated");
        res.json({ success: true, result: imageUrl });
        return;
      } catch (error: any) {
        if (error?.status === 429) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          res.status(500).json({ error: error.message });
          return;
        }
      }
    }
    res.status(429).json({ error: "Rate limit exceeded" });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
