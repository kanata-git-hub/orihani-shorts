const text = `
### 1. Image Generation Prompts for Gemini Image (English)
Scene 1 Prompt: ...

🎥 영상 프롬프트 마스터 세트: '테스트'
비디오 생성 AI의 '환각 현상(신체 융합, 텍스트 깨짐)'을 최소화하고, 시네마틱한 퀄리티를 얻기 위한 프롬프트입니다.

🎬 CLIP 1: [0-5초] 극도의 피로 (The Exhaustion)
목표: 캐릭터의 외형을 확실히 고정하고, 피곤한 감정을 시각적으로 묘사.
Prompt 1:
REFERENCE INSTRUCTION: @image1 = First frame reference.
OUTPUT SPECS: 5s, vertical 9:16.
`;

const section2Regex = /(?:###\s*)?(?:2\.\s+Video\s+Generation|🎥\s*영상\s*프롬프트\s*마스터\s*세트)[\s\S]*?(?=\n(?:###\s*)?3|$)/i;
const section2Match = text.match(section2Regex);
const section2 = section2Match ? section2Match[0] : '';
console.log("SECTION 2:", section2);
