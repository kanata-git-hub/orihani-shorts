import express from "express";
import { editorRouter } from "./server/editor/routes";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
import { clipDurations, timingInstruction, validateClipTiming } from "./src/utils/clipTiming";
import { readSceneReference, planWithSceneReference } from './src/sceneReference';
import { videoAudioInstruction, normalizeVideoPlan, bindClipStartFrame } from './src/videoPrompt';
import { characterReferencePolicy } from './src/characterReference';
import { readSourceEpisode, sourceConversionInstruction } from './src/sourceEpisode';
import { SHOT_SIZES, SCENE_TRANSITIONS, shotConversionInstruction } from './src/shotDirection';
import { episodePrompt } from './src/workflow/weekly';
dotenv.config({ override: true });

async function startServer() {
  const app = express();
  // Honor local preview flags; production keeps the existing Cloud Run PORT.
  const devArg = (name: string) => process.env.NODE_ENV !== 'production' && process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined;
  const PORT = Number(devArg('--port') || process.env.PORT || 3000);
  const HOST = devArg('--host') || '0.0.0.0';
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw Error('올바른 포트 번호가 필요합니다.');

  app.use('/api/editor', editorRouter);
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
    if (duration !== '5s' && duration !== '15s') {
      res.status(400).json({ error: '영상 길이는 5초 또는 15초여야 합니다.' });
      return;
    }
    let sceneReference, sourceEpisode;
    try {
      sceneReference=readSceneReference(req.body.sceneReference);
      sourceEpisode=readSourceEpisode(req.body.sourceEpisode, duration, customPrompt);
    }
    catch(e) { res.status(400).json({error:(e as Error).message});return; }
    const timing = timingInstruction(duration);
    const maxRetries = 3;
    let attempt = 0;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    while (attempt < maxRetries) {
      try {
        const plannerPrompt = `Please generate a creative Viral POV short-form video plan in Korean.
Focus Character: ${character?.name}
Instructions: Look at the reference formulas. Focus on relatable, cute everyday moments without forcing unnecessary twists. Ensure you strictly follow constraints and never repeat the same physical ailment or setup as the previous outputs. Make it highly engaging and creative.
User Idea/Twist: ${customPrompt || "Impress me with a fun, VERY diverse, and creative idea without relying on the 'forward head posture' (turtle neck) or 'staring at a monitor' trope."}
Duration: ${duration}
${timing}`;

        let plannerText = sourceEpisode ? episodePrompt(sourceEpisode) : "";
        if (!sourceEpisode) {
          const plannerResponse = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: planWithSceneReference(plannerPrompt, sceneReference),
            config: {
              systemInstruction: `${agentPrompt}\n\n${timing}\n\n${videoAudioInstruction}`,
              temperature: 1.0,
            },
          });

          plannerText = plannerResponse.text || "";
        }

        const converterPrompt = `You are an expert prompt converter. Based on the following Korean video plan, convert it into a structured JSON format containing the title, location, full scenario (Korean), Instagram Reels caption (Korean & English), exactly 5 hashtags, and English prompts for both images (initial frames) and video generation for each clip.

${sourceEpisode ? sourceConversionInstruction : "Preserve the completed plan below; this step converts rather than re-plans it."}

Korean Plan:
${plannerText}

${timing}

${shotConversionInstruction}

Preserve physical conditions exactly: a closed door is not necessarily locked. Do not invent locks or new obstacles. Describe hinge motion toward or away from the visible character instead of ambiguous inward/outward directions.

Ensure the image prompts strictly follow the character reference instructions and environment details.
For EACH clip, set a short locationId identifying its actual physical room or place (for example clinic-office). Reuse the EXACT same locationId across consecutive shots in that place, including reaction shots and close-ups, even when backgroundAsset is none. Change locationId only for an actual location change; use different IDs for two different offices or rooms of the same type. Establish the furniture/window layout, prop design and physical character locations in the first shot. Later shots use the same set and maintain coherent character left/right relationships, updating locations when the script moves someone. Plan each shot's gaze target, head/body direction, limb pose, expression, prop state and camera framing from its CURRENT scripted beat. Static/locked describes camera motion within one clip, not identical framing across clips. A new speaker alone does not require reversing the camera.
In EACH imagePrompt, explicitly describe the current STARTING STATE (gaze target, head/body direction, pose, expression and prop state), CAMERA (shot size, angle and framing), and SET (the established room). Write the actual visible starting state rather than 'same pose as before'. Make scripted performance differences readable with the existing character design. Keep actions and reactions that happen later in the clip in videoPrompt; preserve their beginning state in imagePrompt. Consistency applies to identity and set design, while the current scene controls performance and composition.
For EACH clip, set backgroundAsset from the location actually visible in that clip: pantry = the clinic staff tea/break room (탕비실), treatment = the clinic treatment/acupuncture room (치료실), reception = the clinic reception/front desk/waiting area (접수대), none = every other location or uncertain setting. Read the narrative context, not isolated words in dialogue. Do not classify a home kitchen, an office break room, a restaurant, or an outdoor scene as a clinic room. Reuse the same asset for shots in the same room and change it when the location changes. All three clinic rooms share light warm wood furniture, cream walls and warm lighting. The supplied empty room original will be attached during image generation. Keep the story's actual locations; do not relocate unrelated scenes to the clinic.
Ensure the video prompts follow the strict format with REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY, ENVIRONMENT, ACTION, DIALOGUE, AUDIO, STRICT RULES. Use a real newline between headings. DO NOT include a CHARACTER DESIGN section.
Use these specific English names: 오원장 = O-wonjang, 소미 = Somi, 덕이 = Deok-i.
${videoAudioInstruction}

CRITICAL TITLE GUIDELINES:
For a supplied finished screenplay, preserve its Korean-only title and episode number. Otherwise create a catchy, extremely short YouTube Shorts style title combining Korean and English in a single line. Example format: "선선하다 싶었는데 29도?? 😂 (29°C?! I'm shocked 💀)". Keep it punchy and very short.

CRITICAL INSTAGRAM GUIDELINES:
For a supplied finished screenplay, preserve the supplied caption and five hashtags. The defaults below apply only to original free-form plans.
1. Caption: Create an extremely short, punchy one-line caption combining Korean and English. It MUST be a single line. Example format: "선선하다 싶었는데 29도?? 😂 (29°C?! I'm shocked 💀)". Do NOT write long paragraphs or separate sentences.
2. Hashtags: Provide EXACTLY 5 hashtags in this exact order: '#[Core Topic 1 in Korean]', '#[Core Topic 1 in English]', '#Humor', '#Relatable', and '#유머'.`;

        const converterResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: planWithSceneReference(converterPrompt, sceneReference),
          config: {
            systemInstruction: characterReferencePolicy(),
            temperature: sourceEpisode ? 0.2 : 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING", description: "Catchy, extremely short YouTube Shorts style title combining Korean and English (e.g., '선선하다 싶었는데 29도?? 😂 (29°C?! I'm shocked 💀)')" },
                location: { type: "STRING", description: "Background location in Korean" },
                scenario: { type: "STRING", description: "The full step-by-step storyboard in Korean" },
                instagramCaption: { type: "STRING", description: "Extremely short one-line bilingual caption (e.g., '선선하다 싶었는데 29도?? 😂 (29°C?! I'm shocked 💀)')" },
                hashtags: { 
                  type: "ARRAY", 
                  items: { type: "STRING" },
                  description: "Exactly 5 hashtags (without # symbol) in this exact order: [Core Topic 1 in Korean], [Core Topic 1 in English], Humor, Relatable, 유머." 
                },
                clips: {
                  type: "ARRAY",
                  minItems: clipDurations(duration).length,
                  maxItems: clipDurations(duration).length,
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING", description: "Clip title" },
                      imageTitle: { type: "STRING", description: "Image scene title" },
                      imagePrompt: { type: "STRING", description: "English prompt for image generation" },
                      backgroundAsset: { type: "STRING", enum: ["pantry", "treatment", "reception", "none"], description: "Canonical clinic room visible in this clip, or none for other locations" },
                      locationId: { type: "STRING", description: "Stable physical location ID, identical across shots in the same place; independent of backgroundAsset" },
                      sceneTransition: { type: "STRING", enum: [...SCENE_TRANSITIONS], description: "continuous action, same-set reframe, or new-scene for location/time/visual-world changes" },
                      shot: {
                        type: "OBJECT",
                        properties: {
                          size: { type: "STRING", enum: [...SHOT_SIZES] },
                          angle: { type: "STRING", description: "Current camera angle in English" },
                          focus: { type: "STRING", description: "Visible subject, crop and depth; keep source framing" },
                          startState: { type: "STRING", description: "Visible beginning pose, object state and composition before the clip's action" },
                        },
                        required: ["size", "angle", "focus", "startState"],
                      },
                      videoTitle: { type: "STRING", description: "Video clip title" },
                      videoPrompt: { type: "STRING", description: "English prompt for video generation" }
                    },
                    required: ["title", "imageTitle", "imagePrompt", "backgroundAsset", "locationId", "sceneTransition", "shot", "videoTitle", "videoPrompt"]
                  }
                }
              },
              required: ["title", "location", "scenario", "instagramCaption", "hashtags", "clips"]
            }
          }
        });

        const converted = JSON.parse(converterResponse.text || '{}');
        if (Array.isArray(converted.clips)) converted.clips = converted.clips.map((clip: any, i: number) => ({
          ...clip, videoPrompt: bindClipStartFrame(clip.videoPrompt || '', i + 1),
        }));
        if (sourceEpisode) {
          converted.title = sourceEpisode.title.replace(/^\[에피소드\s*\d+\]\s*/, '');
          converted.scenario = sourceEpisode.scenario;
          converted.instagramCaption = sourceEpisode.caption;
          const tags = sourceEpisode.caption.match(/#[^\s#]+/g);
          if (tags?.length === 5) converted.hashtags = tags.map((tag: string) => tag.slice(1));
        }
        const result=normalizeVideoPlan(JSON.stringify(converted));
        validateClipTiming(result, duration);
        res.json({ success: true, result });
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

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
