import { useRef } from 'react';
import { db } from '../utils/db';
import { CHARACTERS } from "../constants";
import { buildReferenceParts, loadReferenceImage, CharacterReference } from '../characterReference';
import { BackgroundChoices, resolveBackground, backgroundInstruction, mayUsePreviousScene } from '../backgroundAssets';
import { readSceneReference, sceneReferenceInstruction } from '../sceneReference';


export function useMediaGeneration(
  showToast: (msg: string, type?: "success" | "error") => void,
  saveMediaToDB: (id: string, images: any) => void,
  targetId: string | null,
  setGeneratingImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  sceneImages: Record<string, string>,
  setSceneImages: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  apiKeys: { gemini: string; kling: string },
  selectedCharacter: string,
  backgroundChoices: BackgroundChoices = {},
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
      const savedMedia=targetId?await db.get(targetId):null;
      const savedImages=targetId?savedMedia?.images||{}:sceneImages;
      const sceneReference=readSceneReference(savedMedia?.sceneReference);
      const scenes = allScenes.map((scene, index) => index === sceneIdx ? { ...scene, prompt: promptText } : scene);
      if (!scenes[sceneIdx]) scenes[sceneIdx] = { title: sceneTitle, prompt: promptText };
      const background = resolveBackground(scenes, sceneIdx, fullPlanText, backgroundChoices);
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

      if (!matchedChars.length) throw Error('사용할 캐릭터를 선택해주세요. 원본 사진 없이 생성하지 않습니다.');
      const references: CharacterReference[] = [];

      for (const matchedChar of matchedChars) {
        if (matchedChar && matchedChar.imgs) {
          const labels = ["(Front View)", "(Side View)", "(Back View)"];
          for (let i = 0; i < matchedChar.imgs.length; i++) {
            const imgPath = matchedChar.imgs[i];
            references.push({ url: await loadReferenceImage(imgPath), label: `${matchedChar.name} ${labels[i] || ''}` });
          }
        }
      }

      let previousImage: string | null = null;
      let prevSceneDesc = "";
      let anchorIndex = -1;
      if (sceneIdx > 0 && allScenes.length > 0) {
        // Anchor the whole continuous location to its earliest available frame.
        // Reusing each newest frame would accumulate background/layout drift.
        for (let i = sceneIdx - 1; i >= 0; i--) {
          if (!mayUsePreviousScene(scenes, sceneIdx, i, fullPlanText || '', backgroundChoices)) break;
          const prevSceneTitle = allScenes[i].title;
          const prevDataUrl = savedImages[prevSceneTitle];
          if (prevDataUrl) {
            const match = prevDataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              previousImage = prevDataUrl;
              prevSceneDesc = allScenes[i].prompt;
              anchorIndex = i;
            }
          }
        }
        if (!previousImage && mayUsePreviousScene(scenes, sceneIdx, sceneIdx - 1, fullPlanText || '', backgroundChoices)) {
          throw Error('같은 장소의 앞 장면 이미지를 먼저 생성해주세요. 그 이미지를 기준으로 배경과 인물 배치를 이어갑니다.');
        }
      }

      let finalPrompt = "";
      if (!previousImage) {
        finalPrompt = `[USER INSTRUCTION: You are generating a highly specific image. Character reference images are attached (labelled with their character names and views). Strictly follow the structured prompt below to match their designs. CRITICAL: NEVER generate any garbled, fake, or nonsense text (squiggles). If the prompt does not explicitly request specific English text, ensure screens, papers, and signs are completely blank. Do NOT generate any Korean text. NEVER include any logos or stock photo watermarks.]\n\nPrompt Details:\n${promptText}`;
      } else {
        finalPrompt = `[USER INSTRUCTION: You are generating Scene ${sceneIdx + 1} of a continuous sequence. 
I have provided character reference images, and additionally, the VERY LAST image provided is Scene ${anchorIndex + 1}, the established spatial anchor for this continuous location.

Your task is to generate the current scene within the EXACT SAME physical set established in that anchor image.
- Preserve the visible wall, cabinet, window and doorway arrangement, floor direction, lighting direction, and prop design and placement. Generic room descriptions in the new prompt describe this existing set; they do not authorize replacing its furniture or layout.
- Preserve each character's established left/right position, relative distance, eyeline and position around the props, unless the current scripted action explicitly moves them.
- For static shots, preserve the established camera position and viewing direction. For a requested close-up, tighten the framing from the same side of the action axis. Change viewpoint only when the current shot explicitly calls for it, keeping the same physical room layout.
- Preserve each character from its ORIGINAL sheets; correct accidental changes in the previous scene's hands, colors or anatomy.
- The anchor fixes the set and spatial arrangement, not an earlier pose or emotion. Follow the current structured prompt for the current starting pose, facial expression and scripted prop state.
CRITICAL: NEVER generate any garbled, fake, or nonsense text (squiggles). If the prompt does not explicitly request specific English text, ensure screens, papers, and signs are completely blank. Do NOT generate any Korean text. NEVER include any logos or stock photo watermarks.

${fullPlanText ? `Here is the master plan for the video to give you narrative context:\n---\n${fullPlanText}\n---\n` : ""}
Established Location Anchor Description (spatial continuity only):
${prevSceneDesc}

Current Scene Structured Prompt (WHAT YOU MUST GENERATE NOW):
${promptText}`;
      }

      if (!references.length) throw Error('캐릭터 원본 사진을 찾지 못했습니다. 생성을 중단했습니다.');
      if (background) {
        let url: string;
        try { url = await loadReferenceImage(background.url); }
        catch { throw Error(`${background.name} 배경 원본을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.`); }
        references.push({ url, role: 'background', label: background.name });
        finalPrompt += '\n\n' + backgroundInstruction(background.id);
      }
      if (sceneReference) {
        references.push({url:sceneReference.imageUrl,role:'episode'});
        finalPrompt += '\n\n' + sceneReferenceInstruction();
      }
      // Keep the within-episode previous scene last, as labelled in its prompt.
      if (previousImage) references.push({url: previousImage, role: 'scene'});
      const parts = buildReferenceParts(references, finalPrompt);

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
