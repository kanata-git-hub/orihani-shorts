import fs from 'fs';

const extractScenes = (text) => {
  const scenes = [];
  
  const sectionRegex = /(?:###\s*)?(?:\*\*)?1\.\s+(?:Image|이미지)[\s\S]*?(?=(?:###\s*)?(?:\*\*)?2\.\s+(?:Video|비디오)|$)/i;
  let sectionMatch = text.match(sectionRegex);
  let sectionText = sectionMatch ? sectionMatch[0] : text;

  const regex = /(?:^|\n)\s*(?:[-*]\s+|\d+\.\s+)?(?:\*\*)?((?:Scene|Cut|Image|씬)\s+\d+(?:[^:*]*))(?:\*\*)?[:*]*\s*([\s\S]*?)(?=(?:^|\n)\s*(?:[-*]\s+|\d+\.\s+)?(?:\*\*)?(?:(?:Scene|Cut|Image|씬)\s+\d+|(?:###\s*)?(?:\*\*)?2|$))/gi;
  let match;
  while ((match = regex.exec(sectionText)) !== null) {
    scenes.push({ 
      title: match[1].trim(), 
      prompt: match[2].replace(/^[\s:*]+/, '').trim() 
    });
    if(match.index === regex.lastIndex) regex.lastIndex++; // prevent infinite loop
  }
  
  return scenes;
};

const text = `
0. Planning & Narrative (Korean)
...
1. Image Generation Prompts (English)
Scene 1 Prompt: MEDIUM: vertical 9:16 smartphone 1st-person POV. ART STYLE: 3D cartoon style, Pixar-inspired. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. A transparent glass cup filled with dark brown herbal medicine sits on the desk. SUBJECT, OUTFIT & POSITION: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly. ACTION & EXPRESSION: Somi has a warm, sweet, angelic smile. She is using her white wings to gently slide the glass cup toward the camera.

Scene 2 Prompt: MEDIUM: vertical 9:16 smartphone 1st-person POV. ART STYLE: 3D cartoon style, Pixar-inspired. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. A transparent glass cup sits in the middle of the desk. SUBJECT, OUTFIT & POSITION: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly. ACTION & EXPRESSION: A tense physical tug-of-war. The yellow wings are pushing the cup away, while Somi has shifted to a cold, strict, intimidating deadpan expression, pushing the cup back with intense force using her wings.

Scene 3 Prompt: MEDIUM: vertical 9:16 smartphone 1st-person POV. ART STYLE: 3D cartoon style, Pixar-inspired, high-saturation, vibrant golden lighting. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. SUBJECT, OUTFIT & POSITION: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly. ACTION & EXPRESSION: The yellow wings are lifted energetically in a triumphant pose, slapping the desk surface rhythmically. Somi has returned to her original sweet, angelic smile, gently clapping her white wings together in celebration.

2. Video Generation Prompts (English)
CLIP 1: ...
`;

console.log(extractScenes(text));
