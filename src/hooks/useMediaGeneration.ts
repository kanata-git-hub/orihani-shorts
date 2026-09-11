import { useRef } from 'react';
import { db } from '../utils/db';
import { CHARACTERS } from "../constants";


export function useMediaGeneration(
  showToast: (msg: string, type?: "success" | "error") => void,
  saveMediaToDB: (id: string, images: any) => void,
  targetId: string | null,
  setGeneratingImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  sceneImages: Record<string, string>,
  setSceneImages: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  apiKeys: { gemini: string; kling: string },
  selectedCharacter: string,
) {
  const targetRef=useRef(targetId);targetRef.current=targetId;
  const generatingRef=useRef(false);
  const handleGenerateImage = async (
    sceneTitle: string,
    promptText: string,
    sceneIdx: number,
    allScenes: any[],
    fullPlanText?: string,
  ) => {
    if(generatingRef.current)return false;generatingRef.current=true;
    setGeneratingImages((prev) => ({ ...prev, [sceneTitle]: true }));
    try {
      const savedImages=targetId?(await db.get(targetId))?.images||{}:sceneImages;
      let matchedChars = CHARACTERS.filter((c) =>
        promptText.toLowerCase().includes(c.file.toLowerCase()),
      );

      // Add missing characters if their keywords are present
      if (
        (promptText.toLowerCase().includes("deok-i") ||
          promptText.includes("덕이")) &&
        !matchedChars.find((c) => c.id === "deoki")
      ) {
        const deoki = CHARACTERS.find((c) => c.id === "deoki");
        if (deoki) matchedChars.push(deoki);
      }
      if (
        (promptText.toLowerCase().includes("o-wonjang") ||
          promptText.includes("오원장")) &&
        !matchedChars.find((c) => c.id === "owonjang")
      ) {
        const owon = CHARACTERS.find((c) => c.id === "owonjang");
        if (owon) matchedChars.push(owon);
      }
      if (
        (promptText.toLowerCase().includes("nurse") ||
          promptText.includes("간호사") ||
          promptText.toLowerCase().includes("somi")) &&
        !matchedChars.find((c) => c.id === "nurse")
      ) {
        const nurse = CHARACTERS.find((c) => c.id === "nurse");
        if (nurse) matchedChars.push(nurse);
      }

      if (matchedChars.length === 0) {
        const defaultChar = CHARACTERS.find((c) => c.id === selectedCharacter);
        if (defaultChar) matchedChars.push(defaultChar);
      }

      let imageParts: any[] = [];

      for (const matchedChar of matchedChars) {
        if (matchedChar && matchedChar.imgs) {
          const labels = ["(Front View)", "(Side View)", "(Back View)"];
          for (let i = 0; i < matchedChar.imgs.length; i++) {
            const imgPath = matchedChar.imgs[i];
            const res = await fetch(imgPath);
            const blob = await res.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve((reader.result as string).split(",")[1]);
              reader.readAsDataURL(blob);
            });

            imageParts.push({ text: `[Character Reference Image: ${matchedChar.name} ${labels[i] || ""}]` });
            imageParts.push({
              inlineData: {
                data: base64,
                mimeType: blob.type || "image/png",
              },
            });
          }
        }
      }

      let prevImagePart = null;
      let prevSceneDesc = "";
      if (sceneIdx > 0 && allScenes.length > 0) {
        // Find the most recently generated scene to use as a visual anchor
        for (let i = sceneIdx - 1; i >= 0; i--) {
          const prevSceneTitle = allScenes[i].title;
          const prevDataUrl = savedImages[prevSceneTitle];
          if (prevDataUrl) {
            const match = prevDataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              prevImagePart = {
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              };
              prevSceneDesc = allScenes[i].prompt;
              break;
            }
          }
        }
      }

      let finalPrompt = "";
      if (!prevImagePart) {
        finalPrompt = `[USER INSTRUCTION: You are generating a highly specific image. Character reference images are attached (labelled with their character names and views). Strictly follow the structured prompt below to match their designs. CRITICAL: NEVER generate any garbled, fake, or nonsense text (squiggles). If the prompt does not explicitly request specific English text, ensure screens, papers, and signs are completely blank. Do NOT generate any Korean text. NEVER include any logos or stock photo watermarks.]\n\nPrompt Details:\n${promptText}`;
      } else {
        finalPrompt = `[USER INSTRUCTION: You are generating Scene ${sceneIdx + 1} of a continuous sequence. 
I have provided character reference images, and additionally, the VERY LAST image provided is the PREVIOUS generated scene's image.

Your task is to generate the current scene while maintaining EXACT visual continuity with the PREVIOUS scene. 
- Keep the exact same room, background, lighting, and object placements as the previous scene (unless the prop is explicitly moved in the prompt).
- Keep the character's appearance and clothing identical.
- Strictly follow the new structured prompt for the character's pose, facial expression, and actions.
CRITICAL: NEVER generate any garbled, fake, or nonsense text (squiggles). If the prompt does not explicitly request specific English text, ensure screens, papers, and signs are completely blank. Do NOT generate any Korean text. NEVER include any logos or stock photo watermarks.

${fullPlanText ? `Here is the master plan for the video to give you narrative context:\n---\n${fullPlanText}\n---\n` : ""}
Previous Generated Scene Description (For continuity reference):
${prevSceneDesc}

Current Scene Structured Prompt (WHAT YOU MUST GENERATE NOW):
${promptText}`;
      }

      const parts: any[] = [];
      if (imageParts.length > 0) parts.push(...imageParts);
      if (prevImagePart) {
        parts.push({ text: `[PREVIOUS SCENE IMAGE FOR VISUAL CONTINUITY ANCHOR]` });
        parts.push(prevImagePart);
      }
      parts.push({ text: finalPrompt });

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parts })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      const imageUrl = data.result;

      if (imageUrl) {
        const newImages={...savedImages,[sceneTitle]:imageUrl};
        if(targetId)await saveMediaToDB(targetId,newImages);
        if(targetRef.current===targetId)setSceneImages(newImages);
        return true;
      } else {
        throw new Error("No image generated by the backend.");
      }
    } catch (err: any) {
      console.error("Image gen error:", err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("Quota")
      ) {
        showToast(
          "Rate limit exceeded! Please enter your own Gemini API key in Settings.",
          "error",
        );
      } else {
        showToast("Failed: " + errMsg, "error");
      }
      return false;
    } finally {
      generatingRef.current=false;
      setGeneratingImages((prev) => ({ ...prev, [sceneTitle]: false }));
    }
  };

  return { handleGenerateImage };
}
