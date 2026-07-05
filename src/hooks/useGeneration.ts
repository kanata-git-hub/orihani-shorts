
import { useState } from 'react';
import { getAiInstance } from "./useSettings";
import { CHARACTERS, getStep1Prompt, getStep2Prompt } from "../constants";
import { useHistory } from './useHistory';

export function useGeneration(duration: '15s' | '5s', selectedCharacter: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentWorkboardId, setCurrentWorkboardId] = useState<string | null>(null);
  const { saveHistory } = useHistory();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult('');
    setCurrentWorkboardId(null);
    
    try {
      const ai = await getAiInstance();
      const character = CHARACTERS.find(c => c.id === selectedCharacter);
      const charDetails = character ? `${character.name} (${character.desc})` : '';
      
      const newId = Date.now().toString();
      setCurrentWorkboardId(newId);

      // STEP 1: 기획안 생성 (Markdown)
      setResult("1/2 뇌 활성화 중: 창의적 시나리오 기획 중... ✍️");
      const step1Prompt = getStep1Prompt(duration, charDetails);
      
      const step1Response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: step1Prompt,
      });
      
      const draftScenario = step1Response.text || '';
      
      // STEP 2: 포맷팅 및 프롬프트 변환 (JSON)
      setResult("2/2 뇌 활성화 중: 비디오 프롬프트 & JSON 변환 중... 🎥");
      const step2Prompt = getStep2Prompt(duration);
      
      const step2Response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${step2Prompt}\n\n[시나리오 초안]\n${draftScenario}`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const finalJsonStr = step2Response.text || '';
      
      // 렌더링을 위해 result에 JSON 문자열 저장
      setResult(finalJsonStr);
      
      // 히스토리 저장
      saveHistory({
        id: newId,
        timestamp: Date.now(),
        characterId: character?.id || 'unknown',
        result: finalJsonStr
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the plan.');
      setResult('');
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, result, setResult, error, currentWorkboardId, handleGenerate };
}
