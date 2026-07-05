import { useState } from "react";
import { CHARACTERS, getSystemPrompt } from "../constants";
import { extractScenes, extractVideoPrompt } from "../utils/extractors";
import { getAiInstance } from "./useSettings";

export function useGeneration(
  showToast: (msg: string, type?: "success" | "error") => void,
  saveHistory: (item: any) => void,
  apiKeys: { gemini: string; kling: string },
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentWorkboardId, setCurrentWorkboardId] = useState<string | null>(
    null,
  );

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

    let fullResult = "";
    try {
      const character = CHARACTERS.find((c) => c.id === selectedCharacter);
      const prompt = `Please generate a creative Viral POV short-form video plan.
Focus Character: ${character?.name} (Reference file: ${character?.file})
Instructions: Look at the 20 reference formulas in your system prompt. Use their comedic spirit, but generously explore the diverse situations and ailments. Ensure you strictly follow [CRITICAL CONSTRAINT: MAXIMIZE DIVERSITY (SETTINGS, THEMES, AND TROPES)] and never repeat the same physical ailment or setup as the previous outputs. Make it highly engaging, creative, and viral-ready.
User Idea/Twist: ${customPrompt || "Impress me with a fun, VERY diverse, and creative idea without relying on the 'forward head posture' (turtle neck) or 'staring at a monitor' trope."}`;

      const ai = getAiInstance();
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { 
          systemInstruction: getSystemPrompt(duration),
          temperature: 1.5,
          topP: 0.95
        },
      });

      for await (const chunk of responseStream) {
        setResult((prev) => prev + chunk.text);
        fullResult += chunk.text;
      }

      // Evaluation & Refinement Loop
      let evaluationPasses = false;
      let attempt = 0;

      while (!evaluationPasses && attempt < 3) {
        attempt++;
        showToast(
          `gemini-3.1-flash-lite 외부 엔진으로 품질 검증 중... (시도 ${attempt}/3)`,
          "success",
        );
        try {
          const evalAi = getAiInstance();
          const evalPrompt = `
You are an objective strict evaluator reviewing a short-form video plan.
Your task is to evaluate four critical areas governed by a Harness constraints:

1. Narrative Consistency (Korean): Look at "고정된 공간 및 소품 배치" and "고정된 캐릭터 위치 및 의상". Verify that the narrative in "시나리오 (${duration === '5s' ? '5' : '15'}초)" adheres strictly to this fixed background, specific prop placements, outfit, and character position.
2. Prop & Action Consistency: Verify that the props interacted with logically match the props explicitly placed on the desk/table. If the scenario invents a new prop not established in the environment BEFORE the action begins, or if the environment has random props that disappear missing interaction, this is a failure.
3. Harness Consistency: Look at [LOCKED_ENVIRONMENT] and [LOCKED_OUTFIT_AND_POSITION]. Explicitly check if the Image prompts include those EXACT descriptions.
4. Video Prompt Accuracy: Compare the Korean Scenario with "### 2. Video Generation Prompts". Verify it is divided into ${duration === '5s' ? 'exactly a single 5-second clip (CLIP 1)' : 'exactly three 5-second clips (CLIP 1, CLIP 2, CLIP 3)'}. Ensure each clip's prompt contains REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY, ENVIRONMENT, CHARACTER DESIGN, ACTION, and STRICT RULES (CRITICAL) matching the updated structure.
5. Physics and Clipping Review: Strictly mandate that the text describes precise physical interaction between limbs and objects. (e.g. "hand rests on the desk", not just "sits at desk"). It MUST explicitly direct the video generator against clipping and bad physics in the ACTION and STRICT RULES fields of each clip.
6. Facing Direction Logic: Verify that if the character is facing away from the camera, the "REFERENCE INSTRUCTION" explicitly forbids drawing facial features like eyes, mouths, or red cheeks on the back of the head as instructed.
7. Text in Images Logic: Verify that the prompt either leaves documents/signs completely blank OR specifies exactly a very short, real English word. No Korean text should be requested in the English image generation prompt.
8. Anti-Summarization (CRITICAL): Ensure that in Section ### 2, under "Prompt 1:"${duration === '5s' ? '' : ', "Prompt 2:", and "Prompt 3:"'}, the text is NOT summarized into a single block paragraph. They MUST have explicit line breaks with all uppercase keys (REFERENCE INSTRUCTION:, OUTPUT SPECS:, CINEMATOGRAPHY:, ENVIRONMENT:, CHARACTER DESIGN:, ACTION:, STRICT RULES:) listed out vertically. If they are compressed into a single text paragraph, fail this instantly.
9. DETAIL VALIDATION: Ensure the '목표' line is NOT missing for any clip. Ensure 'ACTION', 'CINEMATOGRAPHY', and 'ENVIRONMENT' are highly detailed (multiple long sentences), not short abbreviated sentences like "Static shot. @image1."
10. Visual Clarity of Pain: If the patient character is suffering from an ailment (e.g. back pain, neck pain), the description MUST visually demonstrate the pain in their physical posture (e.g. "clutching their lower back"). If it only says they are "in pain" without physical indicators, fail this.
${duration === '5s' ? `11. 5s Duration Constraints (CRITICAL):
    A. Instant Hook: The very first action at 0.0s~0.1s MUST visually show the peak comedic disaster or main situation. 
    B. Caption Length: In "### 3. AI Caption Data", there must be EXACTLY ONE caption, and its "text" field MUST be STRICTLY 11 characters or fewer in total length (including spaces and emojis).` : `11. 15s Duration Constraints: In "### 3. AI Caption Data", verify there are exactly 4 subtitles covering the correct specified time slots.`}

Score the overall plan from 0 to 100 based on all factors.

Provide your result strictly in this JSON format:
{
  "score": 85,
  "feedback": "1. Harness Consistency Failure: Section 1 used the text '[LOCKED_ENVIRONMENT]' instead of the actual environment description. 7. Text in Images Logic Failure: The prompt asked for Korean text '약국' on the sign instead of 'PHARMACY'."
}

Plan:
${fullResult}
          `;

          const evalResponse = await evalAi.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: evalPrompt,
          });

          const match = evalResponse.text?.match(/\{[\s\S]*\}/);
          if (match) {
            const resultJSON = JSON.parse(match[0]);
            if (resultJSON.score >= 90) {
              evaluationPasses = true;
              showToast("Plan passed quality evaluation!", "success");
            } else {
              showToast(
                `gemini-3.1-flash-lite 외부 엔진으로 하네스 교정 중... (Score: ${resultJSON.score})`,
                "success",
              );
              const fixPrompt = `
Here is a Video Plan:

${fullResult}

The prompts failed the evaluation.
Evaluator feedback: ${resultJSON.feedback || "Constraint failure. Please rewrite fixing all constraint violations."}

You MUST urgently fix this to pass securely. Use the HARNESS METHOD to forcefully correct your mistakes: ...
`;
              const fullFixPrompt = `
Here is a Video Plan:

${fullResult}

The prompts failed the evaluation.
Evaluator feedback: ${resultJSON.feedback || "Constraint failure. Please rewrite fixing all constraint violations."}

You MUST urgently fix this to pass securely. Use the HARNESS METHOD to forcefully correct your mistakes:
1. If the Narrative or Prop Consistency failed, rewrite "고정된 공간 및 소품 배치" and "시나리오 (${duration === '5s' ? '5' : '15'}초)" so they perfectly match. Do not list props in the environment that aren't used, and do not use props in the scenario that aren't in the environment (unless the POV camera explicitly brings them in).
2. Identify the actual text description of the [LOCKED_ENVIRONMENT] and [LOCKED_OUTFIT_AND_POSITION] in section 0.5.
3. Forcefully PASTE those exact text descriptions into the "ENVIRONMENT:" and "SUBJECT, OUTFIT & POSITION:" fields for EVERY Scene Prompt under "### 1.". DO NOT write the literal characters "[LOCKED_ENVIRONMENT]" or "[LOCKED_OUTFIT_AND_POSITION]", write the actual text! (Remember: If a prop is picked up in Scene 2 or 3, remove it from that Scene's environment description).
4. In "### 1. Image Generation Prompts", the "ACTION & EXPRESSION:" field MUST describe the character's dynamic action and expression matching the scenario. Do NOT leave them just standing still if the scenario says they are jumping or reaching.
5. If the character is facing away from the camera, ensure "REFERENCE INSTRUCTION" in "### 1." explicitly says "Back of head visible ONLY. Do NOT draw facial features (eyes, mouth, red cheeks) on the back of the head".
6. If the plan includes documents, monitors, or signs, forcefully change the image prompt to either specify a blank screen/paper or a short, real English word, removing any Korean text requests from the image prompts.
7. Fix the "### 2. Video Generation Prompts" section to precisely divide into CLIP 1${duration === '5s' ? '' : ', CLIP 2, CLIP 3'}. Ensure each clip follows the structured format (REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY, ENVIRONMENT, CHARACTER DESIGN, ACTION, STRICT RULES) step-by-step. AND ensure each clip includes the '목표: [Specific goal]' line.
8. ANTI-SUMMARIZATION (CRITICAL): Ensure that the Video Prompts in section ### 2 are NOT compressed into single paragraphs. You MUST output each component with its ALL CAPS key on a NEW LINE. If you output a single paragraph for Prompt 1${duration === '5s' ? '' : ', Prompt 2, or Prompt 3'}, the entire system will crash.
9. PREVENT ABBREVIATION: You MUST write long, deeply descriptive full sentences for ACTION, CINEMATOGRAPHY, and ENVIRONMENT. Do not use shorthand like "@image1" without further explanation.

Provide the COMPLETE rewritten plan from "### 0. Planning & Narrative (Korean)" to the end of "### 3. AI Caption Data (JSON)". Do NOT omit any sections.`;

              const fixResponse = await evalAi.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: fullFixPrompt,
              });

              let newPromptSection = fixResponse.text || "";
              const splitIndex = fullResult.indexOf(
                "### 0. Planning & Narrative",
              );
              if (splitIndex !== -1) {
                let headerPrefix = "";
                if (!newPromptSection.includes("### 0. Planning & Narrative")) {
                  headerPrefix = "### 0. Planning & Narrative (Korean)\n";
                }
                const cleanedSection = newPromptSection
                  .replace(/^```[a-z]*\n/, "")
                  .replace(/\n```$/, "");
                fullResult =
                  fullResult.substring(0, splitIndex) +
                  headerPrefix +
                  cleanedSection;
                setResult(fullResult);
              } else {
                evaluationPasses = true;
              }
            }
          } else {
            evaluationPasses = true;
          }
        } catch (e) {
          console.error("Eval loop error:", e);
          evaluationPasses = true;
        }
      }

      saveHistory({
        id: newId,
        timestamp: Date.now(),
        characterId: character?.id || "unknown",
        result: fullResult,
      });
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
