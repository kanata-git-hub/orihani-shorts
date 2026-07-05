import { useState } from "react";
import { CHARACTERS, getSystemPrompt } from "../constants";
import { getAiInstance } from "./useSettings";

export function useGeneration(
  showToast: (msg: string, type?: "success" | "error") => void,
  saveHistory: (item: any) => void,
  apiKeys: { gemini: string; kling: string },
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentWorkboardId, setCurrentWorkboardId] = useState<string | null>(null);

  const handleGenerate = async (
    selectedCharacter: string,
    customPrompt: string,
    duration: '15s' | '5s' = '15s',
  ) => {
    setIsGenerating(true);
    setResult("");
    setError(null);
    const newId = Date.now().toString();
    setCurrentWorkboardId(newId);

    try {
      const character = CHARACTERS.find((c) => c.id === selectedCharacter);
      const ai = getAiInstance();

      // Step 1: 기획자 (Planner)
      showToast("기획 중입니다... (1/2)", "success");
      
      const plannerPrompt = `Please generate a creative Viral POV short-form video plan in Korean.
Focus Character: ${character?.name} (Reference file: ${character?.file})
Instructions: Look at the reference formulas. Focus on relatable, cute everyday moments without forcing unnecessary twists. Ensure you strictly follow constraints and never repeat the same physical ailment or setup as the previous outputs. Make it highly engaging and creative.
User Idea/Twist: ${customPrompt || "Impress me with a fun, VERY diverse, and creative idea without relying on the 'forward head posture' (turtle neck) or 'staring at a monitor' trope."}
Duration: ${duration}`;

      const plannerResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: plannerPrompt,
        config: { 
          systemInstruction: getSystemPrompt(duration),
          temperature: 1.0,
        },
      });

      const plannerText = plannerResponse.text || "";

      // Step 2: 변환기 (Converter)
      showToast("영문 프롬프트로 변환 중입니다... (2/2)", "success");
      
      const converterPrompt = `You are an expert prompt converter. Based on the following Korean video plan, convert it into a structured JSON format containing the title, location, full scenario (Korean), and English prompts for both images (initial frames) and video generation for each clip.

Korean Plan:
${plannerText}

Ensure the image prompts strictly follow the character reference instructions and environment details.
Ensure the video prompts follow the strict format with REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY, ENVIRONMENT, CHARACTER DESIGN, ACTION, STRICT RULES.
`;

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
                    title: { type: "STRING", description: "Clip title, e.g., 'CLIP 1 0~5초 (극도의 피로)'" },
                    imageTitle: { type: "STRING", description: "Image scene title, e.g., 'Scene 1'" },
                    imagePrompt: { type: "STRING", description: "Highly detailed English prompt for generating the first frame image" },
                    videoTitle: { type: "STRING", description: "Video clip title in English/Korean" },
                    videoPrompt: { type: "STRING", description: "The full English prompt for the video generation with all required sections" }
                  },
                  required: ["title", "imageTitle", "imagePrompt", "videoTitle", "videoPrompt"]
                }
              }
            },
            required: ["title", "location", "scenario", "clips"]
          }
        }
      });

      const finalJson = converterResponse.text || "{}";
      
      // Try to parse to ensure it's valid, if not it will throw
      JSON.parse(finalJson);
      
      setResult(finalJson);

      saveHistory({
        id: newId,
        timestamp: Date.now(),
        characterId: character?.id || "unknown",
        result: finalJson,
      });
      
      showToast("Plan generated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating the plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    result,
    setResult,
    error,
    currentWorkboardId,
    handleGenerate,
  };
}
