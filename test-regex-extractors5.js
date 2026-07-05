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

const text = `0. Planning & Narrative (Korean)
영상 제목: 쓰디쓴 기싸움 (안 먹으려는 자와 먹이려는 자)
활용된 레퍼런스: Ex 8 (Tug-of-War / 젤리 뺏기 방어전) + Ex 12 (Duality / 직장인의 이중생활 극단적 텐션 변화)
고정된 공간 및 소품 배치: 따뜻한 조명이 감도는 한의원 원목 데스크. 배경에는 전통 한약재 서랍장이 아웃포커싱 되어 있음. 벽면에는 숫자가 표시되지 않은 단순한 디자인의 빨간색 원형 벽시계가 14:30을 가리킴. 데스크 위에는 투명한 유리컵과 진한 갈색 한약 액체가 있음.
고정된 캐릭터 위치 및 의상: 1인칭 시점. 화면 하단에 노란색 카툰 날개 2개가 놓여 있음. 맞은편에는 오프화이트 랩스타일 상의와 네이비 바지를 입은 흰 오리 '소미'가 서 있음.
시나리오 (15초): [0.0초~5.0초] 소미가 미소 지으며 한약 컵을 시청자 쪽으로 밀어줌. [5.0초~10.0초] 시청자가 컵을 밀어내자 소미가 정색하며 양 날개로 컵을 강하게 밀어붙임. 치열한 힘겨루기. [10.0초~15.0초] 소미가 컵을 화면 중앙으로 밀착함. 한약을 마신 듯 화면이 밝아지며, 하단의 노란 날개가 책상을 경쾌하게 치며 기뻐함. 소미는 다시 천사 같은 미소로 박수침.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. A transparent glass cup filled with dark brown herbal medicine sits on the desk.
[LOCKED_OUTFIT_AND_POSITION]: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly.
1. Image Generation Prompts (English)
Scene 1 Prompt: MEDIUM: vertical 9:16 smartphone 1st-person POV. ART STYLE: 3D cartoon style, Pixar-inspired. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. A transparent glass cup filled with dark brown herbal medicine sits on the desk. SUBJECT, OUTFIT & POSITION: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly. ACTION & EXPRESSION: Somi has a warm, sweet, angelic smile. She is using her white wings to gently slide the glass cup toward the camera.

Scene 2 Prompt: MEDIUM: vertical 9:16 smartphone 1st-person POV. ART STYLE: 3D cartoon style, Pixar-inspired. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. A transparent glass cup sits in the middle of the desk. SUBJECT, OUTFIT & POSITION: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly. ACTION & EXPRESSION: A tense physical tug-of-war. The yellow wings are pushing the cup away, while Somi has shifted to a cold, strict, intimidating deadpan expression, pushing the cup back with intense force using her wings.

Scene 3 Prompt: MEDIUM: vertical 9:16 smartphone 1st-person POV. ART STYLE: 3D cartoon style, Pixar-inspired, high-saturation, vibrant golden lighting. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. SUBJECT, OUTFIT & POSITION: 1st-person POV. Two stubby yellow cartoon duck wings are resting at the bottom foreground of the frame. Across the desk stands Somi, an anthropomorphic white duck nurse wearing an off-white wrap-style nurse top and dark navy pants, facing the camera directly. ACTION & EXPRESSION: The yellow wings are lifted energetically in a triumphant pose, slapping the desk surface rhythmically. Somi has returned to her original sweet, angelic smile, gently clapping her white wings together in celebration.

2. Video Generation Prompts (English)
CLIP 1: The Sweet Offer 목표: Establish 1st-person POV immersion and Somi's initial kind service attitude. REFERENCE INSTRUCTION: Use the character design of Somi as an anthropomorphic white duck nurse, smooth white feathers, red cheeks on the face only, no human features, wearing off-white wrap-top and navy pants. No Korean text. OUTPUT SPECS: 5s, vertical 9:16. CINEMATOGRAPHY: Static 1st-person POV. The camera is locked, focused on the wooden desk surface. ENVIRONMENT: A warmly lit, sturdy wooden reception desk inside a traditional Korean medicine clinic. Background features blurred traditional wooden herbal cabinets. On the wall, a simple red circular clock with no numbers points to 14:30. A transparent glass cup filled with dark brown herbal medicine sits on the desk. CHARACTER DESIGN: 1st-person POV shows two stubby yellow cartoon duck wings at the bottom. Across stands Somi, an anthropomorphic white duck nurse in a wrap-style top. ACTION: Somi displays a sweet, angelic smile. She uses her white wings to carefully and smoothly slide the glass cup of dark herbal medicine toward the camera lens. The yellow wings in the foreground twitch slightly in hesitation. STRICT RULES: The wooden desk is a solid, non-permeable barrier. No clipping of wings into the desk or the glass cup. Do not draw facial features on the back of the head. No Korean text.
`;

console.log(extractScenes(text));
