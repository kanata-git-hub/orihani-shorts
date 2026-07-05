import { FEW_SHOT_EXAMPLES } from './examples';
import oduckImg from './오원장 3d.png';
import oduckImg2 from './오원장 3D-02.png';
import oduckImg3 from './오원장 3D-03.png';
import nurseImg from './간호사 3d.png';
import nurseImg2 from './간호사 3D-02.png';
import nurseImg3 from './간호사 3D-03.png';
import duckImg from './덕이 3d.png';
import duckImg2 from './덕이 3D-02.png';
import duckImg3 from './덕이 3D-03.png';

export const CHARACTERS = [
  { id: 'oduck', name: '오원장', file: '오원장 3d.png', img: oduckImg, imgs: [oduckImg, oduckImg2, oduckImg3], desc: '' },
  { id: 'nurse', name: '소미', file: '간호사 3d.png', img: nurseImg, imgs: [nurseImg, nurseImg2, nurseImg3], desc: '' },
  { id: 'duck', name: '덕이', file: '덕이 3d.png', img: duckImg, imgs: [duckImg, duckImg2, duckImg3], desc: '' }
];

export const getStep1Prompt = (duration: '15s' | '5s', charDetails: string) => {
  const isShort = duration === '5s';
  return `당신은 숏폼 콘텐츠 기획자입니다. 목표는 '오리한의원' 인스타그램 릴스를 위한 ${duration}짜리 재미있는 일상 시나리오 초안을 작성하는 것입니다.

[등장인물 설정]
1. 오원장 (한의사): 하얀 의사가운, 동그란 안경. 부리가 있는 하얀 오리. 날씬한 체형.
2. 소미 (간호사): 간호사복, 무표정한 흰 오리. 붉은 볼.
3. 덕이: 벌거벗고 뚱뚱한 노란 오리. 붉은 볼. 덩치는 작지만 어엿한 직장인.
선택된 중심 인물: ${charDetails}

[스토리텔링 가이드 - CRITICAL]
- 억지 반전, 강박적인 밈(Meme) 활용, 과장된 슬랩스틱을 억지로 넣으려 하지 마세요.
- 오원장, 소미, 덕이가 겪는 **'소소하고 공감되는 일상, 평범한 취미, 짧은 팔다리에서 오는 귀여운 고군분투'** 그 자체에 집중하여 스토리의 자연스러움과 본질적인 퀄리티를 끌어올리세요.
- 한의원 내의 진료 상황뿐만 아니라, 퇴근 후 게임, 캠핑, 출근길 지하철, 카페 등 다양한 일상 공간을 활용하세요.
- 비디오 길이는 ${duration} 입니다. ${isShort ? "2~4개의 아주 짧은 컷으로 핵심만 강렬하게 보여주세요." : "4~6개의 컷으로 자연스러운 기승전결을 보여주세요."}

[출력 형식]
자유로운 마크다운 형식으로 아래 항목들을 포함하여 기획안을 작성해주세요:
- 영상 제목
- 공간적 배경
- 시나리오 (초 단위로 컷 분할, 각 컷의 상황과 캐릭터의 감정/행동 상세 묘사)
- 화면에 들어갈 자막 (짧고 재미있는 문구)

[필수 참고 예시 (FEW-SHOT EXAMPLES)]
${FEW_SHOT_EXAMPLES}`;
};

export const getStep2Prompt = (duration: '15s' | '5s') => {
  const isShort = duration === '5s';
  return `당신은 숏폼 콘텐츠 프롬프트 엔지니어입니다. 앞서 작성된 시나리오 초안을 바탕으로, 비디오 생성 AI와 이미지 생성 AI가 완벽하게 이해할 수 있는 구체적인 영문 프롬프트와 JSON 구조로 변환해야 합니다.

[작업 목표 - 엄격한 JSON 포맷]
당신은 반드시 아래의 JSON 스키마에 맞추어 정확하게 응답해야 합니다. 마크다운 기호(\`\`\`json 등) 없이 순수 JSON 문자열만 출력하세요.

{
  "title": "영상 제목 (한국어)",
  "location": "공간적 배경 (한국어)",
  "scenario": "전체 시나리오 요약 (한국어)",
  "clips": [
    {
      "title": "CLIP 1: 0~3초 (컷 요약)",
      "imageTitle": "Scene 1",
      "imagePrompt": "비디오 생성을 위한 첫 프레임 이미지 생성 프롬프트 (영어)",
      "videoTitle": "CLIP 1",
      "videoPrompt": "비디오 생성 AI를 위한 프롬프트 (영어, 여러 줄의 문자열로 작성하되 줄바꿈은 \\n 으로 처리)"
    }
  ],
  "captions": [
    { "text": "화면 자막", "startTime": 0, "endTime": 3 }
  ]
}

[이미지 프롬프트 (imagePrompt) 작성 가이드]
- MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: High quality cute 3D chibi style.
- ENVIRONMENT: 배경 상세 묘사. NO TEXT.
- SUBJECT & POSITION: 캐릭터의 정확한 외형과 위치.
  - 오원장: "anthropomorphic white duck character wearing round glasses and a doctor's coat. Slim standard duck proportions, seamless smooth duck bill, absolutely no human face, absolutely no teeth, minimalist 3D toy style"
  - 소미: "anthropomorphic white duck character with bright RED CHEEKS, a seamless smooth duck bill, DEADPAN expression, wearing an off-white/beige short-sleeved wrap-style nurse top with dark navy pants. Minimalist 3D toy style, absolutely no human face"
  - 덕이: "fat, naked yellow duck character with red cheeks and a seamless smooth duck bill. Minimalist 3D toy style, absolutely no human face"
- ACTION & EXPRESSION: 현재 컷의 동작과 표정.

[비디오 프롬프트 (videoPrompt) 작성 가이드]
비디오 프롬프트는 아래의 형식을 반드시 지켜 영어로 작성하세요 (각 항목마다 줄바꿈 필수):
REFERENCE INSTRUCTION: Use Scene X as the starting reference.
OUTPUT SPECS: ${isShort ? "3s" : "5s"}, vertical 9:16.
CINEMATOGRAPHY: 카메라 무빙과 구도 상세 묘사. (단순 Static shot 이 아니라 Full sentence 로)
ENVIRONMENT: 공간 및 조명 상세 묘사.
CHARACTER DESIGN: 캐릭터 외형 고정 지시.
ACTION: 이 컷에서 일어나는 구체적인 행동 (물리적 제약을 고려하여 현실적이고 디테일하게).
STRICT RULES: 신체 부위가 사물을 통과하지 않도록 하는 등의 물리적 제약조건.

[주의사항]
- AI는 팔다리가 짧은 제약을 이해하지 못합니다. "팔이 닿지 않는다" 대신 "팔을 허공에 허우적거린다"고 묘사하세요.
- AI는 복잡한 연속 동작을 한 번에 그리지 못합니다. 각 컷마다 단 하나의 감정/상태만 묘사하고, 변화는 컷과 컷 사이에서 일어나게 하세요.
- 출력은 오직 JSON 형식이어야 합니다.

[필수 참고 예시 (FEW-SHOT EXAMPLES)]
${FEW_SHOT_EXAMPLES}`;
};
