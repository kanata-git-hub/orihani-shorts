const text = `
### 2. Video Generation Prompts (English)

🎬 CLIP 1: [0-5초] 극도의 피로 (The Exhaustion)
목표: 캐릭터의 외형을 확실히 고정하고, 피곤한 감정을 시각적으로 묘사.
Prompt 1:
REFERENCE INSTRUCTION: @image1 = First frame reference.
OUTPUT SPECS: 5s, vertical 9:16.

🎬 CLIP 2: [5-10초] 각성 (The Awakening)
목표: 표정의 극적인 변화와 조명의 다이나믹한 전환.
Prompt 2:
REFERENCE INSTRUCTION: @image1 or last frame of Clip 1.
`;

const section2Regex = /(?:###\s*)?2\.\s+Video\s+Generation[\s\S]*?(?=\n(?:###\s*)?3|$)/i;
const section2Match = text.match(section2Regex);
const section2 = section2Match ? section2Match[0] : '';
console.log("SECTION 2:", section2);

const videoRegex = /(?:^|\n)\s*(?:🎬)?\s*((?:CLIP|클립)\s*\d+[^:*\n]*)(?:\*\*)?[:*]*\s*\n?([\s\S]*?)(?=(?:^|\n)\s*(?:🎬)?\s*(?:CLIP|클립)\s*\d+|$)/gi;
const videoPrompts = [];
let vM;
while ((vM = videoRegex.exec(section2)) !== null) {
  videoPrompts.push({ title: vM[1].trim(), prompt: vM[2].trim() });
}
console.log(videoPrompts);
