import { getKling4Plan } from '../kling4';
import { authFetch } from '../authFetch';
import { readApiResponse } from '../utils/apiResponse';
import { useRef } from 'react';
import { db } from '../utils/db';
import { CHARACTERS } from "../constants";
import { buildReferenceParts, loadReferenceImage, loadCharacterReferences } from '../characterReference';
import { BackgroundChoices, resolveBackground, backgroundInstruction, mayUsePreviousScene } from '../backgroundAssets';
import { readSceneReference, sceneReferenceInstruction, readClipReferences, clipReferenceInstruction } from '../sceneReference';
import { readReferencePlan, referenceSources, plannedReferenceLabel, plannedReferenceInstruction } from '../referencePlan';
import { shotDirectionInstruction } from '../shotDirection';
import { IMAGE_MODELS, isImageData, approvedImage, connectedAnatomyInstruction, type ImageResult, type ImageOperation } from '../imageQuality';


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
    operation: ImageOperation = 'generate',
    candidate?: string,
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
      if (scenes[sceneIdx].referencePlanError) throw Error(scenes[sceneIdx].referencePlanError);
      const referencePlan = readReferencePlan(scenes[sceneIdx].referencePlan, sceneIdx+1);
      const plannedSources = referencePlan ? referenceSources(referencePlan, scenes, savedImages, !!propReference) : [];
      const missing = plannedSources.filter(s => !s.imageUrl);
      if (missing.length) throw Error(`장면 ${missing.map(s=>s.scene).join(', ')} 사진을 먼저 만들어주세요. 대본의 참고 연결에 필요한 사진입니다.`);
      const background = resolveBackground(scenes, sceneIdx, fullPlanText, backgroundChoices);
      const references = await loadCharacterReferences(promptText, CHARACTERS, selectedCharacter);

      let previousImage: string | null = null;
      let anchorIndex = -1;
      if (!referencePlan && sceneIdx > 0 && allScenes.length > 0) {
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
      for (const source of plannedSources) references.push({url:source.imageUrl!,role:'planned',label:plannedReferenceLabel(source)});
      if (referencePlan) finalPrompt += '\n\n' + plannedReferenceInstruction;
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
      const kling4 = getKling4Plan(fullPlanText || '');
      if (kling4) {
        const frame = kling4.keyframes[sceneIdx];
        if (!frame || frame.imageTitle !== sceneTitle) throw Error('주요장면 연결을 확인해주세요.');
        // A keyframe can depict the payoff. Never apply the legacy rule that
        // every still must hide the outcome until after a new clip begins.
        finalPrompt = `Create ONE clean vertical 9:16 still at ${frame.time}s of a ${kling4.duration}s video. This is a timed KEYFRAME, not necessarily the start of the story. At the ending timestamp, depict the final payoff exactly as specified. No panels, collage, titles, subtitles, labels or watermarks.
ORIGINAL character sheets define identity, adult proportions, anatomy and costume. SCRIPT REFERENCE images define only the labelled set and named prop designs. Preserve their count, geometry, materials and scale while applying the CURRENT timestamp's pose, contact, ownership and object state. An earlier image is not the current pose. Do not reset changed props or invent new limbs. Reframe the same physical location without redesigning it.
CONTINUITY: ${kling4.continuity}
CURRENT KEYFRAME: ${promptText}
${background ? backgroundInstruction(background.id) : ''}
${propReference ? clipReferenceInstruction(propReference, sceneIdx + 1) : ''}`;
      }
      finalPrompt += '\n\n' + connectedAnatomyInstruction;
      const parts = buildReferenceParts(references, finalPrompt);
      const compare = operation === 'compare';
      const models = compare ? IMAGE_MODELS : [IMAGE_MODELS[0]];
      // Both comparison requests share these exact assembled parts; no prompt regeneration.
      const rows: ImageResult[] = await Promise.all(models.map(async imageModel => {
        try {
          const response = await authFetch('/api/generate-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parts, imageModel, operation, ...(candidate ? {candidate} : {}) }),
          });
          const data = await readApiResponse(response, '이미지');
          const returnedImage = data.candidate || approvedImage(data);
          if (!isImageData(returnedImage)) throw Error('이미지 응답에 그림이 없습니다. 기존 그림은 유지됩니다.');
          data.candidate = returnedImage;
          return data as ImageResult;
        } catch (error) {
          const message = (error as Error).message;
          const priorRow = savedMedia?.imageChecks?.[sceneTitle]?.rows?.find((row: ImageResult) => candidate ? row.candidate === candidate : row.model === imageModel);
          const retained = candidate || priorRow?.candidate;
          const explanation = candidate ? message : `새 그림을 받지 못해 이전 그림을 보관했습니다. ${message}`;
          // A failed request must never delete an existing paid image or its attempt history.
          return isImageData(retained) ? { ...priorRow, model: priorRow?.model || 'existing-image', candidate: retained, result: undefined,
            error: explanation, review: { status: 'unavailable' as const, issues: [], error: explanation } }
            : { model: imageModel, error: message };
        }
      }));
      if (targetId) {
        const prior = savedMedia?.imageChecks?.[sceneTitle];
        const matched = candidate && prior?.rows?.some((row: ImageResult) => row.candidate === candidate);
        const reportRows = matched ? prior.rows.map((row: ImageResult) => row.candidate === candidate ? rows[0] : row) : rows;
        await db.setImageChecks(targetId, sceneTitle, { mode: matched ? prior.mode : compare ? 'comparison' : 'generation', createdAt: Date.now(), rows: reportRows });
      }
      if (operation === 'review') {
        const row = rows[0];
        showToast(row.review?.status === 'unavailable' ? '검수가 완료되지 않아 그림을 보관했습니다. 결과에서 바로 확인·사용할 수 있습니다.'
          : row.review?.status === 'pass' ? '검수를 통과했습니다. 결과의 ‘이 그림 장면에 적용’을 눌러 사용하세요.'
          : '검수 결과와 그림을 확인해주세요.');
        return !!row.candidate && row.review?.status !== 'unavailable';
      }
      if (compare) {
        showToast('이미지 비교 결과를 확인해주세요. 기존 장면은 바꾸지 않았습니다.');
        return rows.every(row => !!row.candidate);
      }
      const imageUrl = approvedImage(rows[0]);
      if (!imageUrl) {
        if (isImageData(rows[0].candidate)) {
          showToast('생성된 그림을 결과에 보관했습니다. 그림을 확인하고 직접 적용하거나 검수만 다시 실행할 수 있습니다.');
          return false;
        }
        throw Error(rows[0].error || '이미지 결과를 받지 못했습니다. 다시 시도해주세요.');
      }
      const newImages={...savedImages,[sceneTitle]:imageUrl};
      if(targetId)await saveMediaToDB(targetId,newImages);
      if(targetRef.current===targetId)setSceneImages(newImages);
      return true;
    } catch (err: any) {
      console.error("Image gen error:", err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("Quota")
      ) {
        showToast(
          "생성 한도에 도달했습니다. 잠시 후 다시 시도해주세요.",
          "error",
        );
      } else {
        showToast(errMsg, "error");
      }
      return false;
    } finally {
      generatingRef.current=false;
      setGeneratingImages((prev) => ({ ...prev, [sceneTitle]: false }));
    }
  };

  const handleCompareImages = (title: string, prompt: string, index: number, scenes: any[], plan?: string) =>
    handleGenerateImage(title, prompt, index, scenes, plan, 'compare');
  const handleReviewImage = (title: string, prompt: string, index: number, scenes: any[], plan: string, candidate: string, repair: boolean) =>
    handleGenerateImage(title, prompt, index, scenes, plan, repair ? 'repair' : 'review', candidate);
  const handleApplyImage = async (title: string, candidate: string) => {
    if (generatingRef.current || !targetId || !isImageData(candidate)) return false;
    generatingRef.current = true;
    setGeneratingImages(prev => ({ ...prev, [title]: true }));
    try {
      await saveMediaToDB(targetId, { [title]: candidate });
      if (targetRef.current === targetId) setSceneImages(prev => ({ ...prev, [title]: candidate }));
      showToast('확인한 그림을 장면에 적용했습니다.');
      return true;
    } catch { showToast('그림을 저장하지 못했습니다. 결과에서 다운로드한 뒤 저장 공간을 확인해주세요.', 'error'); return false; }
    finally { generatingRef.current = false; setGeneratingImages(prev => ({ ...prev, [title]: false })); }
  };
  return { handleGenerateImage, handleCompareImages, handleReviewImage, handleApplyImage };
}
