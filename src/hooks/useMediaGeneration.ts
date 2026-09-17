import { useRef } from 'react';
import { db } from '../utils/db';
import { CHARACTERS } from "../constants";
import { buildReferenceParts, loadReferenceImage, CharacterReference } from '../characterReference';
import { BackgroundChoices, resolveBackground, backgroundInstruction, mayUsePreviousScene } from '../backgroundAssets';
import { readSceneReference, sceneReferenceInstruction, readClipReferences, clipReferenceInstruction } from '../sceneReference';
import { shotDirectionInstruction } from '../shotDirection';


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
      const propReference=readClipReferences(savedMedia?.clipReferences)[sceneTitle];
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
              anchorIndex = i;
            }
          }
        }
        if (!previousImage && mayUsePreviousScene(scenes, sceneIdx, sceneIdx - 1, fullPlanText || '', backgroundChoices)) {
          throw Error('같은 장소의 앞 장면 이미지를 먼저 생성해주세요. 그 이미지를 기준으로 배경 디자인을 이어갑니다.');
        }
      }

      let finalPrompt = "";
      if (!previousImage) {
        finalPrompt = `[USER INSTRUCTION: You are generating a highly specific image. Character reference images are attached (labelled with their character names and views). Strictly follow the structured prompt below to match their designs. CRITICAL: NEVER generate any garbled, fake, or nonsense text (squiggles). If the prompt does not explicitly request specific English text, ensure screens, papers, and signs are completely blank. Do NOT generate any Korean text. NEVER include any logos or stock photo watermarks.]\n\nPrompt Details:\n${promptText}`;
      } else {
        finalPrompt = `[USER INSTRUCTION: Generate the START FRAME of Scene ${sceneIdx + 1} using the current shot instructions below.
The VERY LAST image is Scene ${anchorIndex + 1}, the established spatial anchor for this continuous location. Its role is set continuity; the current shot controls performance and camera.

[SET CONTINUITY]
Preserve this physical set's architecture, fixed landmarks, materials and prop design. The current shot determines what is visible from its camera; landmarks outside its crop remain off-screen. Scripted weather, light, motion and object states may change. Generic room descriptions refer to this existing set. Use the established character left/right relationship and positions around props as spatial context, updating positions when the current action calls for movement. Maintain coherent screen direction while composing the requested shot within this room.

[CURRENT SHOT PRIORITY: PERFORMANCE AND CAMERA]
The current shot below has priority for gaze target, head direction, body angle, wing/limb pose, facial expression and current prop state. Render these requested differences visibly using the characters' existing anatomy, even when the room and standing positions stay the same. Continuity instructions such as 'same scene' or 'consistent characters' preserve the set and character design; performance comes from the current shot.
Use the current shot's camera angle, shot size, subject and framing. A static or locked camera stays still WITHIN this clip; it does not require the preceding clip's framing or camera position. A close-up may crop out another character while preserving the physical room and spatial relationships. Apply only the changes requested by the current shot.
Depict the current starting pose and expression. Leave later actions and their outcomes for the video rather than showing a later outcome in this start frame.
Character identity, eye/bill geometry, anatomy, costume and colors come from the ORIGINAL character sheets. The current shot supplies their acting, including gaze and expression.
CRITICAL: NEVER generate any garbled, fake, or nonsense text (squiggles). If the prompt does not explicitly request specific English text, ensure screens, papers, and signs are completely blank. Do NOT generate any Korean text. NEVER include any logos or stock photo watermarks.

Current Scene Structured Prompt (PERFORMANCE, CAMERA AND STARTING STATE):
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
      if (propReference) {
        references.push({url:propReference.imageUrl,role:'prop'});
        finalPrompt += '\n\n' + clipReferenceInstruction(propReference,sceneIdx+1);
      }
      // Keep the within-episode previous scene last, as labelled in its prompt.
      if (previousImage) references.push({url: previousImage, role: 'scene'});
      // Keep the typed shot through history/extraction to the actual image request.
      // A manually edited prompt is authoritative over the original shot metadata.
      if (promptText === allScenes[sceneIdx]?.prompt) {
        finalPrompt += '\n\n' + shotDirectionInstruction(scenes[sceneIdx]?.shot);
      }
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
