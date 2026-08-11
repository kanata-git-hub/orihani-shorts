import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
          model: "gemini-3.6-flash",
          contents: plannerPrompt,
          config: { 
            systemInstruction: agentPrompt,
            temperature: 1.0,
          },
        });

        const plannerText = plannerResponse.text || "";

        const converterPrompt = `You are an expert prompt converter. Based on the following Korean video plan, convert it into a structured JSON format containing the title, location, full scenario (Korean), Instagram Reels caption (Korean & English), exactly 5 hashtags, and English prompts for both images (initial frames) and video generation for each clip.

Korean Plan:
${plannerText}

Ensure the image prompts strictly follow the character reference instructions and environment details.
Ensure the video prompts follow the strict format with REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY, ENVIRONMENT, CHARACTER DESIGN, ACTION, STRICT RULES.
If any character needs to speak, explicitly include 'DIALOGUE: [Korean dialogue]' inside the video prompt.

CRITICAL TITLE GUIDELINES:
Create a catchy, extremely short YouTube Shorts style title combining Korean and English in a single line. Example format: "선선하다 싶었는데 29도?? 😂 (29°C?! I'm shocked 💀)". Keep it punchy and very short.

CRITICAL INSTAGRAM GUIDELINES:
1. Caption: Create a bilingual (Korean & English) caption. First, write the Korean caption in a casual, highly relatable, conversational tone (like texting a friend). Keep it witty and short. Avoid TV narration. Second, provide the English translation right below it (e.g., separate with empty lines or an emoji). The English translation MUST capture the same witty, relatable meme-like nuance and cultural context, tailored for an English-speaking audience to maximize engagement. Do not use stiff literal translation.
2. Hashtags: Provide EXACTLY 5 hashtags in this exact order: 'Relatable', '공감', '오리한의원', 'Humor', and '대구'.`;

        const converterResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: converterPrompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Catchy, extremely short YouTube Shorts style title combining Korean and English (e.g., '선선하다 싶었는데 29도?? 😂 (29°C?! I'm shocked 💀)')" },
                location: { type: "STRING", description: "Background location in Korean" },
                scenario: { type: "STRING", description: "The full step-by-step storyboard in Korean" },
                instagramCaption: { type: "STRING", description: "Bilingual (Korean & English) Instagram Reels post content/caption" },
                hashtags: { 
                  type: "ARRAY", 
                  items: { type: "STRING" },
                  description: "Exactly 5 hashtags (without # symbol). Must include 대구한의원 and 오리한의원." 
                },
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
              required: ["title", "location", "scenario", "instagramCaption", "hashtags", "clips"]
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
