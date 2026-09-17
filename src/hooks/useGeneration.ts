import { SourceEpisode } from '../types';
import { readSceneReference, type SceneReference } from '../sceneReference';
import { db } from '../utils/db';
import { useState } from "react";
import { CHARACTERS, getSystemPrompt } from "../constants";


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
    episode?: SourceEpisode,
    reference?: SceneReference | null,
  ) => {
    setIsGenerating(true);
    setResult("");
    setError(null);
    const newId = crypto.randomUUID();

    try {
      const sceneReference=readSceneReference(reference);
      const character = CHARACTERS.find((c) => c.id === selectedCharacter);
      // Step 1 & 2: Call backend API
      showToast("기획 중입니다... (1/2)", "success");
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          character,
          customPrompt,
          duration,
          ...(episode ? {sourceEpisode: episode} : {}),
          ...(sceneReference?{sceneReference}:{}),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      const finalJson = data.result || "{}";
      
      // Try to parse to ensure it's valid, if not it will throw
      JSON.parse(finalJson);
      if(sceneReference)await db.setSceneReference(newId,sceneReference);
      

      saveHistory({
        id: newId,
        timestamp: Date.now(),
        characterId: character?.id || "unknown",
        result: finalJson,
        duration: duration==='5s'?5:15, customPrompt, ...(episode?{episode}:{}),
      });
      setCurrentWorkboardId(newId);
      setResult(finalJson);
      
      showToast("Plan generated successfully!", "success");
      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating the plan.");
      return false;
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
