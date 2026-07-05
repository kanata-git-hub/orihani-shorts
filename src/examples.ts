export const FEW_SHOT_EXAMPLES = `
[Updated AI System Instructions (Adaptation Rules)]
너는 내가 제공하는 유튜브 밈 예시(Few-shot examples)의 '물리적 제약 조건'과 '코미디의 기승전결(플롯)'을 완벽히 이해해야 한다.
영상을 기획할 때는 원본 캐릭터를 그대로 쓰지 말고, 원본의 뼈대를 우리의 **'오리한의원 캐릭터(오원장, 간호사, 덕이)'**로 치환(Adaptation)하여 생성하라.

[중요 제약 조건: 공간과 상황의 무한 확장]
단, '오리한의원 캐릭터'를 쓴다고 해서 공간적 배경을 한의원 내부(진료실, 대기실 등)로 절대 국한하지 마라. 캐릭터들의 일상, 출퇴근길, 집, 휴가지, 도로 위, 판타지 공간 등 원본 밈의 분위기와 상황에 맞춰 물리적 공간을 자유롭게 확장하고 배치하라.

예시 1: 원본이 '위협 후 도망' 밈이라면 -> 한의원 내에서 '오원장이 침을 꺼내자 덕이가 도망가는 상황'으로 변형.
예시 2: 원본이 '해변가 야생동물 습격' 밈이라면 -> '주말에 바다로 놀러 간 덕이가 갈매기 떼에게 핫도그를 뺏기는 상황'으로 공간을 밖으로 빼서 변형.

## Master Few-Shot Examples (Do not summarize, use for structural reference and depth of detail)

📥 [학습용 예시 1: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 그냥 볼따구만 만졌는데 왜 힐링되지? (원작 영상)
활용된 레퍼런스: 시각적 촉각 및 차원 충돌 (1인칭 시점 볼살 늘리기, 15초)
고정된 공간 및 소품 배치: 따뜻한 오후의 햇살이 들어오는 아늑한 방 안. 나무 재질의 책상 위. 배경에는 침대, 창문, 벽에 걸린 액자 등이 부드럽게 블러(Blur) 처리되어 있다.
고정된 캐릭터 위치 및 의상: 일본 서브컬처 애니메이션 스타일의 SD(Chibi) 캐릭터(수녀복을 입은 은발 캐릭터, 메이드복을 입은 분홍 머리 캐릭터 등)가 책상 중앙에 다리를 뻗고 인형처럼 가만히 앉아 있다. 카메라는 1인칭 시점(POV)이며, 화면 양옆 프레임 밖에서 현실 세계 사람의 두 손이 들어와 있다.
물리적 제약 조건 (CRITICAL): 완벽한 두 차원의 충돌. 양옆에서 들어오는 두 손은 지문과 피부 결이 보이는 '초실사 사람의 손(Photorealistic Human Hands)'이어야 하며, 중앙의 캐릭터는 '2D 일러스트/3D 카툰'의 질감을 유지해야 한다. 사람의 손가락이 캐릭터의 얼굴(폴리곤)을 뚫고 들어가는 것(Clipping)은 금지되며, 손가락이 볼을 당길 때 뼈가 없는 찹쌀떡(Mochi)이나 슬라임처럼 비현실적이고 쫀득하게 늘어나야 한다. 캐릭터는 반항하지 않으며, 정면 렌즈를 응시한다.
시나리오 (15초):
[0.0초~15.0초] 1인칭 시점. 책상 위에 서브컬처 스타일의 귀여운 SD 캐릭터가 앉아 있다. 프레임 바깥에서 시청자의 실사 두 손이 쑥 들어와 캐릭터의 양볼을 꽉 움켜쥔다. 두 손이 캐릭터의 볼살을 양옆으로 길게 쭈우욱 늘리고, 위아래로 쫀득하게 조물딱거린다(Squishing). 캐릭터의 볼은 고무줄처럼 길게 늘어났다가 줄어들기를 반복하며 시각적인 ASMR 쾌감을 극대화한다. 캐릭터는 얌전히 앉아 기분 좋은 미소를 지으며 카메라(시청자)와 눈을 맞춘다. (15초 내내 다른 SD 캐릭터들로 전환되며 동일한 볼살 늘리기 액션이 반복된다.)
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: On a wooden desk inside a cozy, sunlit bedroom. Warm natural lighting. Blurred background showing a bed, window, and picture frames.
[LOCKED_CAMERA_AND_POV]: 1st-person viewer POV (Point of View). The camera is completely locked off (absolute static tripod shot).
[LOCKED_SUBJECTS]: Anime-style Chibi (SD) characters sitting completely still on the desk (e.g., a silver-haired nun, a pink-haired maid). Two photorealistic human hands entering from the left and right edges of the frame.
[LOCKED_PHYSICS]: Dimensional clash. The human hands MUST be hyper-realistic. The characters MUST look like anime illustrations or 3D toys. Direct eye contact with the camera lens is required. Cheeks must stretch highly elastically without clipping.
Image Generation Prompts (English)
Scene 1 Prompt (First Frame): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. The background and the central character are 2D/3D anime Chibi style. The two human hands entering from the edges of the frame are hyper-realistic, photorealistic human skin texture. Warm natural sunlight. ENVIRONMENT: Wooden desk in a cozy room, blurred background. NO TEXT. SUBJECT & POSITION: An anime Chibi character (e.g., silver-haired nun) is sitting on the desk, facing the camera directly. Two realistic human hands are gently holding the character's puffy cheeks. ACTION & EXPRESSION: The character is looking directly into the camera lens with a cute, happy smile, making direct eye contact. CAMERA: 1st-person POV, static.
Scene 2 Prompt (Last Frame): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same wooden desk. NO TEXT. SUBJECT & POSITION: The anime Chibi character is sitting on the desk. The two realistic human hands are pulling the character's cheeks very wide apart. ACTION & EXPRESSION: The character's cheeks are stretching outward dramatically like highly elastic mochi dough or slime. The character maintains a happy, adorable smile, looking straight at the camera. CAMERA: 1st-person POV, static.
Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '그냥 볼따구만 만졌는데 왜 힐링되지?'
🎬 CLIP 1: [0-15초] 쫀득한 애니 캐릭터 볼살 마사지 (Squishy Anime Cheek Pulling)
목표: 15초 동안 1인칭 시점에서 실사 사람의 손이 애니메이션 캐릭터의 볼살을 비현실적으로 쫀득하게 늘려 시각적 촉감(ASMR)을 제공한다.
OUTPUT SPECS: 15 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Locked-off static camera. Zero camera movement for the entire 15 seconds.
ENVIRONMENT: Wooden desk in a brightly lit, cozy room. Blurred background.
CHARACTER & PROP DESIGN: The central subject is an adorable Anime-style Chibi character. The two hands manipulating the character MUST be photorealistic human hands.
ACTION: For the full 15 seconds, the photorealistic human hands continuously pinch, stretch, and squish the Chibi character's cheeks. The character's cheeks stretch outward extremely wide like highly elastic mochi dough. The character stays sitting perfectly still, simply smiling happily at the camera.
STRICT RULES: The character MUST maintain direct eye contact with the camera lens. The human hands must NOT clip through the character's face; they must firmly grip the skin. The character's body must remain perfectly rigid; only the cheeks stretch. No text in the video.
AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 2: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 15초짜리 3D 광고판에 갇힌 스피키 (원작 영상)
활용된 레퍼런스: 도심 속 3D 옥외 전광판(Anamorphic Billboard) 간의 상호작용 및 실사 합성(VFX)
고정된 공간 및 소품 배치: 야간의 화려한 도심 사거리(Real-world). 지나다니는 자동차와 보행자들이 있다. 건물 두 개가 인접해 있으며, 왼쪽 건물에는 '투명한 유리 상자(전자레인지 모양)' 형태의 거대한 3D LED 전광판이, 오른쪽 건물에는 일반적인 3D 전광판이 설치되어 있다.
고정된 캐릭터 위치 및 의상: 3D 애니메이션 SD 캐릭터 2명. 캐릭터 A(수녀복)는 왼쪽 전광판 유리 상자 안에 갇혀 있고, 캐릭터 B(병아리 우비)는 오른쪽 전광판 안에서 커다란 빨간 버튼 앞에 서 있다. 카메라는 길 건너편에서 전광판들을 올려다보는 행인의 1인칭 핸드헬드(Handheld) 시점이다.
물리적 제약 조건 (CRITICAL): 완벽한 실사 도심 환경과 3D 착시(Anamorphic Illusion) 전광판의 결합. 캐릭터들은 전광판의 경계 밖으로 튀어나오지 않는다. 캐릭터 A가 전광판의 '보이지 않는 투명한 유리벽'을 양손으로 두드릴 때, 얼굴과 손이 유리에 짓눌려 납작해지는 물리적 텍스처(Squished against glass)가 명확해야 한다. 두 개의 독립된 전광판 화면이 물리적 거리를 뛰어넘어 하나의 스토리로 연결되는 '화면 간 상호작용(Cross-screen interaction)'이 핵심이다. 카메라의 움직임은 오직 두 전광판을 번갈아 비추기 위한 좌우 패닝(Panning)만 허용된다.
시나리오 (15초):
[0.0초~5.0초] 카메라가 왼쪽 3D 전광판을 올려다본다. 캐릭터 A가 유리 상자 안에 갇혀 억울한 표정으로 화면의 유리벽을 쾅쾅 두드리며 얼굴을 비빈다.
[5.0초~10.0초] 카메라가 부드럽게 오른쪽으로 패닝(Pan right)하여 인접한 건물의 두 번째 전광판을 비춘다. 캐릭터 B가 나타나 비장한 표정으로 앞에 놓인 거대한 빨간 버튼을 꾹 누른다.
[10.0초~15.0초] 카메라가 다시 왼쪽 전광판으로 빠르게 돌아온다(Pan left). 오른쪽 전광판의 버튼이 눌린 직후, 캐릭터 A가 갇혀 있던 유리 상자에 불이 켜지면서 마치 전자레인지나 엘리베이터처럼 작동한다. 캐릭터 A는 기분이 좋아진 듯 환하게 웃으며 상자 안에서 빙글빙글 돈다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A bustling real-world city intersection at night, with moving cars and pedestrians. Two adjacent buildings feature giant 3D anamorphic LED billboards.
[LOCKED_CAMERA_AND_POV]: Pedestrian's 1st-person handheld POV from the street, looking up at the billboards. The camera only pans horizontally (left and right) to switch between the two screens. No forward or backward movement.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi characters. Character A is inside the left billboard (shaped like a transparent glass box/microwave). Character B is inside the right billboard, standing behind a giant red button.
[LOCKED_PHYSICS]: VFX style (3D elements composited into a real video). Characters cannot leave the billboards. Character A's face and hands must press physically against the invisible glass screen of the billboard, looking squished. Cross-screen interaction between the two independent billboards is required.
1. Image Generation Prompts (English)
Scene 1 Prompt (Left Billboard): MEDIUM: vertical 9:16 smartphone handheld POV photo. ART & VISUAL DIRECTION: Photorealistic night city street blended with a hyper-realistic 3D anamorphic billboard (VFX style). ENVIRONMENT: A busy city intersection at night. On the building, there is a giant 3D LED billboard showing the inside of a transparent glass box. NO TEXT. SUBJECT & POSITION: Inside the 3D billboard, an Anime-style Chibi character (e.g., a nun) is trapped. ACTION & EXPRESSION: The character is pressing her face and hands against the invisible front glass of the billboard. Her cheeks are squished flat against the glass, looking desperate. CAMERA: Low angle, looking up from the street.
Scene 2 Prompt (Right Billboard): MEDIUM: vertical 9:16 smartphone handheld POV photo. ART & VISUAL DIRECTION: Same VFX style, photorealistic city + 3D billboard. ENVIRONMENT: The adjacent building's 3D LED billboard at night. NO TEXT. SUBJECT & POSITION: Inside this second billboard, another Anime-style Chibi character (e.g., wearing a chick costume) stands behind a giant, glowing red button. ACTION & EXPRESSION: The character is pushing the red button with a determined expression. CAMERA: Low angle, looking up from the street.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '15초짜리 3D 광고판에 갇힌 스피키'
🎬 CLIP 1: [0-15초] 전광판을 넘나드는 상호작용 (Cross-Billboard Interaction)
목표: 15초 동안 핸드헬드 시점으로 두 개의 독립된 3D 옥외 전광판을 번갈아 비추며, 한 전광판의 행동이 다른 전광판에 영향을 미치는 VFX 연출을 구현한다.
OUTPUT SPECS: 15 seconds, vertical 9:16.
CINEMATOGRAPHY: Handheld smartphone POV from the street. The camera pans right from the first billboard to the second, then pans back left.
ENVIRONMENT: A photorealistic busy city street at night. Two giant 3D anamorphic billboards on adjacent buildings.
CHARACTER & PROP DESIGN: Two 3D Anime-style Chibi characters. Left billboard: A glass box (like a microwave). Right billboard: A giant red button.
ACTION:
[0s-5s]: The camera focuses on the left billboard. Character A is trapped inside, desperately banging on the glass, her face squished against the screen.
[5s-10s]: The camera smoothly pans right to the second billboard. Character B pushes the giant red button.
[10s-15s]: The camera pans quickly back to the left billboard. The glass box suddenly lights up. Character A stops banging, smiles happily, and spins around as the box functions like a microwave or elevator.
STRICT RULES: The 3D characters MUST remain strictly confined within the boundaries of their respective billboards. The illusion of depth (anamorphic 3D) must be maintained. Character A's face MUST show physical squishing against the flat glass plane. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 5: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 가까이 가면 움직이는 스피키 (원작 영상)
활용된 레퍼런스: 1인칭 호러 게임 스타일(FPS POV), 무궁화 꽃이 피었습니다(Red Light, Green Light) 생존 플롯
고정된 공간 및 소품 배치: 어둡고 버려진 듯한 실사 지하시설 또는 병원 복도(Creepy, abandoned corridor). 천장에는 파이프가 지나가고 형광등이 깜빡인다. 바닥에는 잔해물(돌, 쓰레기)이 흩어져 있다. 화면 하단에는 게임의 UI(주황색 게이지바와 경고 표지판)가 합성되어 있다.
고정된 캐릭터 위치 및 의상: 1인칭 시점의 플레이어(시청자)와, 멀리서 플레이어를 응시하는 2D/3D 애니메이션 SD 캐릭터(수녀복을 입은 은발 캐릭터).
물리적 제약 조건 (CRITICAL): 실사 호러 환경에 애니메이션 캐릭터가 위화감 없이 합성되어야 한다. 가장 중요한 규칙은 "카메라(시청자)의 시선이 다른 곳을 향하거나, 캐릭터에게 다가갈 때만 캐릭터가 무서운 속도로 다가온다"는 점이다. 캐릭터는 카메라가 똑바로 응시할 때는 무표정하게 멈춰있지만, 움직일 때는 관절이 꺾이거나 기괴하고 부자연스러운 속도(Fast-forward motion)로 다가오며 점프 스케어를 유발한다. 하단 게임 UI의 게이지가 찰수록 긴장감이 고조된다.
시나리오 (15초):
[0.0초~3.0초] 1인칭 시점. 어둡고 긴 복도 끝에 작고 귀여운 SD 캐릭터가 덩그러니 서 있다. 미동도 없이 시청자를 빤히 쳐다본다.
[3.0초~6.0초] 시청자(카메라)가 무심코 뒤를 돌아보거나 시선을 돌렸다가 다시 앞을 본다. 그 찰나의 순간, 저 멀리 있던 캐릭터가 이미 코앞까지 다가와 있다.
[6.0초~12.0초] 화면 하단의 경고 게이지가 차오른다. 시청자가 뒷걸음질을 치며 도망가려 하지만, 시선이 흔들릴 때마다 캐릭터와 또 다른 캐릭터들이 소름 돋는 속도("숨바꼭질 좋아요"라는 기괴한 대사와 함께)로 압박해 들어온다.
[12.0초~15.0초] 게이지가 끝까지 차오른 순간, 캐릭터의 얼굴이 화면 전체를 덮칠 듯이 기괴하게 줌인(Jump scare)되며 영상이 끝난다. 귀엽지만 소름 끼치는 얼굴이 클로즈업된다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic, dark, abandoned underground corridor or hospital hallway. Creepy atmosphere, flickering fluorescent lights, pipes on the ceiling, and debris on the floor. A retro video game UI (an orange threat gauge) is overlaid at the bottom of the screen.
[LOCKED_CAMERA_AND_POV]: 1st-person FPS (First-Person Shooter) survival POV. The camera acts as the viewer's eyes, featuring jerky, panicked movements (panning away, turning back, stepping backward).
[LOCKED_SUBJECTS]: Anime-style Chibi characters (e.g., a nun) composited into the realistic hallway. Photorealistic human hands (the viewer's hands) occasionally appear at the bottom of the frame, showing panic.
[LOCKED_PHYSICS]: "Red Light, Green Light" mechanics. The characters only move when the camera is not looking directly at them or during camera shake. When they move, they do so with unnatural, terrifying speed or jerky motions.
1. Image Generation Prompts (English)
Scene 1 Prompt (First Frame - The Stare): MEDIUM: vertical 9:16 smartphone 1st-person POV video still. ART & VISUAL DIRECTION: Photorealistic dark horror environment blended with an innocent-looking 2D/3D anime Chibi character (VFX style). Creepy cinematic lighting. ENVIRONMENT: An abandoned, dark, dirty concrete hallway. NO TEXT. SUBJECT & POSITION: Way down at the end of the long hallway, a cute anime Chibi character stands perfectly still in the shadows. ACTION & EXPRESSION: The character is staring dead-eyed directly into the camera lens. CAMERA: 1st-person POV, static.
Scene 2 Prompt (Last Frame - Jump Scare): MEDIUM: vertical 9:16 smartphone 1st-person POV video still. ART & VISUAL DIRECTION: Same VFX style, extreme close-up horror. ENVIRONMENT: Same dark hallway, but barely visible due to the extreme close-up. NO TEXT. SUBJECT & POSITION: The same anime Chibi character is now directly in front of the camera lens, filling almost the entire frame. ACTION & EXPRESSION: The character's face is extremely close, eyes wide and manic, staring directly into the viewer's soul, creating a terrifying jump scare. CAMERA: 1st-person POV, extreme close-up.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '가까이 가면 움직이는 스피키'
🎬 CLIP 1: [0-15초] 호러 숨바꼭질 점프스케어 (The Weeping Angel Jump Scare)
목표: 15초 동안 1인칭 시점에서 귀여운 캐릭터가 공포 게임의 몬스터처럼 기괴하게 다가오는 서스펜스와 점프 스케어를 연출한다.
OUTPUT SPECS: 15 seconds, vertical 9:16.
CINEMATOGRAPHY: Jerky 1st-person POV. The camera simulates panic: looking away, looking back quickly, and stepping backward.
ENVIRONMENT: Photorealistic dark, abandoned hallway with debris.
CHARACTER & PROP DESIGN: Central subject is an Anime Chibi character. A video game UI gauge is visible at the bottom.
ACTION:
[0s-3s]: The camera looks down the dark hallway. The Chibi character stands far away, perfectly still.
[3s-8s]: The camera quickly pans left/right or looks away, then looks back. The character has instantly teleported much closer. The camera starts shaking and moving backward in panic.
[8s-13s]: Every time the camera shakes or blinks, the character glitches and moves closer with terrifying, unnatural speed, joined by others.
[13s-15s]: Sudden jump scare. The character's face violently lunges into the camera lens, filling the screen with a manic expression.
STRICT RULES: The character must look innocent but act terrifying (dissonance). The character MUST NOT be seen walking normally; movement should be instantaneous or jerky like a stop-motion glitch. No text in the environment.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 6.5 },
{ "text": "좋아요 좋아요", "startTime": 6.5, "endTime": 10 },
{ "text": "숨바꼭질 좋아요", "startTime": 10, "endTime": 15 }
]

📥 [학습용 예시 7: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 동료의 머리를 썰어먹는(?) 디저트 타임 (원작 영상)
활용된 레퍼런스: 'Is it cake?' 밈, 차원 충돌 먹방, 약간의 시각적 충격과 반전 코미디
고정된 공간 및 소품 배치: 따뜻한 조명이 켜진 고급스러운 레스토랑 또는 카페 테이블(3D 환경). 테이블 위에는 접시 2개가 놓여 있으며, 각각의 접시 위에는 다른 애니메이션 캐릭터의 '머리' 모양과 똑같이 생긴 극사실주의 3D 케이크가 놓여 있다. 실사 금색 포크와 나이프가 놓여 있다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복을 입은 은발 캐릭터)가 테이블 맞은편에 앉아 있다. 카메라는 시청자의 1인칭 시점(POV)이다. 프레임 밖에서 시청자의 실사 두 손(Human hands)이 포크와 나이프를 쥐고 있다.
물리적 제약 조건 (CRITICAL): 시각적 충격(Bizarre)과 텍스처의 반전. 실사 나이프가 캐릭터 머리 모양의 3D 케이크를 정중앙으로 썰 때, 케이크가 갈라지며 안쪽의 폭신한 빵(Sponge), 생크림, 빨간 딸기잼(시각적 호러 착시 유발)의 디테일한 질감이 드러나야 한다. 맞은편에 앉은 캐릭터는 동료의 머리가 썰리는 것을 보고 처음엔 흠칫 놀라지만, 이내 그것이 케이크임을 깨닫고 입을 벌려 받아먹어야 한다. 음식(케이크)과 캐릭터 입의 상호작용 시 클리핑(Clipping)은 금지된다.
시나리오 (20초 내외):
[0.0초~5.0초] 1인칭 시점. 시청자의 실사 두 손이 나이프와 포크를 쥐고, 테이블 위 '동료 캐릭터 머리 모양'의 케이크를 자비 없이 반으로 쩍 가른다. 케이크가 갈라지며 김이 모락모락 나고 안쪽의 잼과 크림이 보인다.
[5.0초~12.0초] 맞은편에 앉은 캐릭터가 눈을 동그랗게 뜨고 놀라다가, 시청자의 손이 포크로 케이크 조각을 떠서 입가로 가져가자 행복한 표정으로 '아-' 하고 받아먹는다. 입가에 크림과 잼이 묻어 하찮음이 배가된다.
[12.0초~20.0초] 시청자의 두 손이 옆에 있던 두 번째 캐릭터 머리 모양 케이크도 동일하게 반으로 가른다. 맞은편 캐릭터는 기대에 찬 눈빛으로 기다리다가 연속으로 케이크를 받아먹으며 황홀한 표정으로 마무리된다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A warmly lit, elegant 3D anime-style restaurant or cafe. On the wooden table, there are two plates, each containing a cake that looks EXACTLY like a 3D Chibi character's head.
[LOCKED_CAMERA_AND_POV]: 1st-person viewer POV (Point of View). The camera is completely locked off (absolute static tripod shot) at eye level with the character sitting across the table.
[LOCKED_SUBJECTS]: An Anime-style Chibi character sitting across the table. Two hyper-realistic 3D cakes shaped like other characters' heads. Photorealistic human hands holding a real metal knife and fork.
[LOCKED_PHYSICS]: Cross-dimensional interaction and "Is it cake?" physics. The metal knife must smoothly slice through the 3D character-head cake, revealing a realistic sponge cake interior with cream and red jam. The 3D character must eat the cake piece from the photorealistic fork without clipping.
1. Image Generation Prompts (English)
Scene 1 Prompt (First Frame - The Shocking Cut): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. The environment and the character across the table are 3D anime style. The hands and cutlery are photorealistic. ENVIRONMENT: An elegant 3D cafe. NO TEXT. SUBJECT & POSITION: A cute anime Chibi character sits across the table. On the table, photorealistic human hands are using a knife to slice directly down the middle of a cake that is shaped EXACTLY like another anime character's head. ACTION & EXPRESSION: The cake splits open, revealing realistic sponge cake and red jam inside. The character sitting across the table looks surprised and slightly shocked. CAMERA: 1st-person POV, static.
Scene 2 Prompt (Middle Frame - The Sweet Relief): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same elegant 3D cafe. NO TEXT. SUBJECT & POSITION: The anime Chibi character is sitting at the table. The photorealistic human hand is feeding a piece of the sliced cake to the character using a fork. ACTION & EXPRESSION: The character is happily eating the cake, with some cream and red jam messily smeared on her cheeks. She looks incredibly happy and relieved. CAMERA: 1st-person POV, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '동료의 머리를 썰어먹는 디저트 타임'
🎬 CLIP 1: [0-20초] 충격적인 케이크 커팅과 먹방 루프 (The Cake Cut & Feed Loop)
목표: 20초 동안 1인칭 시점에서 동료의 머리 모양을 한 케이크를 썰어 기괴함을 연출하고, 이를 맛있게 받아먹는 캐릭터의 반전 코미디를 보여준다.
OUTPUT SPECS: 20 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Locked-off static camera.
ENVIRONMENT: Warmly lit, elegant 3D cafe table.
CHARACTER & PROP DESIGN: Central subject is a 3D Anime Chibi character. On the table are 3D cakes shaped like character heads. Photorealistic human hands, knife, and fork.
ACTION:
[0s-6s]: The photorealistic hands use a knife to slice the first character-head cake right down the middle. It reveals a fluffy cake interior with red jam. The sitting character looks shocked.
[6s-12s]: The hand uses a fork to feed a piece of the cake to the sitting character. She eats it happily, getting cream on her face.
[12s-20s]: The hands slice the second character-head cake. The sitting character is now excited and eagerly eats the next piece offered by the fork, smiling brightly with a messy face.
STRICT RULES: The cake MUST look exactly like a character's head from the outside, but clearly look like baked cake on the inside. The red jam should briefly give a bizarre/gory illusion before being eaten. The fork and cake must interact seamlessly with the character's mouth (No Clipping). No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 20 }
]

📥 [학습용 예시 8: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 젤리 뺏기 방어전 (원작 영상)
활용된 레퍼런스: 차원 충돌 먹방(실사 음식과 애니메이션 캐릭터 상호작용), 소유욕/방어 기제 코미디
고정된 공간 및 소품 배치: 밝은 실내의 나무 재질 책상 위. 책상 중앙에는 알록달록한 실제 젤리(Real jelly candies)가 가득 담긴 하얀색 실사 접시가 놓여 있다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복을 입은 은발 캐릭터)가 책상 맞은편에 앉아 얼굴과 두 손만 내밀고 있다. 카메라는 시청자의 1인칭 시점(POV)이다. 프레임 하단에서 시청자의 실사 손(Human hand)이 등장해 접시를 조종한다.
물리적 제약 조건 (CRITICAL): 완벽한 실사 오브젝트와 카툰 캐릭터의 텐션(Tension) 상호작용. 시청자의 손이 실사 접시를 밀어줄 때 그림자가 자연스럽게 이동해야 한다. 캐릭터가 카툰 손으로 실사 젤리를 집어 입에 넣을 때 클리핑(Clipping)이 발생하지 않아야 한다. 가장 중요한 것은 후반부의 '물리적 줄다리기'다. 시청자의 손이 접시를 빼앗으려 당길 때, 캐릭터가 카툰 양손으로 실사 접시의 테두리를 꽉 붙잡아 저항하는 물리적 힘의 충돌이 명확하게 표현되어야 한다.
시나리오 (15초):
[0.0초~4.0초] 1인칭 시점. 시청자의 실사 손이 젤리가 가득 담긴 하얀 접시를 맞은편 캐릭터 쪽으로 스윽 밀어준다. 캐릭터의 눈이 반짝거리며 기뻐한다.
[4.0초~11.0초] 캐릭터가 작은 두 손을 바쁘게 움직여 젤리를 하나씩 집어 맛있게 옴뇸뇸 먹는다. 입가에 부스러기가 묻으며 행복한 먹방이 이어진다.
[11.0초~15.0초] 갑자기 시청자의 실사 손이 다시 나타나 남은 젤리 접시를 뺏으려고 몸쪽으로 당긴다. 캐릭터가 흠칫 놀라더니, 뺏기지 않으려고 재빨리 양손으로 접시 테두리를 꽉 붙잡고 버틴다. "이건 내 거야!"라는 듯한 경계심 가득한 표정으로 시청자를 올려다본다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A wooden desk in a well-lit indoor room. On the desk, there is a real white plate filled with colorful real jelly candies.
[LOCKED_CAMERA_AND_POV]: 1st-person viewer POV. The camera is locked off (static tripod shot) slightly above the desk level.
[LOCKED_SUBJECTS]: An Anime-style Chibi character sitting across the desk. A photorealistic human hand entering from the bottom of the frame.
[LOCKED_PHYSICS]: Cross-dimensional object interaction and physical resistance. The 3D/2D cartoon hands must hold the real jelly candies without clipping. At the end, a physical tug-of-war occurs: the real human hand pulls the plate, and the cartoon hands firmly grip the plate to stop it from moving.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Happy Feast): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic food and hands mixed with a 2D/3D anime Chibi character. ENVIRONMENT: Wooden desk indoors. NO TEXT. SUBJECT & POSITION: An anime Chibi character sits across the desk. In front of her is a photorealistic white plate full of real colorful jelly candies. ACTION & EXPRESSION: The character is using her cartoon hands to pick up a real jelly and eat it. She has a very happy, sparkling expression with food crumbs on her face. CAMERA: 1st-person POV, static.
Scene 2 Prompt (The Defense): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same wooden desk. NO TEXT. SUBJECT & POSITION: The anime Chibi character and the jelly plate. A photorealistic human hand from the bottom of the frame is holding the edge of the plate, trying to pull it away. ACTION & EXPRESSION: The Chibi character has both of her cartoon hands firmly clamped down on the opposite edge of the real plate, actively resisting the human hand. She looks up directly at the camera with a protective, slightly angry, and defensive expression ("Mine!"). CAMERA: 1st-person POV, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '젤리먹방 기싸움 방어전'
🎬 CLIP 1: [0-15초] 평화로운 먹방과 치열한 방어전 (The Feast & The Tug-of-War)
목표: 15초 동안 1인칭 시점에서 실사 음식을 먹게 해 주다가 갑자기 뺏으려 할 때, 캐릭터가 접시를 사수하며 보여주는 귀여운 방어 기제를 연출한다.
OUTPUT SPECS: 15 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Locked-off static camera.
ENVIRONMENT: Photorealistic wooden desk indoors.
CHARACTER & PROP DESIGN: Central subject is an Anime Chibi character. Props are photorealistic: a human hand, a white plate, and colorful jelly candies.
ACTION:
[0s-4s]: The photorealistic human hand slides the plate of real jellies across the desk toward the Chibi character.
[4s-11s]: The character happily picks up the real jellies with her cartoon hands and eats them, chewing enthusiastically.
[11s-15s]: The human hand reaches back into the frame and pulls the plate away. Instantly, the Chibi character slams both of her hands onto the plate, gripping it tightly to stop it. She stares directly into the camera lens with a defensive, greedy expression.
STRICT RULES: The cartoon hands MUST interact perfectly with the real plate and jellies (No Clipping). The physical tension of the tug-of-war at the end must be clear—the plate stops moving because the character is holding it down. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 9: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 눈덩이 맞고 각성한 초보 스노보더 (원작 영상)
활용된 레퍼런스: 1인칭 상호작용(물리적 타격), 무능함에서 압도적 능력으로의 급격한 각성(Awakening), 극단적 대비(Contrast) 코미디
고정된 공간 및 소품 배치: 햇빛이 비치는 눈 덮인 실사 스키장(Real-world snowy slope). 배경에는 침엽수림과 산맥이 보인다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터가 실사 스노보드 위에 철푸덕 주저앉아 있다. 카메라는 시청자의 1인칭 시점(POV)이며, 시청자의 실사 손(장갑을 낀 손)이 화면 아래에서 등장한다.
물리적 제약 조건 (CRITICAL): 1인칭 시점의 물리적 타격과 액션의 급변. 시청자의 손이 만든 '실사 눈덩이'가 카툰 캐릭터의 얼굴에 정확히 명중해야 하며, 명중한 직후 눈송이 파편이 얼굴에 묻어있어야 한다(상호작용의 흔적). 타격 직후 캐릭터의 표정이 '겁먹고 불쌍한 표정'에서 '분노/결연한 표정'으로 180도 바뀌어야 한다. 각성 이후에는 물리 법칙을 무시하듯 완벽하고 역동적인 스노보딩 액션(점프, 턴, 눈보라 효과)이 3D 카툰 스타일로 화려하게 연출되어야 연출되어야 한다.
시나리오 (30초 내외):
[0.0초~5.0초] 1인칭 시점. 귀여운 SD 캐릭터가 스노보드 위에서 일어나지 못하고 바닥에 주저앉아 덜덜 떨며 울먹이고 있다. 매우 하찮고 무능해 보인다.
[5.0초~10.0초] 시청자의 실사 장갑 낀 손이 화면에 나타나 눈덩이를 뭉치더니, 캐릭터의 얼굴을 향해 가차 없이 던진다. '퍽' 소리와 함께 캐릭터 얼굴에 눈이 정통으로 맞는다.
[10.0초~15.0초] 얼굴에 눈을 뒤집어쓴 캐릭터. 울먹이던 표정이 싹 사라지고, 눈빛이 매섭고 진지하게 돌변한다(각성 모드).
[15.0초~30.0초] 캐릭터가 벌떡 일어나더니 프로 선수처럼 엄청난 속도로 설원을 질주하기 시작한다. 화려한 점프와 회전 기술을 선보이며 눈보라를 일으킨다. 하찮음은 온데간데없고 웅장함만 남은 채 영상이 끝난다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic snowy ski slope on a sunny day. Pine trees and mountains in the background. The snow reflects the sunlight.
[LOCKED_CAMERA_AND_POV]: 1st-person viewer POV (Point of View). The camera is stationary during the setup, then follows the character dynamically during the action sequence.
[LOCKED_SUBJECTS]: An Anime-style Chibi character. A photorealistic human hand wearing a winter glove. A realistic snowboard. Real snow.
[LOCKED_PHYSICS]: Physical trigger and extreme dynamic shift. A real snowball thrown by the real hand must physically hit the cartoon character's face, leaving snow debris. The character's animation must abruptly transition from clumsy/static to highly dynamic, fast-paced extreme sports action without losing character identity.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Clumsy Setup): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic snowy mountain environment and a 2D/3D anime Chibi character. ENVIRONMENT: Bright, sunny ski slope. NO TEXT. SUBJECT & POSITION: An anime Chibi character sits helplessly on a real snowboard in the snow, looking clumsy and about to cry. ACTION & EXPRESSION: She looks extremely timid, pathetic, and scared. CAMERA: 1st-person POV, static.
Scene 2 Prompt (The Awakening Hit): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same snowy slope. NO TEXT. SUBJECT & POSITION: The anime Chibi character is still on the board. A photorealistic gloved human hand is visible at the bottom of the frame, having just thrown a real snowball. ACTION & EXPRESSION: The snowball hits the character's face. The character's face is covered in snow splatters. Her expression instantly changes from crying to intensely serious, angry, and completely focused (an "awakened" look). CAMERA: 1st-person POV, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '눈덩이 맞고 각성한 초보 스노보더'
🎬 CLIP 1: [0-30초] 하찮은 초보와 분노의 눈덩이 각성 (The Snowball Trigger & Pro Rider)
목표: 30초 동안 무능했던 캐릭터가 1인칭 물리적 타격(눈덩이)을 기점으로 압도적인 능력을 뽐내는 반전 액션을 연출한다.
OUTPUT SPECS: 30 seconds, vertical 9:16.
CINEMATOGRAPHY: Starts with a locked-off 1st-person POV. After the awakening (15s mark), the camera dynamically follows the character racing down the slope, capturing high-speed action.
ENVIRONMENT: Photorealistic sunny ski slope with pine trees.
CHARACTER & PROP DESIGN: Central subject is an Anime Chibi character. Props include a photorealistic gloved hand, a real snowball, and a snowboard.
ACTION:
[0s-5s]: The Chibi character sits clumsily on the snowboard, trembling and looking pathetic.
[5s-10s]: A photorealistic gloved hand throws a real snowball right into the character's face.
[10s-15s]: Snow is stuck to the character's face. She stops trembling. Her expression shifts dramatically to deadpan, intense, and furious.
[15s-30s]: The character suddenly stands up and snowboards down the mountain at extreme speed, performing pro-level jumps and spins, leaving a massive trail of snow.
STRICT RULES: The emotional shift from 'pathetic' to 'overpowered/serious' must be instant and clear. The snowball MUST connect with the face realistically. The high-speed action in the second half must be smooth and dynamic without breaking the 3D Chibi design. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 30 }
]

📥 [학습용 예시 12: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 퇴근 후 직장인의 이중생활 (원작 영상)
활용된 레퍼런스: 극단적 상태 변화(Duality) 코미디, 실사 배경 합성(VFX), 스폰지밥 타임카드 트랜지션
고정된 공간 및 소품 배치:
씬 A(현관): 실사(Real-world) 아파트 현관문과 복도. 바닥에는 마룻바닥과 러그가 깔려 있다. 실사 핸드백이 등장한다.
씬 B(책상): 화려한 RGB 조명이 켜진 실사 게이밍 데스크탑 환경. 커다란 검은색 게이밍 의자, 실사 기계식 키보드, 마우스, 모니터가 있다.
고정된 캐릭터 위치 및 의상: 3D 애니메이션 SD 캐릭터. 씬 A에서는 바닥을 쓸듯이 낮게 떠서(Floating) 들어오고, 씬 B에서는 게이밍 의자에 파묻히듯 앉아 있다.
물리적 제약 조건 (CRITICAL): 두 씬 사이의 완벽한 감정적/육체적 텐션의 대비. 씬 A에서는 중력을 상실한 듯 흐느적거리는 연체동물 같은 텍스처로 허공을 떠다니며, 가방을 바닥에 툭 떨어뜨리는 물리적 중력 상호작용이 일어나야 한다. 씬 B에서는 실사 키보드를 빛의 속도로 두드리는 역동적이고 빠릿빠릿한 모션과 초롱초롱한 눈빛이 필수다. 두 씬 사이에는 반드시 '시간 경과를 나타내는 밈 화면(예: 2 Seconds Later)'이 삽입되어 코미디의 템포를 만든다.
시나리오 (15초 내외):
[0.0초~5.0초] 1인칭 시점. 실사 아파트 현관문이 열린다. 3D 애니메이션 캐릭터가 영혼이 완전히 나간 퀭한 표정으로, 두 팔을 늘어뜨린 채 바닥을 스치듯 유령처럼 떠서 들어온다. 들고 있던 가방을 바닥에 힘없이 '툭' 떨어뜨리고 거실 쪽으로 스르륵 흘러간다.
[5.0초~7.0초] 화면 전환. "2 SECONDS LATER (2초 뒤)" 라는 스폰지밥 스타일의 타임카드가 뜬다.
[7.0초~15.0초] 화려한 조명의 실사 게이밍 책상 앞. 금방이라도 쓰러질 것 같던 캐릭터가 거대한 게이밍 의자에 앉아 엄청난 텐션으로 게임을 하고 있다. 동공은 확장되어 반짝거리고, 입가엔 광기 어린 미소가 번져 있으며, 짧은 두 손으로 키보드를 미친 듯이 연타한다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT_1]: A photorealistic, well-lit modern apartment entrance and hallway with wooden floors.
[LOCKED_ENVIRONMENT_2]: A photorealistic gaming setup in a dark room illuminated by RGB monitor lights. A large black gaming chair, real mechanical keyboard, and mouse.
[LOCKED_CAMERA_AND_POV]: 3rd-person observer POV. Scene 1 uses a subtle tracking shot following the character. Scene 2 uses a static or slow zoom-in shot on the character's profile.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character interacting with the real world. A real handbag. Real gaming peripherals.
[LOCKED_PHYSICS]: Scene 1: Zero-energy floating physics. The character moves like a limp ghost, ignoring walking animations. Scene 2: High-energy interaction. The cartoon hands must interact firmly with the real keyboard keys. Extreme facial expression shift.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Exhausted Return): MEDIUM: vertical 9:16 smartphone video still. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic apartment hallway with a 3D anime Chibi character. ENVIRONMENT: Modern apartment, front door open. NO TEXT. SUBJECT & POSITION: A 3D anime Chibi character is floating horizontally just above the floor like a ghost, entering the apartment. A photorealistic handbag is dropping to the floor beside her. ACTION & EXPRESSION: She looks utterly exhausted, drained of life, with half-closed, dead eyes and limp arms. CAMERA: 3rd-person tracking.
Scene 2 Prompt (The Gamer Awakening): MEDIUM: vertical 9:16 smartphone video still. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Photorealistic gaming desk, glowing monitor screen, RGB lights. NO TEXT. SUBJECT & POSITION: The same 3D anime Chibi character is now sitting in a large photorealistic black gaming chair. Her cartoon hands are resting on a real mechanical keyboard. ACTION & EXPRESSION: She is highly energetic, leaning forward. Her eyes are huge, sparkling with excitement and dopamine. She has a huge, almost manic smile. CAMERA: Side profile, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '퇴근 후 직장인의 이중생활'
🎬 CLIP 1: [0-5초] 방전된 좀비의 퇴근 (The Soulless Arrival)
목표: 완전 방전되어 영혼 없이 귀가하는 직장인의 하찮고 불쌍한 모습을 연출한다.
OUTPUT SPECS: 5 seconds, vertical 9:16.
ENVIRONMENT: Photorealistic modern apartment hallway.
ACTION: The real door opens. The Chibi character floats inside, hovering inches above the floor like a limp balloon. Her arms dangle. She drops a real handbag to the floor with a thud and continues floating lifelessly forward. Her face shows zero energy, dead eyes.
STRICT RULES: NO walking animation. The character must float in a creepy/funny lifeless manner. No text in the video.
🎬 CLIP 2: [5-7초] 트랜지션 (SpongeBob Time Card)
목표: 코미디의 템포를 끊어주는 밈적 트랜지션. (편집 단계에서 "2 SECONDS LATER" 이미지 삽입)
🎬 CLIP 3: [7-15초] 도파민 풀충전 게이머 (The Dopamine Rush)
목표: 2초 전의 피곤함은 거짓말인 것처럼 취미 생활에 광적으로 몰입하는 반전 상태를 보여준다.
OUTPUT SPECS: 8 seconds, vertical 9:16.
ENVIRONMENT: Photorealistic gaming desk with RGB lighting.
ACTION: The Chibi character sits in the real gaming chair. She is furiously and rapidly mashing the keys of the real mechanical keyboard. Her face is illuminated by the monitor. She smiles brightly, eyes sparkling with intense dopamine and focus.
STRICT RULES: The energy shift must be extreme (0% to 200%). The cartoon hands must not clip through the real keyboard. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "2 SECONDS LATER", "startTime": 5.0, "endTime": 7.0 }
]

📥 [학습용 예시 13: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 갈매기에게 과자 주다가 밟힌 스피키 (원작 영상)
활용된 레퍼런스: 실사 환경 합성(VFX), 야생 동물과의 상호작용, 하찮은 캐릭터의 수난사(재난 코미디)
고정된 공간 및 소품 배치: 파도가 치는 탁 트인 겨울 바다 해변(Real-world beach). 모래사장 위에는 실사 갈매기들이 한두 마리 서 있다. 캐릭터는 실사 과자 봉지(새우강)를 품에 안고 있으며, 주변에는 실제 과자들이 흩어져 있다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복 은발 캐릭터)가 모래사장 한복판에 서 있다. 카메라는 캐릭터를 정면에서 바라보는 3인칭 관찰자 시점이다.
물리적 제약 조건 (CRITICAL): 실사 동물(갈매기)과 캐릭터의 물리적 충돌 및 가려짐(Occlusion). 갈매기 떼가 달려들 때 캐릭터의 몸 위를 실제로 밟고 지나가거나, 캐릭터가 바닥에 쓰러졌을 때 갈매기의 날개와 몸통이 캐릭터를 완전히 가려버리는 층위(Layer) 처리가 핵심이다. 캐릭터는 갈매기들의 무게에 눌려 모래바닥에 납작하게 찌그러져야 하며, 과자 봉지가 터지며 과자가 쏟아지는 물리 효과가 동반되어야 한다.
시나리오 (15초 내외): [0.0초~3.0초] 평화로운 바닷가. SD 캐릭터가 수줍게 과자 봉지를 들고 갈매기 한 마리에게 과자를 건네준다. 이때까진 매우 평화로운 분위기다.
[3.0초~8.0초] 갑자기 어디선가 수십 마리의 실사 갈매기 떼가 '끼룩' 소리를 내며 화면 밖에서 캐릭터를 향해 무섭게 돌진한다. 캐릭터는 당황하여 동공이 흔들린다.
[8.0초~15.0초] 아수라장이 시작된다. 갈매기 떼가 과자 봉지를 뺏기 위해 캐릭터를 덮친다. 캐릭터는 비명을 지르며 모래바닥에 '철푸덕' 쓰러지고, 수많은 갈매기 발에 밟히며 화면에서 거의 사라질 정도로 뒤엉킨다. 쏟아지는 과자와 펄럭이는 날개 사이로 캐릭터의 하찮은 발버둥이 보이며 영상이 끝난다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic winter beach with crashing waves. The sand is scattered with pieces of real snacks/chips.
[LOCKED_CAMERA_AND_POV]: 3rd-person observer POV. The camera is locked directly in front of the character.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character. Photorealistic seagulls. A photorealistic bag of chips.
[LOCKED_PHYSICS]: Extreme occlusion and physical overlapping. Dozens of real seagulls must physically trample over the cartoon character's body. When the character falls onto the sand, the seagulls' wings and bodies must completely cover and overwhelm the character in multiple layers. The chip bag must burst with physics.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Peaceful Snack): MEDIUM: vertical 9:16 smartphone 3rd-person photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic beach and seagull with a 3D anime Chibi character. ENVIRONMENT: A photorealistic sandy beach with crashing ocean waves. NO TEXT. SUBJECT & POSITION: A cute 3D anime Chibi character stands in the center, holding a photorealistic open bag of chips. One photorealistic seagull is standing peacefully in front of her. ACTION & EXPRESSION: She is shyly offering a chip to the seagull with a gentle, peaceful smile. CAMERA: 3rd-person POV, static.
Scene 2 Prompt (The Trampling): MEDIUM: vertical 9:16 smartphone 3rd-person photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same beach. NO TEXT. SUBJECT & POSITION: The 3D anime Chibi character is lying flat on the sand. Dozens of photorealistic seagulls are swarming aggressively on top of her. ACTION & EXPRESSION: The Chibi character is completely overwhelmed, screaming and struggling under the weight of the seagulls. Seagull wings and feet are physically trampling her. Real chips are flying everywhere in the air. CAMERA: 3rd-person POV, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '갈매기에게 과자 주다가 밟힌 쓰루키'
🎬 CLIP 1: [0-15초] 평화로운 바닷가와 갈매기 떼의 습격 (The Seagull Swarm)
목표: 15초 동안 실사 갈매기 떼가 화면을 덮치며 캐릭터를 짓밟는 아수라장(Occlusion/Layering)을 연출한다.
OUTPUT SPECS: 15 seconds, vertical 9:16.
CINEMATOGRAPHY: 3rd-person POV. Locked-off static camera.
ENVIRONMENT: Photorealistic beach with ocean waves.
CHARACTER & PROP DESIGN: Anime Chibi character. Photorealistic seagulls and bag of chips.
ACTION:
[0s-3s]: The Chibi character peacefully offers a chip to a single seagull.
[3s-8s]: Suddenly, from completely off-screen, dozens of seagulls aggressively dive and swarm toward the character. The character's eyes widen in sheer panic.
[8s-15s]: Total chaos. The seagulls violently crash into the character, causing her to fall flat onto the sand. The swarm completely overwhelms her. The photorealistic birds physically step on and trample the cartoon character. Real chips burst into the air. Only her little arms can be seen weakly flailing from under the pile of birds.
STRICT RULES: The 3D character MUST be physically occluded (covered) by the birds. The interaction of the bird feet stepping on the cartoon body must be clear. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 14: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 너무 작아서 자동문이 못 알아봄 (원작 영상)
활용된 레퍼런스: 물리적 한계(단신) 코미디, 실사 환경(자동문)과의 논리적 상호작용, 캐릭터 합체(Piggyback) 문제 해결.
고정된 공간 및 소품 배치: 실사(Real-world) 건물의 1층 입구. 커다란 통유리로 된 자동문(Automatic sliding door)이 닫혀 있다. 카메라 시점은 바닥에 아주 가깝게 붙은 극단적인 로우 앵글(Low angle, 3인칭 관찰자 시점)로, 거대한 실사 문과 캐릭터들의 작은 체구를 극명하게 대비시킨다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터 2명. 캐릭터 A(메이드복 핑크머리)가 먼저 문 앞에 서 있고, 이후 캐릭터 B(수녀복 은발)가 합류한다.
물리적 제약 조건 (CRITICAL): 캐릭터의 크기와 실사 자동문 센서의 상호작용. 캐릭터 1명은 너무 작고 가벼워서 센서가 인식하지 못해 문이 닫힌 상태를 유지해야 한다. 캐릭터 A가 캐릭터 B의 어깨 위로 올라타는 '목말(Piggyback/Stacking)' 물리 모션 시 폴리곤이 겹치지(Clipping) 않게 자연스러워야 한다. 가장 중요한 포인트는 두 캐릭터가 합체하여 키가 커진 순간, 실사 자동문이 이를 인식하고 스르륵 열리는 '타이밍 동기화(Sync)'다.
시나리오 (16초 내외):
[0.0초~5.0초] 실사 건물 자동문 앞. SD 캐릭터 A가 문 앞에 서서 들어가려 하지만, 체구가 너무 작아 센서가 인식하지 못해 문이 굳게 닫혀 있다. 캐릭터 A가 들어가지 못하고 서성인다.
[5.0초~10.0초] 화면 옆에서 캐릭터 B가 종종걸음으로 다가와 합류한다. 하지만 여전히 문은 열리지 않고, 두 캐릭터는 닫힌 문을 보며 잠시 고민한다.
[10.0초~16.0초] 캐릭터 A가 폴짝 뛰어 캐릭터 B의 어깨(머리) 위로 올라타 목말을 탄다. 두 캐릭터가 위아래로 쌓여 키가 두 배가 된 순간, 머리 위 센서가 반응하며 자동문이 부드럽게 스르륵 열린다. 두 캐릭터는 목말을 탄 기괴하고 귀여운 자세 그대로 건물 안으로 당당하게 걸어 들어간다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: The ground floor entrance of a photorealistic real-world building. A large, closed automatic sliding glass door. The camera angle is an extreme low angle, almost touching the floor, emphasizing the massive size of the door.
[LOCKED_CAMERA_AND_POV]: 3rd-person observer POV. Extreme low angle, static camera looking up slightly at the door.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi characters. A photorealistic automatic glass door with a top sensor.
[LOCKED_PHYSICS]: Character stacking (Piggyback) and synchronized environment reaction. The cartoon characters must physically stack on top of each other without clipping. Crucially, the real-world automatic door's sliding animation MUST be perfectly triggered the moment the characters stack up and reach the sensor's height limit.
1. Image Generation Prompts (English)
Scene 1 Prompt (Too Short): MEDIUM: vertical 9:16 smartphone video still. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic glass automatic door and a 3D anime Chibi character. ENVIRONMENT: Ground floor building entrance with a giant photorealistic closed automatic glass door. NO TEXT. SUBJECT & POSITION: A very small 3D anime Chibi character stands right in front of the massive closed door. ACTION & EXPRESSION: She is looking up at the sensor, looking confused and frustrated because the door won't open. CAMERA: 3rd-person extreme low angle, from the floor looking up.
Scene 2 Prompt (The Piggyback Success): MEDIUM: vertical 9:16 smartphone video still. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same building entrance. NO TEXT. SUBJECT & POSITION: Two 3D anime Chibi characters are stacked together (one giving a piggyback ride to the other). In front of them, the massive photorealistic glass automatic door is sliding open. ACTION & EXPRESSION: The top character is looking confident. They are successfully triggering the door sensor with their combined vertical height. CAMERA: 3rd-person extreme low angle, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '너무 작아서 안 열리는 자동문'
🎬 CLIP 1: [0-10초] 안 열리는 문과 동료의 합류 (Too Short)
목표: 센서가 인식하지 못하는 단신의 하찮은 상황과 동료의 등장을 로우앵글로 연출한다.
OUTPUT SPECS: 10 seconds, vertical 9:16.
CINEMATOGRAPHY: 3rd-person extreme low angle. Locked-off static camera.
ENVIRONMENT: Photorealistic building entrance with a large closed automatic glass door.
CHARACTER & PROP DESIGN: Two Anime Chibi characters.
ACTION:
[0s-5s]: Character A stands in front of the giant door. The door does not open. She looks around confused.
[5s-10s]: Character B waddles into the frame and stands next to Character A. They look up at the sensor, then at each other in realization.
STRICT RULES: The door MUST remain completely closed during this clip.
🎬 CLIP 2: [10-16초] 합체와 자동문 돌파 (The Piggyback Solution)
목표: 6초 동안 캐릭터들이 물리적으로 합체(목말)하고, 실사 환경(자동문)이 이에 즉각적으로 반응하여 열리는 물리적/논리적 동기화를 연출한다.
OUTPUT SPECS: 6 seconds, vertical 9:16.
CINEMATOGRAPHY: 3rd-person extreme low angle. Locked-off static camera.
ENVIRONMENT: Same photorealistic entrance.
ACTION:
[0s-3s]: Character A jumps onto Character B's shoulders, forming a piggyback stack.
[3s-6s]: The moment they stack up and increase their height, the photorealistic automatic glass door smoothly slides open. The stacked characters confidently waddle forward inside the building.
STRICT RULES: Perfect timing is required. The sliding door animation MUST start EXACTLY when the characters finish stacking. Perfect cartoon physics—they must not clip through each other during the piggyback. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 16 }
]

📥 [학습용 예시 15: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 운전하다 스피키랑 코미 봄 (원작 영상)
활용된 레퍼런스: 이동하는 실사 환경(주행 뷰) 합성(Moving VFX), 1인칭 관찰자 시점의 돌발 조우, 사이드카/스쿠터 탑승 코미디
고정된 공간 및 소품 배치: 야자수가 늘어선 화창한 날의 실사 도로(Real-world road). 카메라는 오토바이를 운전하는 사람의 1인칭 시점이며, 화면 하단에 오토바이의 핸들바와 백미러가 보인다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터 2명. 한 명은 실사 재질의 '클래식 사이드카 스쿠터'를 운전하고 있고, 다른 한 명(수녀복 은발)은 옆의 사이드카에 편안하게 앉아 있다.
물리적 제약 조건 (CRITICAL): 주행 중인 실사 도로 환경과 3D 모델의 완벽한 속도 동기화. 스쿠터가 실사 도로 위를 달릴 때 그림자가 아스팔트 위를 자연스럽게 흘러가야 한다. 1인칭 오토바이 시점의 카메라 떨림과 바람의 속도감이 유지되어야 한다. 가장 중요한 포인트는 나란히 달리는 동안 사이드카에 탄 캐릭터가 카메라(시청자)를 쳐다보고 인사(Waving)하는 동적 상호작용이다.
시나리오 (16초 내외):
[0.0초~5.0초] 화창한 실사 도로, 1인칭 시점의 오토바이가 주행 중이다. 고개를 왼쪽으로 돌리자, 나란히 달리고 있는 빈티지 사이드카 스쿠터가 프레임 안으로 들어온다.
[5.0초~12.0초] 스쿠터에는 귀여운 3D 애니메이션 SD 캐릭터 두 명이 타고 있다. 운전자는 진지하게 앞을 보고 달리고, 사이드카에 앉은 캐릭터는 오토바이(시청자)를 발견하더니 해맑게 미소 지으며 짧은 팔로 "안녕-" 하고 손을 흔들어 준다.
[12.0초~16.0초] 스쿠터가 갑자기 부앙- 하고 속도를 내며 시청자의 오토바이를 추월해 앞으로 달려나간다. 멀어지는 스쿠터의 귀여운 뒷모습을 바라보며 영상이 마무리된다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic sunny road lined with palm trees. The background moves continuously to simulate forward driving.
[LOCKED_CAMERA_AND_POV]: 1st-person driving POV from a motorcycle. The bottom of the frame shows real motorcycle handlebars and a side mirror. The camera experiences minor driving shakes.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi characters. A photorealistic vintage scooter with an attached sidecar.
[LOCKED_PHYSICS]: High-speed moving VFX synchronization. The photorealistic scooter carrying the 3D characters must seamlessly match the forward movement and speed of the background road. The cartoon character in the sidecar must visually lock onto the camera lens and wave while moving.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Parallel Drive): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash in a moving environment. Photorealistic road and scooter with 3D anime Chibi characters. ENVIRONMENT: Sunny asphalt road with palm trees. Motion blur on the road to simulate driving speed. NO TEXT. SUBJECT & POSITION: In the lane next to the camera, a photorealistic vintage scooter with a sidecar is driving alongside. A 3D anime Chibi character is driving, and another cute Chibi character is sitting in the sidecar. ACTION & EXPRESSION: Driving parallel. CAMERA: 1st-person POV from another moving motorcycle, looking slightly right.
Scene 2 Prompt (The Wave & Overtake): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same moving road. NO TEXT. SUBJECT & POSITION: The same vintage scooter with the Chibi characters. ACTION & EXPRESSION: The Chibi character in the sidecar turns her head, looks directly at the camera with a big happy smile, and raises her very short arm to wave "Hello!". The scooter begins to speed up to overtake the camera. CAMERA: 1st-person POV, tracking the scooter.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '운전하다 우연히 만난 스피키'
🎬 CLIP 1: [0-16초] 나란히 주행 & 인사 후 추월 (The Parallel Drive & Waving)
목표: 16초 동안 실사 주행 환경에서 3D 캐릭터들이 탄 사이드카 스쿠터가 나란히 물리적으로 질주하며 상호작용하는 레이싱 VFX를 연출한다.
OUTPUT SPECS: 16 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV from a moving motorcycle. Slight handheld driving shake.
ENVIRONMENT: Photorealistic sunny road with palm trees rolling past to simulate speed.
CHARACTER & PROP DESIGN: Two Anime Chibi characters. A photorealistic vintage scooter with a sidecar.
ACTION:
[0s-5s]: The camera looks forward at the moving road, then turns slightly to the side to see a photorealistic scooter with a sidecar driving perfectly parallel. The Chibi characters are riding it.
[5s-12s]: The driver character stares intensely at the road. The Chibi passenger in the sidecar looks over, sees the camera, smiles brightly, and waves her small cartoon hand.
[12s-16s]: The scooter suddenly accelerates with a burst of speed, overtaking the POV camera and zooming forward into the distance.
STRICT RULES: The speed of the background road, the POV camera, and the sidecar MUST synchronize perfectly to create the illusion of two vehicles driving at the same speed. The shadow of the sidecar on the road must look realistic. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 16 }
]

📥 [학습용 예시 16: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 괴롭힘과 막대사탕 보상 (원작 영상)
활용된 레퍼런스: 차원 충돌(VFX), 물리적 상호작용(머리 찌그러짐), 즉각적인 태세 전환(감정의 180도 변화) 코미디.
고정된 공간 및 소품 배치: 실사(Real-world) 방 안의 책상 위. 배경에는 노트북(화면 켜짐)과 침대가 보인다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복 은발)가 책상 위에 다소곳이 앉아 있다. 1인칭 관찰자 시점(POV)이며, 시청자의 실사 손이 프레임 우측에서 개입한다. 실사 막대사탕(츄파춥스)이 등장한다.
물리적 제약 조건 (CRITICAL): 실사 손과 카툰 캐릭터의 상호작용. 시청자의 손이 캐릭터의 머리를 쓰다듬거나 꾹꾹 누를 때, 캐릭터의 머리가 물리적인 압력에 의해 살짝 눌리거나 찌그러지는(Squish) 반응이 있어야 한다. 사탕이 주어졌을 때, 카툰 캐릭터의 두 손이 실사 사탕의 막대를 자연스럽게 감싸 안아야 한다(No Clipping). 슬픔에서 기쁨으로의 표정 변화가 0.1초 만에 즉각적으로 이루어져야 한다.
시나리오 (16초 내외):
[0.0초~8.0초] 1인칭 시점. 실사 책상 위에 앉아있는 귀여운 캐릭터. 시청자의 실사 손이 캐릭터의 머리를 장난스럽게 툭툭 치고 누른다. 캐릭터는 괴롭힘에 서러워하며 눈물을 글썽이고 매우 불쌍한 표정으로 울먹인다.
[8.0초~11.0초] 시청자의 손이 갑자기 빨간색 실사 막대사탕을 꺼내 캐릭터의 얼굴 앞으로 내민다.
[11.0초~16.0초] 사탕을 본 순간, 울먹이던 캐릭터의 눈이 별 모양으로 반짝이며 환하게 웃는다. 캐릭터가 짧은 양손으로 실사 막대사탕을 꼭 끌어안고 세상 다 가진 듯 행복해하며 영상이 끝난다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic real-world bedroom desk. A laptop screen and a bed are visible in the background.
[LOCKED_CAMERA_AND_POV]: 1st-person POV. The camera acts as the eyes of a person sitting at the desk. The person's real photorealistic hands will enter the frame from the bottom/sides to interact with things on the desk.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character. A photorealistic hand. A photorealistic red Chupa Chups lollipop.
[LOCKED_PHYSICS]: Hand-to-character physical interaction. When the photorealistic hand pokes or squishes the cartoon character's head, the 3D model must dynamically deform (squish) in response to the pressure. The character's cartoon arms must physically wrap around the stick of the real lollipop without clipping.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Bullying): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic hand and desk with a 3D anime Chibi character. ENVIRONMENT: A photorealistic indoor desk with a laptop. NO TEXT. SUBJECT & POSITION: A cute 3D anime Chibi character is sitting on the desk. A photorealistic human hand from the POV perspective is reaching out and forcefully poking/squishing the character's cheek. ACTION & EXPRESSION: She is crying, looking extremely sad and pitiful while her cheek is squished. CAMERA: 1st-person POV.
Scene 2 Prompt (The Reward): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same desk. NO TEXT. SUBJECT & POSITION: The 3D Chibi character is still sitting on the desk. The photorealistic hand is now holding out a photorealistic red lollipop. ACTION & EXPRESSION: She has instantly stopped crying. Small cartoon stars are in her eyes. She is smiling brightly and using her short arms to tightly hug the stick of the photorealistic lollipop. CAMERA: 1st-person POV.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '괴롭힘과 막대사탕 보상'
🎬 CLIP 1: [0-8초] 현실 손가락의 무자비한 찌그러뜨리기 (The Bullying)
목표: 8초 동안 실사 손가락이 3D 만화 캐릭터의 머리를 물리적으로 압박하여 찌그러뜨리는(Squish) VFX를 연출한다.
OUTPUT SPECS: 8 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Static camera.
ENVIRONMENT: Photorealistic desk in a bedroom.
CHARACTER & PROP DESIGN: Anime Chibi character. Photorealistic hand from the POV.
ACTION:
[0s-8s]: The photorealistic hand reaches out from behind the camera and playfully but firmly pushes down on the Chibi character's head and pokes her cheeks multiple times. The character's head squishes like a soft toy under the pressure. The character looks up at the camera, crying with a very sad, pitiful expression.
STRICT RULES: The 3D model MUST physically deform (squish) where the real fingers apply pressure. No text in the video.
🎬 CLIP 2: [8-16초] 사탕 보상과 180도 태세 전환 (The Sweet Reward)
목표: 8초 동안 사탕이라는 물리적 보상이 주어지자마자 감정이 180도 바뀌어 기뻐하는 코미디를 연출한다.
OUTPUT SPECS: 8 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Static camera.
ENVIRONMENT: Same desk.
ACTION:
[0s-3s]: The character is still sniffling. The photorealistic hand suddenly pulls a real red lollipop into the frame, offering it to her.
[3s-8s]: Instant mood swing. The tears instantly vanish. Her eyes sparkle like stars. She leans forward, wraps both cartoon arms tightly around the real lollipop stick, and smiles with pure joy.
STRICT RULES: The cartoon hands MUST perfectly grasp the real lollipop stick without clipping through it. The transition from crying to extreme happiness must be instant. No text.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 16 }
]

📥 [학습용 예시 17: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 빨간 버튼과 그림체 붕괴 (원작 영상)
활용된 레퍼런스: 물리적 트리거(버튼), 다중 아트 스타일 전환(Style Roulette), 기계 고장과 좌절(Sad ending) 코미디
고정된 공간 및 소품 배치: 햇살이 드는 아늑한 거실의 러그 위. 1인칭 시점(POV)의 카메라 앞에는 시청자의 실사 손이 큼지막한 '빨간색 누름 버튼(Red Arcade Button)'을 들고 있다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터 2명(메이드복 핑크 머리, 수녀복 은발)이 버튼 건너편에 얌전히 무릎을 꿇고 앉아 있다.
물리적 제약 조건 (CRITICAL): 버튼을 누르는 물리적 액션(Trigger)과 아트 스타일(Art Style)의 완벽한 동기화. 시청자의 손이 버튼을 한 번 누를 때마다 화면 전체의 렌더링 방식이 즉각적으로 변해야 한다(예: 3D -> 털실 인형 -> 종이접기 -> 픽셀 아트 -> 수채화 -> 흑백 만화 등). 캐릭터의 원래 형태(아이덴티티)는 유지되면서 재질만 변하는 것이 핵심이다. 마지막에는 버튼이 합선을 일으키며 '펑' 터져서 부서지는 물리 효과와 함께, 캐릭터들이 원래의 3D 모습으로 돌아와 눈물을 펑펑 흘리며 우는 감정의 급반전이 필요하다.
시나리오 (44초 내외):
[0.0초~5.0초] 1인칭 시점. 거실 러그 위에 귀여운 3D 캐릭터 둘이 앉아 시청자의 손에 인 빨간 버튼을 호기심 어린 눈으로 빤히 바라본다.
[5.0초~37.0초] 시청자가 버튼을 '딸깍' 누르기 시작한다. 버튼을 누를 때마다 세상이 털실 인형, 2D 애니, 픽셀 아트, 사이버펑크, 수채화, 스케치, 홀로그램 등으로 미친 듯이 바뀐다. 캐릭터들은 자신들의 변한 모습을 보며 신기해하거나 즐거워한다.
[37.0초~44.0초] 시청자가 버튼을 너무 많이 누르자, 버튼이 '파지직' 스파크를 튀기며 터져서 새카맣게 타버리고 갈라진다(기계 고장). 화면은 다시 원래의 3D 실사 환경으로 돌아온다. 캐릭터들은 고장 난 버튼을 보며 기겁하더니, 이내 닭똥 같은 눈물을 뚝뚝 흘리며 서럽게 운다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A sunny, comfortable living room rug.
[LOCKED_CAMERA_AND_POV]: 1st-person POV looking down at the rug. The camera's hand holds a large red arcade button in the foreground.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi characters sitting opposite the button. A large red arcade push button.
[LOCKED_PHYSICS]: Style transfer synchronization. Every physical press of the button MUST perfectly trigger an instant global change in the visual art style of the entire frame (characters and environment).
1. Image Generation Prompts (English)
Scene 1 Prompt (The Setup): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Photorealistic environment with 3D anime Chibi characters. ENVIRONMENT: Sunny living room rug. NO TEXT. SUBJECT & POSITION: A photorealistic hand holds a large red arcade button in the foreground. Two 3D anime Chibi characters are kneeling on the rug in the background, looking at the button with curiosity. ACTION & EXPRESSION: Quiet curiosity. CAMERA: 1st-person POV.
Scene 2 Prompt (The Pixel Art Button Press): MEDIUM: vertical 9:16 pixel art. ART & VISUAL DIRECTION: 16-bit Pixel Art style. ENVIRONMENT: Living room rug rendered in pixel art. NO TEXT. SUBJECT & POSITION: Same hand, button, and two anime Chibi characters, ALL rendered in 16-bit pixel art. ACTION & EXPRESSION: The hand is midway pressing the button. The characters look excited. CAMERA: 1st-person POV.
Scene 3 Prompt (The Explosion & Tears): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Back to the original Photorealistic environment with 3D anime Chibi characters. ENVIRONMENT: Sunny living room rug. NO TEXT. SUBJECT & POSITION: The red button in the foreground is now black, scorched, and smoking from an explosion. The two 3D anime Chibi characters are sitting on the rug. ACTION & EXPRESSION: They are looking at the broken button in shock, crying with heavy cartoon tears falling down their cheeks. CAMERA: 1st-person POV.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '빨간 버튼과 그림체 붕괴'
🎬 CLIP 1: [0-5초] 버튼 등장과 호기심 (The Curious Red Button)
목표: 5초 동안 폭풍 전야의 조용한 분위기 속 버튼을 소개한다.
OUTPUT SPECS: 5 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Static camera.
ENVIRONMENT: Sunny living room rug. Photorealistic.
CHARACTER & PROP DESIGN: Two Anime Chibi characters. A large red arcade button held by a human hand in the foreground.
ACTION:
[0s-5s]: The photorealistic hand holds out the red button. The two Chibi characters sit across from it, staring at it with intense curiosity.
STRICT RULES: No style changes in this clip.
🎬 CLIP 2: [5-37초] 스타일 룰렛 (The Style Roulette Montage)
목표: 32초 동안(실제 편집 시 컷을 빠르게 이어붙임) 버튼을 누를 때마다 화면의 그림체가 완전히 변하는 몽타주를 연출한다.
OUTPUT SPECS: 5 seconds (Generate this description for each individual style cut).
CINEMATOGRAPHY: 1st-person POV. Static camera.
ENVIRONMENT: Living room rug.
ACTION:
[0s-5s]: The hand presses the red button. INSTANTLY, the entire world (hand, button, characters, rug) transforms into an entirely new art style (e.g., highly detailed yarn/crochet). In this new style, the characters cheer happily.
STRICT RULES: Generate individual 5-second clips for different styles: Pixel Art, Watercolor, Papercraft, Cyberpunk, Sketch. The physical layout must remain exactly the same; only the rendering style changes instantly upon the button press.
🎬 CLIP 3: [37-44초] 버튼 폭발과 후회 (The Overload & Tears)
목표: 7초 동안 기계가 합선되어 터지고, 절망하는 결말을 연출한다.
OUTPUT SPECS: 7 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Static camera.
ENVIRONMENT: Back to the original Photorealistic living room rug.
ACTION:
[0s-3s]: The hand furiously mashes the red button. Suddenly, a bright spark and a small explosion happen over the button. Smoke rises from it. It is completely charred and broken.
[3s-7s]: The world resets to its original 3D state. The characters realize the fun is over and the button is broken. They look devastated and immediately burst into heavy, dramatic crying.
STRICT RULES: Keep the explosion localized to the button. The crying animation must be dramatic.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 44 }
]

📥 [학습용 예시 18: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 주인공인 줄 알았는데... (원작 영상)
활용된 레퍼런스: 1인칭 무대 시점(POV), 극단적인 군중 반응 대비(환호 vs 정적), 1인칭 피격 액션(카메라 타격 및 래그돌 물리효과)
고정된 공간 및 소품 배치: 화려한 조명이 비추는 실사(Real-world) 콘서트 대형 무대 위. 배경에는 거대한 '15K' LED 글씨가 빛나고 있다. 무대 아래에는 수천 명의 실사 관객들이 모여 있다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터 2명(수녀복, 메이드복)이 무대 중앙에서 춤을 추고 있다. 카메라는 무대 위에 함께 있는 시청자의 1인칭 시점(POV)이며, 시청자의 실사 손이 화면에 등장한다.
물리적 제약 조건 (CRITICAL): 카메라의 공간 회전과 물리적 피격 효과(Hit Reaction). 시청자(카메라)가 캐릭터와 인사한 후 180도로 뒤를 돌 때, 무대 조명에서 객석의 어둠으로 넘어가는 시각적 전환이 자연스러워야 한다. 캐릭터가 카메라 렌즈를 향해 주먹을 날리는 순간, 물리적 타격감과 함께 카메라(시청자)가 중력을 잃고 허공으로 포물선을 그리며 날아가(Flying backward) 객석 바닥에 처박히는 액션 카메라 워킹이 핵심이다.
시나리오 (19초 내외):
[0.0초~5.0초] 화려한 1인칭 무대 위. 캐릭터들이 귀엽게 춤을 추고 있고, 시청자의 실사 손이 다가가 캐릭터와 친근하게 주먹인사(Fist bump)를 나눈다.
[5.0초~11.0초] 자신이 주인공이 된 듯한 뽕에 취한 시청자(카메라)가 무대 아래 객석으로 고개를 휙 돌린다. 아까까지 열광하던 수천 명의 실사 관객들이 시청자를 보자마자 일제히 침묵하며 "에에..." 하고 싸늘하게 쳐다본다. (관객은 시청자가 아니라 캐릭터를 보러 온 것임)
[11.0초~14.0초] 머쓱해진 시청자가 다시 뒤를 돌아 캐릭터들을 향해 실사 손가락으로 삿대질(Pointing)을 한다. 캐릭터의 표정이 갑자기 정색하더니 빡친 표정으로 시청자의 얼굴(카메라)을 향해 강펀치를 날린다.
[14.0초~19초] '퍼억' 소리와 함께 카메라가 허공으로 붕 떠올라 뒤로 날아간다. 공중에서 객석과 천장이 핑그르르 돌고, 시청자가 객석 바닥에 철푸덕 널브러지며 영상이 끝난다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic massive concert stage. Bright colorful stage lights, a giant "15K" LED sign in the background. A huge dark arena filled with a photorealistic crowd of thousands of people.
[LOCKED_CAMERA_AND_POV]: 1st-person POV on stage. The camera must do a 180-degree pan to look at the crowd, then pan back. Crucially, at the climax, the camera must simulate being punched: flying rapidly backward into the air and crashing to the floor.
[LOCKED_SUBJECTS]: Two Anime-style Chibi characters on stage. A photorealistic human hand. A massive photorealistic human crowd.
[LOCKED_PHYSICS]: POV Hit-Reaction & Ragdoll physics. The cartoon fist must directly strike the camera lens. The resulting camera movement must convey sudden, violent physical displacement (launching backward into the air and landing on the floor).
1. Image Generation Prompts (English)
Scene 1 Prompt (The Awkward Crowd): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Photorealistic concert arena environment. ENVIRONMENT: Looking out from a brightly lit stage into a dark, massive concert arena. NO TEXT. SUBJECT & POSITION: Thousands of photorealistic real people in the audience. ACTION & EXPRESSION: Instead of cheering, the entire crowd is standing completely still, looking directly at the camera with extreme disappointment, awkwardness, and deadpan expressions. CAMERA: 1st-person POV from the stage.
Scene 2 Prompt (The Punch): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic stage and human hand, 3D anime Chibi character. ENVIRONMENT: Concert stage with bright lights. NO TEXT. SUBJECT & POSITION: An anime Chibi character stands right in front of the camera. The photorealistic human hand is pointing a finger at the character. ACTION & EXPRESSION: The Chibi character looks extremely angry and is violently throwing a punch directly into the camera lens. CAMERA: 1st-person POV, static right before impact.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '주인공인 줄 알았는데... (참교육 펀치)'
🎬 CLIP 1: [0-19초] 관객의 정적과 1인칭 피격 액션 (Awkward Silence & POV Knockout)
목표: 19초 동안 자신이 주인공인 줄 착각했다가 관객의 싸늘한 반응을 마주하고, 캐릭터에게 얻어맞아 허공을 날아가는 하찮은 굴욕을 연출한다.
OUTPUT SPECS: 19 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Starts static, pans 180 degrees to the audience, pans back. Ends with an extreme dynamic camera movement: launching backward into the air and tumbling to the ground.
ENVIRONMENT: Photorealistic concert stage and a massive arena with a crowd.
CHARACTER & PROP DESIGN: Anime Chibi characters. Photorealistic hand and audience.
ACTION:
[0s-5s]: The photorealistic hand gives a fist bump to the cute Chibi character on stage.
[5s-11s]: The camera turns around to face the massive crowd. The crowd immediately stops cheering and stares at the camera with awkward, disappointed silence.
[11s-14s]: The camera turns back to the Chibi character. The real hand points a finger at the character. The character gets instantly angry and punches the camera lens directly.
[14s-19s]: The camera violently flies backward through the air over the crowd, tumbling and spinning, before crashing onto the arena floor.
STRICT RULES: The silence of the crowd must feel palpable. The transition from standing to flying backward MUST be triggered perfectly by the cartoon punch. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 19 }
]

📥 [학습용 예시 19: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 자기 몸만한 지구젤리 먹방 대참사 (원작 영상)
활용된 레퍼런스: 거대 음식 먹방, 점성/액체 물리 엔진(Fluid Physics), 더러워지는(Messy) 슬랩스틱 코미디
고정된 공간 및 소품 배치: 따뜻한 조명의 실내 책상 위(3D/실사 합성 환경). 책상 중앙에는 캐릭터의 몸통보다 거대한 투명 플라스틱 케이스에 담긴 '지구 젤리(Earth Jelly)'가 놓여 있다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복 은발)가 책상 위 지구젤리 앞에 서 있다. 3인칭 관찰자 시점(POV)이다.
물리적 제약 조건 (CRITICAL): 젤리의 질감(Texture)과 끈적한 액체 물리 효과. 캐릭터가 거대한 젤리를 베어 물 때, 젤리 안에서 파란색의 끈적한 액체(시럽)가 터져 나와 캐릭터의 입가, 얼굴, 옷, 그리고 책상 바닥으로 리얼하게 흘러내려야 한다(Fluid simulation). 캐릭터가 젤리 위로 넘어질 때 젤리가 탄력 있게 찌그러져야 하며, 얼굴 전체가 파란 시럽 범벅이 되는 'Messy(지저분한)' 상태 변화가 자연스럽게 이어져야 한다.
시나리오 (15초 내외):
[0.0초~5.0초] 책상 위, 거대한 지구젤리 앞에 선 SD 캐릭터. 입맛을 다시며 짧은 팔을 뻗어 지구젤리를 와앙! 하고 크게 베어 문다.
[5.0초~10.0초] 베어 문 곳에서 파란색 끈적한 시럽이 터져 나온다. 캐릭터는 시럽을 입가와 옷에 잔뜩 묻힌 채 허겁지겁 젤리를 파먹는다. 너무 열정적으로 먹은 나머지 미끄러져서 지구젤리 위로 '철푸덕' 엎어지고 만다.
[10.0초~15.0초] 젤리 위에 엎어진 상태에서도 고개를 돌려 파란 시럽을 잔뜩 뒤집어쓴 채 행복하게 웃으며 시럽을 핥아먹는다. 하찮고 더럽지만 귀여운 먹방으로 마무리된다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A warmly lit indoor desk scene. A mix of 3D and photorealistic environment. On the center of the desk is a massive 'Earth Jelly' (a globe-shaped gummy candy in a realistic transparent plastic casing) that is larger than the character's torso.
[LOCKED_CAMERA_AND_POV]: 3rd-person observer POV. The camera is locked-off (static) directly in front of the desk edge.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character. A giant photorealistic Earth Jelly. Blue liquid syrup.
[LOCKED_PHYSICS]: Extreme fluid physics and messy collision. When the character bites the giant jelly, thick blue syrup must burst out and realistically stick to her face, clothes, and the desk. When she falls over onto the jelly, the jelly must visibly squish under her weight, and she must be completely covered in the messy blue syrup.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Giant Bite): MEDIUM: vertical 9:16 smartphone 3rd-person photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic giant candy with a 3D anime Chibi character. ENVIRONMENT: Warmly lit indoor wooden desk. NO TEXT. SUBJECT & POSITION: A cute 3D anime Chibi character is standing on the desk in front of a giant photorealistic Earth Jelly candy. ACTION & EXPRESSION: She has her short arms wide open and is taking a massive, greedy bite directly out of the giant Earth Jelly. She looks very hungry and excited. CAMERA: 3rd-person POV, static.
Scene 2 Prompt (The Messy Fall): MEDIUM: vertical 9:16 smartphone 3rd-person photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same indoor desk. NO TEXT. SUBJECT & POSITION: The 3D anime Chibi character has slipped and is now lying completely flat on her stomach ON TOP OF the giant Earth Jelly. ACTION & EXPRESSION: The Earth Jelly is squished under her weight. Her entire face and front of her clothes are completely covered and dripping with thick, sticky blue syrup. Despite being a huge mess, she is turning her head to the camera, smiling very happily, and licking the blue syrup off her face. CAMERA: 3rd-person POV, static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '자기 몸만한 지구젤리 먹방 대참사'
🎬 CLIP 1: [0-15초] 탐욕스러운 거대 젤리 먹방과 파란 시럽 대참사 (The Giant Jelly Mess)
목표: 15초 동안 캐릭터보다 큰 음식을 먹으려다 시럽 범벅이 넘어지는 슬랩스틱 코미디와 유체역학(Fluid physics)을 연출한다.
OUTPUT SPECS: 15 seconds, vertical 9:16.
CINEMATOGRAPHY: 3rd-person POV. Locked-off static camera.
ENVIRONMENT: Photorealistic warmly lit wooden desk.
CHARACTER & PROP DESIGN: Anime Chibi character. A massive photorealistic Earth Jelly candy. Thick blue liquid syrup.
ACTION:
[0s-5s]: The Chibi character stretches her short arms wide and takes a huge bite out of the giant Earth Jelly.
[5s-10s]: Viscous blue syrup bursts out of the bite hole. She rapidly and greedily eats it, getting the sticky blue syrup all over her face and clothes. Suddenly, she slips on the syrup and falls flat on her stomach right on top of the giant jelly.
[10s-15s]: The giant jelly squishes under her weight. She is completely covered in the messy blue syrup. While lying on the squished jelly, she turns her head to the camera and smiles happily, licking the syrup.
STRICT RULES: The blue fluid MUST act like thick, sticky syrup (viscosity). The character must get visibly messy. The giant jelly MUST deform and squish when she falls on it. No text in the video.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 20: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 찌질한 모래성 대결 (원작 영상)
활용된 레퍼런스: 자존심 싸움(Flexing), 스케일 차이 역전(Scale Difference), 분노의 파괴(Destruction) 코미디
고정된 공간 및 소품 배치: 화창한 여름날의 실사(Real-world) 해변 모래사장. 파도가 살짝 치는 배경. 프레임 안에는 1인칭 관점(POV)의 실사 손이 등장한다. 캐릭터와 손 사이에는 아주 작고 평범한 모래성(작은 성 모양)과, 아파트 10층 높이는 될 법한 압도적으로 거대하고 정교한 초거대 모래 조각상(드래곤과 성이 얽힌 형태 등) 2개가 존재한다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복 은발)가 모래사장에 앉아서 모래성을 만들고 있다. 1인칭 카메라와 마주보고 있다.
물리적 제약 조건 (CRITICAL): 거대한 스케일의 차이와 모래 파괴 물리 효과(Sand Physics). 초거대 모래 조각상이 카메라에 잡힐 때 그 압도적인 크기감이 드러나야 한다. 화가 난 시청자(카메라)가 자신의 작은 모래성을 주먹으로 내려칠 때, 모래가 '푸스스'하고 디테일하게 부서지며 흩어지는 파괴 시뮬레이션이 연출되어야 한다.
시나리오 (20초 내외):
[0.0초~5.0초] 1인칭 시점. 시청자가 모래사장에서 예쁘고 아기자기한 작은 모래성을 완성하고 스스로 뿌듯해한다. "어때?" 하듯 실사 손으로 브이(V)를 그리며 자랑한다.
[5.0초~12.0초] 맞은편에 있던 귀여운 SD 캐릭터가 가소롭다는 듯이 코웃음을 쳐(Hmph) 무시하고, 시청자의 멱살(카메라 렌즈)을 잡아 휙 끌어당겨 자신의 모래성을 보여준다.
[12.0초~16.0초] 카메라가 캐릭터가 가리킨 방향으로 크게 회전한다. 그곳에는 어마어마한 크기의 초거대하고 예술적인 모래 조각상이 우뚝 솟아 있다. 시청자(카메라)는 충격으로 덜덜 떨며 기를 잃는다.
[16.0초~20.0초] 패배감과 부끄러움에 휩싸인 시청자(카메라)가 다시 프레임으로 돌아와, 자신이 만들었던 작은 모래성을 실사 주먹으로 쾅! 내리쳐 산산조각 내버린다. SD 캐릭터는 그 모습을 보며 뒤집어지게 웃고, 모래가 흩날리며 끝난다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A sunny photorealistic sandy beach with slight ocean waves in the background.
[LOCKED_CAMERA_AND_POV]: 1st-person POV looking down at the sand. Later, an extreme wide pan to reveal a massive structure.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character. A photorealistic hand. A small photorealistic sandcastle. A massive, building-sized photorealistic sand sculpture.
[LOCKED_PHYSICS]: Extreme scale contrast and granular destruction physics. The camera must capture the overwhelming scale of the giant sand sculpture. The final action involves the human hand smashing the small sandcastle, which MUST shatter into realistic, crumbling grains of sand.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Small Castle): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic beach and hand with a 3D anime Chibi character. ENVIRONMENT: Sunny sandy beach. NO TEXT. SUBJECT & POSITION: A photorealistic hand is giving a 'peace/V-sign' next to a small, cute photorealistic sandcastle. Across from the castle sits a cute 3D anime Chibi character. ACTION & EXPRESSION: The character is looking at the small castle with a smug, unimpressed expression. CAMERA: 1st-person POV, looking down.
Scene 2 Prompt (The Giant Sculpture): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Photorealistic. ENVIRONMENT: Sunny sandy beach. NO TEXT. SUBJECT & POSITION: Panning up to reveal an impossibly massive, building-sized photorealistic sand sculpture (e.g., a highly detailed dragon coiled around a gothic castle). ACTION & EXPRESSION: Overwhelming scale. CAMERA: 1st-person POV, looking far up at the giant structure.
Scene 3 Prompt (The Destruction): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. ENVIRONMENT: Back looking down at the small sandcastle. NO TEXT. SUBJECT & POSITION: The photorealistic hand is formed into a fist. The 3D anime Chibi character is watching and laughing. ACTION & EXPRESSION: The hand is violently smashing the small sandcastle. The castle is exploding into crumbling grains of sand. CAMERA: 1st-person POV, looking down.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '찌질한 모래성 대결'
🎬 CLIP 1: [0-5초] 자그마한 자랑 (The Little Flex)
목표: 5초 동안 시청자가 작은 모래성을 자랑하고 캐릭터가 이를 비웃는 상황을 연출한다.
OUTPUT SPECS: 5 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Static camera looking down at the sand.
ENVIRONMENT: Photorealistic sandy beach.
CHARACTER & PROP DESIGN: Anime Chibi character. Photorealistic hand and small sandcastle.
ACTION:
[0s-5s]: The photorealistic hand finishes giving a peace sign next to the small sandcastle. The anime Chibi character sitting across from it looks at it, smirks arrogantly, and shakes her head 'no'.
STRICT RULES: Keep the camera focused on the small castle. No text.
🎬 CLIP 2: [5-16초] 극단적인 비교 (The Massive Reveal)
목표: 11초 동안 캐릭터가 카메라의 시선을 강제로 돌려 어마어마한 스케일의 조각상을 보여주는 극적 대비를 연출한다.
OUTPUT SPECS: 11 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Fast pan.
ENVIRONMENT: Photorealistic sandy beach.
ACTION:
[0s-3s]: The Chibi character grabs the camera lens and vigorously yanks it to face the opposite direction.
[3s-11s]: The camera shakes and pans up to reveal an absolutely massive, impossibly detailed 10-story high photorealistic sand sculpture (a dragon and castle). The camera slowly pans up the giant structure, shaking slightly with awe.
STRICT RULES: The scale contrast must be huge. The giant sculpture must look like it's made of sand. No text.
🎬 CLIP 3: [16-20초] 부끄러움과 파괴 (The Smashing)
목표: 4초 동안 패배감을 느낀 시청자가 자신의 작은 모래성을 산산조각 내는 모래 파괴 물리 엔진을 연출한다.
OUTPUT SPECS: 4 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV. Fast camera snap back to the small castle.
ENVIRONMENT: Photorealistic sandy beach.
ACTION:
[0s-2s]: The camera snaps back to look at the small sandcastle. The Chibi character is pointing and laughing hysterically.
[2s-4s]: The photorealistic human hand comes crashing down in a fist, violently smashing the small sandcastle flat. The castle instantly crumbles and explodes into thousands of tiny grains of sand flying in the air.
STRICT RULES: Realistic granular sand physics when the castle is smashed. No text.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 20 }
]

📥 [학습용 예시 3: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 10초만에 10만원 버는 방법 (원작 영상)
활용된 레퍼런스: 실사 합성(VFX) 및 하찮음(Pity)을 이용한 반전 코미디
고정된 공간 및 소품 배치: 비가 온 직후의 뉴욕 타임스퀘어(Real-world). 바닥은 젖어 있어 주변 네온사인과 캐릭터가 반사(Reflection)된다. 화면 중앙에는 양동이(은색 금속 바케스)가 놓여 있고, 주변으로 실사 지폐(달러)들이 떨어진다. 실사 사람들의 다리가 화면 주변을 바쁘게 지나다닌다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(수녀복을 입은 은발 캐릭터)가 실사 거리에 합성되어 있다. 카메라는 캐릭터의 눈높이에 맞춘 로우 앵글(Low angle)이며, 처음에는 서 있다가 넘어지고, 나중에는 양동이 뒤에 무릎을 꿇고 앉는다.
물리적 제약 조건 (CRITICAL): 완벽한 실사 도심 환경과 2D/3D 캐릭터의 텍스처 결합. 캐릭터가 바닥에 넘어질 때 젖은 바닥에 캐릭터의 모습이 반사되어야 완벽한 합성이 완성된다. 실사 행인들의 손과 지폐가 프레임 안으로 들어올 때 캐릭터의 폴리곤을 가리거나 뚫지 않고, 양동이 안이나 주변에 자연스럽게 떨어져야 한다(오브젝트 상호작용). 캐릭터의 감정이 '당황/슬픔'에서 '자본주의적 기쁨'으로 급격히 전환되는 표정 변화가 핵심이다.
시나리오 (15초):
[0.0초~3.0초] 타임스퀘어 한복판, 수녀복을 입은 SD 캐릭터가 양동이를 들고 걷다가 발이 걸려 바닥에 '철푸덕' 앞으로 크게 넘어진다. 양동이가 구르고, 캐릭터는 얼굴을 바닥에 파묻은 채 처량하고 불쌍한 모습을 연출한다.
[3.0초~8.0초] 캐릭터의 하찮고 불쌍한 모습에 지나가던 실사 행인들(사람의 손과 다리)이 가던 길을 멈추고 지폐를 던져주기 시작한다. 지폐가 양동이 안과 캐릭터 주변에 쌓인다.
[8.0초~15.0초] 캐릭터가 고개를 들고 돈이 쌓인 것을 확인한다. 슬펐던 표정이 순식간에 사라지고, 자본주의의 맛을 알아버린 듯 두 손을 모으고 윙크하며 기분 좋게(뻔뻔하게) 미소 짓는다. 행인들의 돈은 계속해서 쏟아진다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A rainy, wet photorealistic Times Square street in New York at night. The wet ground reflects neon lights.
[LOCKED_CAMERA_AND_POV]: 3rd-person low-angle POV, at the eye level of the small cartoon character.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character. A photorealistic silver metal bucket. Photorealistic dollar bills. Photorealistic human legs walking by.
[LOCKED_PHYSICS]: Reflection and object interaction. The Chibi character MUST be reflected on the wet asphalt. When dollar bills are thrown, they must physically land around the character and inside the bucket without clipping.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Fall): MEDIUM: vertical 9:16 smartphone low-angle photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic wet city street with a 3D anime Chibi character. ENVIRONMENT: Rainy Times Square at night. Wet asphalt reflecting neon lights. NO TEXT. SUBJECT & POSITION: A cute 3D anime Chibi character has tripped and fallen flat on its face on the wet ground. Next to the character is a photorealistic silver metal bucket fallen on its side. ACTION & EXPRESSION: Looking pitiful, sad, and helpless lying on the ground. CAMERA: 3rd-person low angle.
Scene 2 Prompt (The Capitalist Joy): MEDIUM: vertical 9:16 smartphone low-angle photo. ART & VISUAL DIRECTION: Same dimensional clash. ENVIRONMENT: Same wet city street. NO TEXT. SUBJECT & POSITION: The 3D anime Chibi character is now sitting up holding the bucket. Photorealistic dollar bills are scattered on the wet ground around the character. ACTION & EXPRESSION: The character is clasping her hands together, winking, and smiling brightly with pure, shameless joy. CAMERA: 3rd-person low angle.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '10초만에 10만원 버는 방법'
🎬 CLIP 1: [0-8초] 불쌍한 꽈당과 적선 (The Pitiful Fall & Donations)
목표: 8초 동안 길거리 바닥에 넘어져 젖은 바닥에 반사되는 실사-3D 합성(VFX)과 돈이 떨어지는 물리 효과를 연출한다.
OUTPUT SPECS: 8 seconds, vertical 9:16.
CINEMATOGRAPHY: 3rd-person low angle. Static camera.
ENVIRONMENT: Photorealistic wet Times Square street at night. Neon reflections on the ground.
CHARACTER & PROP DESIGN: Anime Chibi character. Silver bucket. Real dollar bills.
ACTION:
[0s-3s]: The Chibi character trips and falls flat on the wet asphalt with a thud. The silver bucket rolls beside her. She looks extremely sad, burying her face.
[3s-8s]: Photorealistic human legs walk past. Then, photorealistic dollar bills start raining down and landing on the ground around the character and the bucket.
STRICT RULES: The 3D character MUST have a reflection on the wet photorealistic ground. No text.
🎬 CLIP 2: [8-15초] 자본주의 미소 (The Shameless Smile)
목표: 7초 동안 안쓰러운 표정에서 돈을 보고 매우 기뻐하는 극단적 감정 변화를 연출한다.
OUTPUT SPECS: 7 seconds, vertical 9:16.
CINEMATOGRAPHY: 3rd-person low angle. Static camera.
ENVIRONMENT: Same wet street.
ACTION:
[0s-7s]: The Chibi character sits up, looking at the pile of real money. Instantly, her sad face completely disappears. She puts her hands together, winks at the camera, and confidently smiles with pure joy. Real dollar bills continue to slowly fall around her.
STRICT RULES: The transition from sad to happy must be clear. No text.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 4: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 장난 쳤다가 역관광 당하기 (원작 영상)
활용된 레퍼런스: 숨어서 장난치기(Prank), 참교육(Backfire), 과장된 타격과 날아가기(Slapstick Ragdoll) 코미디.
고정된 공간 및 소품 배치: 3D 렌더링된 고급스러운 호텔 또는 아파트 복도(Hallway). 벽에는 조명이 켜져 있고 나무 바닥이다. 화면 우측에 반쯤 열린 문(Door)이 있다.
고정된 캐릭터 위치 및 의상: 3D 애니메이션 SD 캐릭터 2명. 캐릭터 A(수녀복 은발)는 문 뒤에 숨어 있고 먼지털이를 들고 있다. 캐릭터 B(병아리 잠옷 핑크머리)는 뿅망치를 들고 복도를 걸어간다. 3인칭 관찰자 시점(POV)이다.
물리적 제약 조건 (CRITICAL): 캐릭터 간의 물리적 타격과 과장된 래그돌(Ragdoll) 물리 엔진. 캐릭터 A가 먼지털이로 캐릭터 B를 때리는 가벼운 타격(장난)과, 이후 분노한 캐릭터 B가 뿅망치로 캐릭터 A를 때려 허공으로 멀리 날려버리는(Flying across the hallway) 무거운 타격감이 극명하게 대비되어야 한다. 캐릭터 B가 분노할 때 배경에 집중선이 생기거나 어두운 오라가 나타나는 만화적 연출이 포함된다.
시나리오 (16초 내외):
[0.0초~5.0초] 복도. 캐릭터 A가 열린 문 뒤에 숨어 있다. 캐릭터 B가 뿅망치를 들고 무심코 걸어 지나가자, 캐릭터 A가 몰래 뒤로 다가가 먼지털이로 머리를 때리고 도망친다. 캐릭터 A는 장난에 성공했다며 기뻐서 방방 뛴다.
[5.0초~10.0초] 뒤통수를 맞은 캐릭터 B가 멈춰 선다. 갑자기 분위기가 싸해지며(만화적 집중선 효과), 캐릭터 B가 빡친 표정으로 뒤를 돌아본다. (등 뒤에 거대한 펭귄이나 악마의 실루엣이 나타난다).
[10.0초~16.0초] 빡친 캐릭터 B가 들고 있던 뿅망치를 풀스윙으로 휘두른다. 캐릭터 A가 정통으로 맞고 비명을 지르며 복도 끝까지 포물선을 그리며 멀리 날아간다. 캐릭터 B가 승리자처럼 뿅망치를 어깨에 걸치고 당당하게 서며 끝난다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A high-end 3D rendered hotel or apartment hallway with wooden floors and warm wall lighting. A half-open door is on the right.
[LOCKED_CAMERA_AND_POV]: 3rd-person observer POV, static wide shot.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi characters. A feather duster. A squeaky toy hammer.
[LOCKED_PHYSICS]: Ragdoll physics and extreme slapstick knockback. The light, prankish hit with the duster must contrast sharply with the overwhelmingly powerful toy hammer swing. The struck character MUST be physically launched high into the air and fly across the hallway like a ragdoll.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Prank): MEDIUM: vertical 9:16 smartphone 3rd-person photo. ART & VISUAL DIRECTION: 3D cartoon style. ENVIRONMENT: High-end hotel hallway with wooden floors. NO TEXT. SUBJECT & POSITION: Two anime Chibi characters. Character B is walking peacefully down the hall. Character A is sneaking up behind her holding a feather duster, preparing to strike. ACTION & EXPRESSION: Sneaky and mischievous. CAMERA: 3rd-person static.
Scene 2 Prompt (The Fury): MEDIUM: vertical 9:16 smartphone 3rd-person photo. ART & VISUAL DIRECTION: 3D cartoon style with anime action lines (speed lines) in the background. ENVIRONMENT: Same hallway. NO TEXT. SUBJECT & POSITION: Character B has stopped. She turns around to face the camera/Character A. She is holding a large toy hammer. ACTION & EXPRESSION: Furious, deadly gaze. A dark terrifying aura or shadow is behind her. CAMERA: 3rd-person static.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '장난 쳤다가 뿅망치 역관광'
🎬 CLIP 1: [0-5초] 먼지털이 장난 (The Prank Stroke)
목표: 숨어있다가 얄밉게 때리고 도망가는 상황 연출.
OUTPUT SPECS: 5 seconds, vertical 9:16.
ACTION: Character B walks past. Character A sneaks out from the door, lightly smacks B's head with a feather duster, and jumps around celebrating the prank.
🎬 CLIP 2: [5-10초] 분위기 반전과 분노 (The Dark Aura)
목표: 분위기가 싸해지며 극단적으로 분노하는 애니메이션적 연출.
OUTPUT SPECS: 5 seconds, vertical 9:16.
ACTION: Character B halts. The background darkens, and intense anime action lines appear. B slowly turns around with a terrifying, furious expression, holding a toy hammer. A dark shadow looms over her. 
🎬 CLIP 3: [10-16초] 풀스윙 참교육 (The Ragdoll Knockout)
목표: 무거운 타격감과 허공을 가르며 날아가는 래그돌 물리엔진 연출.
OUTPUT SPECS: 6 seconds, vertical 9:16.
ACTION: Character B violently swings the huge toy hammer in a full arc. It solidly hits Character A. Character A screams and is instantly launched high into the air, flying far down the hallway backward like a ragdoll. B stands proudly resting the hammer on her shoulder.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 16 }
]

📥 [학습용 예시 6: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 편의점 매운 라면 먹고 우유 마시는 크레페 (원작 영상)
활용된 레퍼런스: 차원 충돌 먹방 (실사 음식과 애니메이션 캐릭터의 상호작용), 매운맛 리액션 루프
고정된 공간 및 소품 배치: 실사(Real-world) 편의점 내부의 취식용 테이블. 테이블 위에는 김이 모락모락 나는 실사 컵라면(불닭볶음면)과 나무젓가락, 그리고 실사 바나나맛 우유가 놓여 있다. 배경으로는 편의점 매대와 유리창이 보인다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터(메이드복을 입은 핑크 머리 캐릭터)가 편의점 테이블 위, 라면 바로 뒤에 서 있다. 카메라는 시청자의 1인칭 시점(POV)이다. 프레임 밖에서 시청자의 실사 손(Human hand)이 젓가락과 우유를 조종한다.
물리적 제약 조건 (CRITICAL): 실사 음식(면발, 우유병)과 애니메이션 캐릭터의 입(Mouth)이 자연스럽게 맞닿아야 한다. 실사 젓가락이 카툰 캐릭터의 입으로 면을 넣어줄 때 면이 캐릭터의 얼굴을 뚫고 지나가면 안 되며(No Clipping), 캐릭터가 우유를 마실 때 실사 우유병을 카툰 캐릭터의 두 손이 자연스럽게 감싸 쥐어야 한다.
시나리오 (15초):
[0.0초~5.0초] 1인칭 시점. 시청자의 실사 손이 젓가락으로 매운 라면을 집어 캐릭터의 입에 넣어준다. 캐릭터가 라면을 삼킨 직후, 얼굴이 붉어지며 눈물을 글썽이고 혀를 내두르며 매워하는 과장된 리액션을 보인다.
[5.0초~10.0초] 시청자의 손이 매워하는 캐릭터에게 실사 바나나맛 우유를 밀어준다. 캐릭터가 우유병을 끌어안고 벌컥벌컥 마신다. 매운맛이 가신 듯 표정이 환해지고 "푸우-" 하며 안도한다.
[10.0초~15.0초] 시청자의 손이 다시 라면을 한 젓가락 집어 내민다. 캐릭터는 언제 매웠냐는 듯 다시 초롱초롱한 눈으로 입을 아- 벌리고 라면을 받아먹는다. (무한 반복 루프의 완성)
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic convenience store table. A photorealistic cup of hot ramen and a photorealistic banana milk bottle are on the table.
[LOCKED_CAMERA_AND_POV]: 1st-person POV looking down at the table. Hand holding chopsticks enters frame from bottom.
[LOCKED_SUBJECTS]: A 3D Anime-style Chibi character. A photorealistic human hand holding chopsticks. Photorealistic milk bottle.
[LOCKED_PHYSICS]: Eating interaction. The real chopsticks must feed the cartoon character without clipping. The Chibi character must use its cartoon hands to hold the real milk bottle properly.
1. Image Generation Prompts (English)
Scene 1 Prompt (Spicy Reaction): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic hand and table with a 3D anime character. ENVIRONMENT: Convenience store table. NO TEXT. SUBJECT & POSITION: A Chibi character is standing on the table next to a cup of ramen. The photorealistic hand is holding chopsticks near her face. ACTION & EXPRESSION: Her face is bright red, tears in her eyes, tongue sticking out, looking extremely spicy and suffering. CAMERA: 1st-person POV.
Scene 2 Prompt (Milk Chug): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. ENVIRONMENT: Same convenience store table. NO TEXT. SUBJECT & POSITION: The Chibi character is hugging a real bottle of banana milk with both arms. ACTION & EXPRESSION: She is drinking it happily, looking relieved from the spiciness. CAMERA: 1st-person POV.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '매운 라면 먹고 우유 마시는 루프'
🎬 CLIP 1: [0-5초] 매운 라면 먹이기 (The Spicy Feed)
목표: 5초. 물리적인 젓가락 상호작용과 극단적인 매운맛 리액션.
OUTPUT SPECS: 5 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV.
ENVIRONMENT: Photorealistic convenience store table.
CHARACTER & PROP: 3D anime Chibi character, photorealistic chopsticks and hand.
ACTION: The photorealistic hand uses chopsticks to feed the Chibi character some ramen. The character eats it, instantly turns red, cries, and sticks her tongue out, showing an extreme 'spicy' reaction.
🎬 CLIP 2: [5-10초] 우유 진화 (The Milk Relief)
목표: 5초. 카툰 캐릭터가 실사 우유병을 껴안고 마시는 물리 작용.
OUTPUT SPECS: 5 seconds, vertical 9:16.
ACTION: The hand pushes a real milk bottle to her. She grabs the real bottle with her cartoon hands and chugs it. She sighs in relief, looking peaceful.
🎬 CLIP 3: [10-15초] 다시 무한도전 (The Loop)
목표: 5초. 초기화된 표정으로 안 매운 척 다시 시도.
OUTPUT SPECS: 5 seconds, vertical 9:16.
ACTION: The hand offers another chopstick of ramen. She completely forgets the pain, opens her mouth wide with starry eyes, and eats it again.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 10: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 킹받는 나팔 부대와 베개 참교육 (원작 영상)
활용된 레퍼런스: 1인칭 시점(POV) 상호작용, '당당한 방해'와 '하찮은 도망'의 대비 코미디
고정된 공간 및 소품 배치: 실사(Real-world) 침실. 시청자는 침대에 누워 있으며, 하얀색 이불과 베개가 덮여 있다. 정면에는 열려 있는 방문(Door)이 보인다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터 3명(트릭컬 스타일의 수녀복/메이드복 캐릭터들). 각자 황동색 관악기(트럼펫, 튜바 등)를 들고 있다. 카메라는 침대에 누운 시청자의 1인칭 시점(POV)이며, 프레임 하단에 시청자의 실사 두 손과 다리가 보인다.
물리적 제약 조건 (CRITICAL): 실사 침실 환경과 3D 애니메이션 캐릭터의 공간적 일치. 캐릭터들이 방문을 열고 들어올 때 그림자가 실사 바닥에 자연스럽게 져야 한다. 시청자의 실사 손이 '실사 베개'를 집어들 때 캐릭터들을 가리지 않아야 한다. 가장 중요한 것은 '액션의 급반전(Instant Reaction)'이다. 베개를 집어 드는 물리적 위협(Trigger)이 발생하는 순간, 시끄럽게 악기를 불던 캐릭터들이 동시에 연주를 멈추고 기겁하며 왔던 길(방문 밖)로 뒤도 안 돌아보고 헐레벌떡 도망가야 한다.
시나리오 (20초 내외):
[0.0초~5.0초] 1인칭 시점. 평화롭게 침대에 누워있는데, 방문이 열리더니 귀여운 SD 캐릭터 3인방이 각자 트럼펫과 튜바를 들고 당당하게 걸어 들어온다.
[5.0초~12.0초] 캐릭터들이 침대 바로 앞까지 다가와서 시청자를 향해 악기를 시끄럽게 불어댄다(킹받는 표정). 시청자가 참다못해 침대 위에 있던 베개를 두 손으로 꽉 쥔다.
[12.0초~20.0초] 시청자가 베개를 위협적으로 번쩍 치켜든다. 그 순간, 악기를 불던 캐릭터들이 '힉!' 하고 놀라며 동시에 악기를 내리고, 빛의 속도로 방문 밖으로 튀어 도망간다. 캐릭터들이 나가자 방문이 스르륵 닫히고, 시청자는 체념한 듯 한숨을 쉰다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic bedroom from the perspective of lying in bed. A white blanket and pillow are visible. The bedroom door is open in front.
[LOCKED_CAMERA_AND_POV]: 1st-person POV from bed. Photorealistic hands in the foreground.
[LOCKED_SUBJECTS]: Three 3D Anime-style Chibi characters holding brass instruments. A photorealistic bed/pillow.
[LOCKED_PHYSICS]: Instant reaction physics. The characters must all instantly react at exactly the same frame when the player lifts the pillow, seamlessly transitioning from playing music to terrified running.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Invasion): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic bedroom with 3D anime characters. ENVIRONMENT: Viewed from a bed. NO TEXT. SUBJECT & POSITION: Three cute 3D anime Chibi characters are standing near the bed, loudly playing brass instruments like trumpets. ACTION & EXPRESSION: They look smug and annoying. CAMERA: 1st-person POV.
Scene 2 Prompt (The Threat & Run): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. ENVIRONMENT: Same bedroom. NO TEXT. SUBJECT & POSITION: The photorealistic hands have lifted a white pillow defensively. The three Chibi characters are caught completely off guard. ACTION & EXPRESSION: Their faces show sheer terror and shock. They are turning around in a panicked blur to run away toward the open door. CAMERA: 1st-person POV.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '킹받는 나팔 부대와 참교육'
🎬 CLIP 1: [0-12초] 당당한 등반 (The Annoying March)
목표: 12초. 캐릭터가 당당하게 걸어와 시끄럽게 관악기를 부는 상황.
OUTPUT SPECS: 12 seconds, vertical 9:16.
CINEMATOGRAPHY: 1st-person POV.
ENVIRONMENT: Photorealistic bedroom.
ACTION: The door opens, and three Chibi characters march in confidently. They walk right up to the bed and loudly blow their trumpets right at the camera with smug, annoying faces. The camera (hands) tightly grips the pillow.
🎬 CLIP 2: [12-20초] 참교육 (The Instant Runaway)
목표: 8초 동안 베개를 드는 순간 기겁하며 도망가는 급반전 액션.
OUTPUT SPECS: 8 seconds, vertical 9:16.
ACTION: The photorealistic hands swing the pillow up aggressively. INSTANTLY, all three characters stop playing, gasp with shocked/scared faces, and run away at lightning speed back out the door. The door shuts behind them.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 20 }
]

📥 [학습용 예시 11: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 킹받는 나팔 부대와 네르 소환 (원작 영상)
활용된 레퍼런스: 1인칭 시점(POV), '보호자/권력자 소환' 밈, 뒤로 질질 끌려가는(Dragged away) 슬랩스틱 코미디
고정된 공간 및 소품 배치: 실사(Real-world) 침실. 시청자는 침대에 누워 있으며, 하얀색 이불이 덮여 있다. 정면에는 열려 있는 방문(Door)과 거실 복도가 보인다.
고정된 캐릭터 위치 및 의상: 2D/3D 애니메이션 SD 캐릭터 2명. 캐릭터 A(수녀복 은발, 스피키)는 트럼펫을 들고 있고, 캐릭터 B(수녀복 금발, 네르)는 화가 난 표정이다. 카메라는 침대에 누운 시청자의 1인칭 시점(POV)이며, 프레임 하단 우측에 시청자의 실사 손이 허공에 펼쳐져 있다.
물리적 제약 조건 (CRITICAL): 3D 캐릭터 간의 물리적 상호작용과 슬라이딩(Sliding) 물리 엔진. 캐릭터 A가 시끄럽게 연주할 때, 시청자가 "네르!"라고 외치는 음성 신호(Audio trigger)가 발생한다. 직후 캐릭터 B가 방문 뒤에서 나타나 캐릭터 A의 머리(또는 옷깃)를 잡아야 한다(캐릭터 간 클리핑 허용 및 상호작용). 가장 중요한 것은 캐릭터 A가 저항하지 못하고 바닥을 미끄러지듯(Sliding backward) 뒤로 질질 끌려 나가 프레임 밖으로 사라지는 물리적 연출이다. 이후 문이 스르륵 닫혀야 한다.
시나리오 (15초 내외):
[0.0초~4.0초] 1인칭 시점. 방문이 열리며 캐릭터 A가 나팔을 시끄럽게 불며 침대 앞까지 당당하게 걸어 들어온다.
[4.0초~6.0초] 시청자가 짜증 섞인 목소리로 "네르!" 하고 누군가를 부른다.
[6.0초~11.0초] 그 소리를 듣고 캐릭터 B가 화난 표정으로 방문 뒤에서 쿵쾅거리며 걸어온다. 캐릭터 B가 앞서있던 캐릭터 A의 머리를 덥석 잡고 뒤로 가차 없이 질질 끌고 나간다. 캐릭터 A는 끌려가면서도 나팔을 불려고 하지만 허우적댈 뿐이다.
[11.0초~15.0초] 두 캐릭터가 복도 밖으로 완전히 사라지고, 방문이 스스로 '쾅' 닫히며 침실에 평화가 찾아온다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: A photorealistic bedroom from the perspective of lying in bed. White blanket. Open bedroom door facing a hallway.
[LOCKED_CAMERA_AND_POV]: 1st-person POV from bed.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi characters.
[LOCKED_PHYSICS]: Character-to-character interaction and backward sliding physics. Character B must physically grab Character A, and Character A must slide along the photorealistic floor backward while helplessly flailing.
1. Image Generation Prompts (English)
Scene 1 Prompt (The Trumpet Caller): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. Photorealistic bedroom with a 3D anime character. ENVIRONMENT: Viewed from a bed. NO TEXT. SUBJECT & POSITION: One Chibi character is loudly blowing a trumpet by the bed. ACTION & EXPRESSION: Annoying and smug. CAMERA: 1st-person POV.
Scene 2 Prompt (The Grab): MEDIUM: vertical 9:16 smartphone 1st-person POV photo. ART & VISUAL DIRECTION: Dimensional clash. ENVIRONMENT: Same bedroom. NO TEXT. SUBJECT & POSITION: A second taller/angry Chibi character approaches from behind. ACTION & EXPRESSION: The angry second character grabs the first character by the collar/head. The first character looks shocked and helpless. CAMERA: 1st-person POV.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 소스: '네르 소환과 끌려가는 스피키'
🎬 CLIP 1: [0-6초] 나팔 불기 및 소환 (The Summons)
목표: 나팔을 불며 방해하는 상황.
OUTPUT SPECS: 6 seconds, vertical 9:16.
ACTION: Character A marches into the bedroom and blares the trumpet at the camera. A photorealistic hand waves in annoyance.
🎬 CLIP 2: [6-15초] 응징과 뒷덜미 슬라이딩 (The Drag Away)
목표: 다른 캐릭터가 나타나 뒤로 질질 끌고나가는 슬랩스틱 코미디.
OUTPUT SPECS: 9 seconds, vertical 9:16.
ACTION: Character B angrily marches in from the hallway. B grabs A by the back of the neck. Character A is powerfully dragged backward sliding across the floor, flailing helplessly until they vanish down the hall. The door slams shut.
3. AI Caption Data (JSON)
[
{ "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 21: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 새벽 몰폰 2차 발각 (원작 영상)
활용된 레퍼런스: 1인칭 관찰자 개입, 빛을 활용한 상황 반전(조명 트랜지션), 하찮은 슬랩스틱 도주/위장
고정된 공간 및 소품 배치: 포근한 분위기의 실내 침실(3D). 왼쪽에는 달빛(푸른색)이 들어오는 창문, 오른쪽에는 복도의 따뜻한 노란 불빛이 들어오는 나무 안방문이 있다. 방 한가운데에는 푹신한 이불이 깔린 나무 침대가 있다.
고정된 캐릭터 위치 및 의상: 3D 애니메이션 SD 캐릭터 2인(왼쪽: 수녀복 은발, 오른쪽: 핑크 수면모자 트윈테일). 이불을 덮고 나란히 누워있거나, 앉아서 스마트폰을 들고 있다.
물리적 제약 조건 (CRITICAL): 조명(안방문)의 개폐에 따른 캐릭터 자세의 즉각적인 변화(Ragdoll/물리 엔진 붕괴 느낌). 문틈으로 빛이 들어올 때는 캐릭터들이 침대 매트리스와 이불 사이에 완전히 밀착되어(Flat) 미동도 없어야 한다. 조명이 꺼지면 만화적인 탄성(Bouncy)을 가지고 즉시 튀어 올라야 한다. 침대, 문, 창문의 공간 배치는 영상 내내 1mm도 변하지 않는 완벽한 고정 샷(Static locked-off camera)이어야 한다.
시나리오 (15초):
[0.0초~5.0초] 문 열림 - 감시 대기. 안방문이 아주 살짝 열려 있고, 문틈으로 새어 들어온 노란빛과 부모님의 그림자가 침대를 비춘다. 캐릭터 둘은 이불을 목끝까지 덮은 채 눈을 질끈 감고 숨소리도 내지 않고 자는 척한다.
[5.0초~8.0초] 문 닫힘 - 봉인 해제. 문이 완전히 닫히고 방이 어두워진다. 그 직후 캐릭터 둘은 용수철처럼 이불을 걷어차고 벌떡 일어나 환호하며 스마트폰을 켠다.
[8.0초~11.0초] 신나는 몰폰. 달빛과 스마트폰 화면의 파란 불빛만이 캐릭터 얼굴을 비춘다. 빙그레 웃으며 화면을 터치한다.
[11.0초~15.0초] 문 쾅 열림 - 기절. 안방문이 갑자기 쾅 열리고 밝은 빛이 쏟아진다. 발견된 순간 캐릭터 둘 다 혼비백산하여 입을 쫙 벌리고 깜짝 놀라더니, 빛의 속도로 이불에 얼굴을 파묻고 널브러져 다시 자는 척한다.
0.5. Context Harness (English)
[LOCKED_ENVIRONMENT]: Cozy nighttime bedroom in high-quality 3D anime style. A window on the left showing moonlight. A wooden door on the right. A wooden bed in the center. All environmental elements must remain completely static in every shot.
[LOCKED_CAMERA_AND_POV]: 3rd-person locked-off static wide camera. Eye level, placed at the foot of the bed. Absolute zero camera movement.
[LOCKED_SUBJECTS]: Two 3D Anime-style Chibi girls (white hair nun, teal hair pink nightcap) in the bed. A glowing smartphone.
[LOCKED_PHYSICS]: Lighting triggers rapid rigid-body state shifts. When the door is slightly or fully open (yellow light), the characters must instantly go into a flat, motionless, "play dead" ragdoll state on the pillows. When the door is closed (dark/blue moonlight), they pop up with bouncy, fast cartoon spring physics.
1. Image Generation Prompts (English)
Scene 1 Prompt (Door Slightly Open - Faking Sleep): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: High quality cute 3D chibi style, soft cinematic lighting. ENVIRONMENT: A cozy nighttime bedroom. On the left wall, a window shows a night sky with a full moon and stars. On the right, a wooden door is slightly open, casting a warm yellow light and a human shadow onto the floor and bed. NO TEXT. SUBJECT & POSITION: Two cute 3D chibi girls are lying in a wooden bed, covered with a thick grey blanket. Left character: white hair, wearing a black and white nun-style veil. Right character: teal twin-tails, wearing a pink nightcap. ACTION & EXPRESSION: Both have their eyes tightly closed, pretending to be fast asleep. CAMERA: Static, eye-level from the foot of the bed.
Scene 2 Prompt (Door Closed - Pop Up): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style, moonlight illumination. ENVIRONMENT: Same cozy bedroom. The wooden door on the right is now fully closed. The room is dark, illuminated only by the cool blue moonlight from the left window. NO TEXT. SUBJECT & POSITION: The two 3D chibi girls (white hair nun and teal hair with pink nightcap) are sitting up straight on the bed, throwing the blanket off. ACTION & EXPRESSION: Both have their eyes wide open with bright, excited smiles, bouncing up slightly in the air in joy. CAMERA: Static, eye-level.
Scene 3 Prompt (Smartphone Glow): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style, glowing screen light. ENVIRONMENT: Same dark bedroom, lit by moonlight from the window. NO TEXT. SUBJECT & POSITION: The two 3D chibi girls are sitting side-by-side on the bed. The teal-haired girl is holding a smartphone/tablet. ACTION & EXPRESSION: The glowing screen casts a bright blue light onto both of their faces. They are looking at the screen, smiling happily and completely absorbed. CAMERA: Static, slightly zoomed in on their faces.
Scene 4 Prompt (Door Busts Open - Caught): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style, sudden bright light. ENVIRONMENT: Same bedroom. The wooden door on the right is violently wide open, flooding the room with bright warm light and casting the human shadow again. NO TEXT. SUBJECT & POSITION: The two 3D chibi girls are still sitting on the bed, holding the smartphone. ACTION & EXPRESSION: They turn toward the door. Both have extreme cartoonish shocked expressions: eyes wide open, pupils shrunk, and mouths dropped open in panic. CAMERA: Static, wide shot showing the door and bed.
Scene 5 Prompt (Play Dead Collapse): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style. ENVIRONMENT: Same brightly lit bedroom with the door open. NO TEXT. SUBJECT & POSITION: The two 3D chibi girls have instantly collapsed face-down directly onto the pillows and mattress, completely flat. ACTION & EXPRESSION: They are hiding their faces, frozen stiff, trying to pretend they are deeply asleep again in a messy, panicked pose. CAMERA: Static, looking slightly down at the bed.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '새벽 몰폰 2차 발각'
🎬 CLIP 1: [0-5초] 엄격한 감시 (Scene 1 활용)
목표: 열린 문틈으로 들어오는 빛과 그림자를 통해 자는 척하는 캐릭터의 긴장감 묘사.
REFERENCE INSTRUCTION: Use Scene 1 as the starting reference. Maintain the room layout perfectly.
OUTPUT SPECS: Subtle lighting, completely static characters.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Dark bedroom, moonlight from the left window, warm light and a human shadow from the slightly open door on the right.
CHARACTER DESIGN: 3D chibi girl with white hair/nun veil, and 3D chibi girl with teal twin-tails/pink nightcap, lying in bed.
ACTION: The human shadow on the floor subtly moves. The two characters remain perfectly motionless under the blanket, breathing very softly with eyes closed, pretending to be asleep.
STRICT RULES: Do not move the characters' limbs. The door remains slightly open, do not open it further yet.
🎬 CLIP 2: [5-8초] 봉인 해제 (Scene 1 ➔ Scene 2 연결)
목표: 문이 닫히며 어두워지는 순간, 이불을 박차고 튀어 오르는 역동적인 기쁨 표현.
REFERENCE INSTRUCTION: Use Scene 1 as start frame and Scene 2 as end frame.
OUTPUT SPECS: Light transition (door closing), bouncy cartoon physics.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: The door closes, cutting off the warm light. The room goes dark, lit only by the moonlight.
CHARACTER DESIGN: The two 3D chibi girls.
ACTION: The door clicks shut. Instantly, the two girls throw the blanket off and rapidly sit up, bouncing slightly into the air with big, joyful smiles and wide open eyes.
STRICT RULES: Keep the pop-up movement fast and bouncy. The background must remain exactly the same as the door closes.
🎬 CLIP 3: [8-11초] 은밀한 딴짓 (Scene 3 활용)
목표: 어둠 속에서 스마트폰 불빛에 얼굴이 파랗게 비치며 딴짓하는 상황 연출.
REFERENCE INSTRUCTION: Use Scene 3 as the starting reference.
OUTPUT SPECS: Localized screen glow (blue light), subtle facial animation.
CINEMATOGRAPHY: Static camera, slightly zoomed in.
ENVIRONMENT: Dark bedroom, moonlight on the left.
CHARACTER DESIGN: The two 3D chibi girls holding a device.
ACTION: In the dark, the smartphone screen glows, casting a flickering blue light on their faces. Both girls look at the screen, blinking normally and smiling happily without moving their bodies much.
STRICT RULES: Do not move the characters' limbs excessively. The lighting focus must be on the screen glow reflecting on their faces.
🎬 CLIP 4: [11-13초] 2차 발각 (Scene 3 ➔ Scene 4 연결)
목표: 문이 갑자기 팍 열리며 빛이 쏟아지고, 그에 맞춰 놀라는 만화적 리액션.
REFERENCE INSTRUCTION: Use Scene 3 as start frame and Scene 4 as end frame.
OUTPUT SPECS: Sudden flash of light (door opening), rapid facial morphing into shock.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: The door bursts open, instantly flooding the room with bright warm light and a human shadow.
CHARACTER DESIGN: The two 3D chibi girls.
ACTION: The door aggressively swings wide open. The room lights up instantly. Both girls immediately freeze, their expressions snapping into extreme shock with wide eyes and dropped jaws, caught red-handed.
STRICT RULES: The light transition must be instant. The facial shock must maintain the cute 3D chibi aesthetic without looking grotesque.
🎬 CLIP 5: [13-15초] 빠른 태세 전환 (Scene 4 ➔ Scene 5 연결)
목표: 0.1초 만에 베개에 얼굴을 파묻고 기절한 척하는 슬랩스틱 엔딩.
REFERENCE INSTRUCTION: Use Scene 4 as start frame and Scene 5 as end frame.
OUTPUT SPECS: Fast rigid body physics (falling flat), static environment.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Brightly lit bedroom with the open door.
CHARACTER DESIGN: The two 3D chibi girls.
ACTION: From a sitting position, both girls instantly dive face-first into the pillows, collapsing completely flat onto the bed to hide. They freeze completely stiff once they hit the mattress.
STRICT RULES: The collapsing motion must be extremely fast and comical. Once face-down, there must be zero movement.
3. AI Caption Data (JSON)
[
  { "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 22: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 우당탕탕 쿠키 베이킹 (원작 영상)
활용된 레퍼런스: 3D 미니 캐릭터 베이킹, 역동적 물리 트랜지션, 파티클 액션, 만화적 슬랩스틱
시나리오 (15초):
[0-3초] 반죽 앞의 환호. 거대한 반죽을 보고 신나서 손을 마주친다.
[3-6초] 영차영차 밀대질. 세 명이 힘을 합쳐 커다란 밀대로 반죽을 민다.
[6-9초] 밀가루 폭탄. 밀가루 포대를 쏟아부어 하얀 가루가 터지며 캐릭터들을 덮친다.
[9-12초] 쿠키 꾸미기. 각자의 도구로 거대한 진저브레드맨 쿠키를 꾸민다.
[12-15초] 완성 및 포옹. 완성을 축하하며 다 함께 방방 뛰고 끌어안는다.
1. Image Generation Prompts (English)
Scene 1 Prompt (반죽 앞의 환호): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: High quality cute 3D chibi style, warm cozy lighting. ENVIRONMENT: A bright, cozy kitchen with wooden shelves, ingredient jars, and a white marble countertop. NO TEXT. SUBJECT & POSITION: Three cute 3D chibi girls are standing behind a massive mound of dough on the counter. Left: white hair in a black and white nun outfit. Middle: pink hair wearing a fluffy yellow duck onesie. Right: teal twin-tails in a blue/black outfit. ACTION & EXPRESSION: They are looking at the dough with excited, wide eyes. The left and right girls are holding hands or high-fiving in front of the middle girl. CAMERA: Static, eye-level.
Scene 2 Prompt (영차영차 밀대질): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style. ENVIRONMENT: Same cozy kitchen and white marble countertop. NO TEXT. SUBJECT & POSITION: The three 3D chibi girls are standing together behind the dough. They are all holding a single large wooden rolling pin, pressing it down onto the dough. ACTION & EXPRESSION: They are actively rolling the dough together, looking focused and happy. CAMERA: Static, eye-level.
Scene 3 Prompt (밀가루 폭탄): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style, dynamic particle effects. ENVIRONMENT: Same kitchen. The dough is slightly flattened. NO TEXT. SUBJECT & POSITION: The three girls are behind the dough. The middle girl (yellow duck onesie) is holding a large paper bag of flour upside down. ACTION & EXPRESSION: A huge cloud of white flour is bursting out, covering the dough and heavily dusting all three girls' faces and clothes with white powder. They have their eyes tightly shut in a cute sneeze/shocked expression. CAMERA: Static, eye-level.
Scene 4 Prompt (쿠키 꾸미기): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style, detailed macro textures. ENVIRONMENT: Same kitchen. The dough is now shaped and baked into a giant gingerbread man cookie. NO TEXT. SUBJECT & POSITION: The three flour-dusted girls are actively decorating the giant cookie. Left girl is squeezing chocolate icing from a tube. Middle girl is carefully placing colorful chocolate candies. Right girl is pouring colorful round sprinkles from a small jar. ACTION & EXPRESSION: They are deeply focused and smiling, decorating their specific parts of the cookie. CAMERA: Static, slightly angled down towards the cookie.
Scene 5 Prompt (완성 및 포옹): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style. ENVIRONMENT: Same kitchen. The beautifully decorated giant gingerbread man cookie is complete on the counter. NO TEXT. SUBJECT & POSITION: The three girls are standing behind the cookie. ACTION & EXPRESSION: They are jumping up in the air, tightly hugging each other with their eyes closed in massive, joyful smiles, celebrating their success. CAMERA: Static, eye-level.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '쿠키 베이킹'
🎬 CLIP 1: [0-3초] 반죽 앞의 환호 (Scene 1 활용)
목표: 거대한 반죽을 보고 신나서 손을 마주치는 귀여운 시작 연출.
REFERENCE INSTRUCTION: Use Scene 1 as the starting reference.
OUTPUT SPECS: Smooth, bouncy character animation, warm ambient lighting.
CINEMATOGRAPHY: Static camera, eye-level.
ENVIRONMENT: Cozy kitchen with a white marble countertop.
CHARACTER DESIGN: Three 3D chibi girls (Nun, Yellow Duck Onesie, Teal Twin-tails).
ACTION: The girls look at the giant dough excitedly. The left and right girls happily high-five or hold hands, bobbing their heads and bodies in a cute, bouncy cartoon rhythm.
STRICT RULES: Keep the background completely static. The dough must remain perfectly still in this clip.
🎬 CLIP 2: [3-6초] 영차영차 밀대질 (Scene 2 활용)
목표: 세 명이 힘을 합쳐 커다란 밀대로 반죽을 미는 물리적 상호작용 연출.
REFERENCE INSTRUCTION: Use Scene 2 as the starting reference.
OUTPUT SPECS: Soft body physics (dough flattening slightly), synchronized character movement.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Same cozy kitchen.
CHARACTER DESIGN: The three 3D chibi girls.
ACTION: All three girls grab the large wooden rolling pin together. They push the rolling pin forward and backward over the dough in a synchronized, rhythmic motion. The dough slightly flattens as they roll it.
STRICT RULES: Ensure the rolling pin stays attached to their hands. The dough must smoothly deform without glitching.
🎬 CLIP 3: [6-9초] 밀가루 폭탄 (Scene 3 활용)
목표: 밀가루 포대를 쏟아부어 하얀 가루가 터지며 캐릭터들을 덮치는 극적인 파티클 연출.
REFERENCE INSTRUCTION: Use Scene 3 as the starting reference.
OUTPUT SPECS: Volumetric dust/particle simulation, sudden lighting diffusion (due to dust).
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Same kitchen, but the air quickly fills with white flour.
CHARACTER DESIGN: The three 3D chibi girls.
ACTION: The middle girl dumps the bag of flour. A thick, voluminous cloud of white flour powder forcefully poofs upward and outward, completely covering the dough and dusting the girls' bodies and faces. The girls squeeze their eyes shut and sneeze or laugh.
STRICT RULES: The flour cloud must look like dry powder, not liquid or smoke. The characters must visibly become covered in the white powder.
🎬 CLIP 4: [9-12초] 쿠키 꾸미기 (Scene 4 활용)
목표: 각자의 도구로 거대한 진저브레드맨 쿠키를 꾸미는 디테일한 손동작 묘사.
REFERENCE INSTRUCTION: Use Scene 4 as the starting reference.
OUTPUT SPECS: Micro-object physics (falling sprinkles, squeezing icing), locked background.
CINEMATOGRAPHY: Static camera, slightly angled down.
ENVIRONMENT: Same kitchen.
CHARACTER DESIGN: The three flour-dusted 3D chibi girls.
ACTION: The left girl squeezes a line of brown chocolate icing. The middle girl carefully drops a candy onto the cookie. The right girl shakes a jar, and tiny colorful sprinkles pour out and bounce onto the cookie. They all smile and move their hands actively.
STRICT RULES: The cookie base must not change shape. The falling sprinkles and icing must interact correctly with the cookie surface.
🎬 CLIP 5: [12-15초] 완성 및 포옹 (Scene 5 활용)
목표: 완성을 축하하며 다 함께 방방 뛰고 끌어안는 사랑스러운 엔딩.
REFERENCE INSTRUCTION: Use Scene 5 as the starting reference.
OUTPUT SPECS: Bouncy physics, multi-character interaction (hugging), completely static cookie.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Same kitchen.
CHARACTER DESIGN: The three 3D chibi girls.
ACTION: The girls jump up and down in excitement. They lean into the center and wrap their arms around each other in a tight, joyful group hug, squeezing their eyes shut with huge smiles.
STRICT RULES: The giant cookie and the background must remain absolutely still. Prevent clipping between the characters' bodies as they hug.
3. AI Caption Data (JSON)
[
  { "text": "", "startTime": 0, "endTime": 15 }
]

📥 [학습용 예시 23: 원본 영상 해체 데이터 (하드코딩용)]
0. Planning & Narrative (Korean)
영상 제목: 포토부스 난입 밈 (원작 영상)
활용된 레퍼런스: 프레임 밖에서의 역동적 난입, 다수 캐릭터의 좁은 공간 압박감, 카메라 스톱모션 플래시 효과
시나리오 (15초):
[0-3초] 혼자 찰칵. 혼자 포즈를 취하는 귀여운 모습과 셔터가 터지는 플래시 효과 연출.
[3-6초] 첫 번째 난입. 프레임 밖에서 두 번째 친구가 뿅 하고 튀어나오며 포즈를 취함.
[6-9초] 두 번째 난입. 세 번째 친구가 왼쪽에서 끼어들며 프레임이 차오르는 역동성.
[9-12초] 완전체 옹기종기. 마지막 친구가 등장하며 화면이 꽉 차는 극한의 귀여운 압박감.
[12-15초] 폴라로이드 출력 엔딩. 찍힌 사진이 물리적인 폴라로이드 형태로 튀어나오며 영상 마무리.
1. Image Generation Prompts (English)
Scene 1 Prompt (혼자 찰칵): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: High quality cute 3D chibi style, studio photobooth lighting. ENVIRONMENT: Inside a photobooth. The background is a closed, light-grey fabric curtain with neat folds. NO TEXT. SUBJECT & POSITION: One cute 3D chibi girl (white hair, black and white nun outfit) standing alone in the center. ACTION & EXPRESSION: She is looking straight at the camera with a cute, slightly shy expression, holding a small prop. CAMERA: Static, eye-level.
Scene 2 Prompt (첫 번째 난입): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style. ENVIRONMENT: Same photobooth with grey curtain. NO TEXT. SUBJECT & POSITION: Two 3D chibi girls. The nun girl is still in the center. A second girl (blonde hair, yellow dress, sunglasses on head) is standing closely on the right side. ACTION & EXPRESSION: They are posing together, smiling cutely at the camera. CAMERA: Static, eye-level.
Scene 3 Prompt (두 번째 난입): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style. ENVIRONMENT: Same photobooth with grey curtain. NO TEXT. SUBJECT & POSITION: Three 3D chibi girls. A third girl (pink hair, wearing a fluffy yellow duck onesie) is now standing on the left side. ACTION & EXPRESSION: All three girls are smiling brightly, squished slightly closer together, posing for the camera. CAMERA: Static, eye-level.
Scene 4 Prompt (완전체 옹기종기): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style. ENVIRONMENT: Same photobooth. NO TEXT. SUBJECT & POSITION: Four 3D chibi girls squeezed tightly together. A fourth girl (teal twin-tails) has joined in the front right. ACTION & EXPRESSION: The frame is completely full. They are all squished together in a tight, joyful group pose, smiling widely at the camera with bright eyes. CAMERA: Static, eye-level.
Scene 5 Prompt (폴라로이드 출력 엔딩): MEDIUM: vertical 9:16 3D animation render. ART & VISUAL DIRECTION: Same cute 3D chibi style, depth of field effect. ENVIRONMENT: Same photobooth. NO TEXT. SUBJECT & POSITION: The four girls are still posing in the background (slightly out of focus). A white polaroid photo strip is floating in the center foreground, sharply in focus. ACTION & EXPRESSION: The polaroid clearly displays the group photo of the four girls. CAMERA: Static, focus pulled to the polaroid in the foreground.
2. Video Generation Prompts (English)
🎥 영상 프롬프트 마스터 세트: '포토부스 난입 밈'
🎬 CLIP 1: [0-3초] 혼자 찰칵 (Scene 1 활용)
목표: 혼자 포즈를 취하는 귀여운 모습과 셔터가 터지는 플래시 효과 연출.
REFERENCE INSTRUCTION: Use Scene 1 as the starting reference.
OUTPUT SPECS: Bright camera flash effect, subtle character idle animation.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Photobooth with a static grey curtain.
CHARACTER DESIGN: One 3D chibi girl (nun outfit).
ACTION: The girl blinks and poses cutely. Suddenly, a bright, blinding white camera flash goes off, illuminating the whole screen for a fraction of a second.
STRICT RULES: The background curtain must remain perfectly still. Do not introduce any new characters yet.
🎬 CLIP 2: [3-6초] 첫 번째 난입 (Scene 1 ➔ Scene 2 연결)
목표: 프레임 밖에서 두 번째 친구가 뿅 하고 튀어나오며 포즈를 취함.
REFERENCE INSTRUCTION: Use Scene 1 as start frame and Scene 2 as end frame.
OUTPUT SPECS: Fast bouncy entry physics, camera flash effect.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Same photobooth.
CHARACTER DESIGN: Nun girl and blonde girl.
ACTION: The blonde girl quickly and bouncily pops into the frame from the right edge. She leans in next to the nun girl, and they both strike a pose. A bright camera flash goes off at the end.
STRICT RULES: The entry motion must be fast and cartoonish. The curtain behind them must not warp or move.
🎬 CLIP 3: [6-9초] 두 번째 난입 (Scene 2 ➔ Scene 3 연결)
목표: 세 번째 친구가 왼쪽에서 끼어들며 프레임이 차오르는 역동성.
REFERENCE INSTRUCTION: Use Scene 2 as start frame and Scene 3 as end frame.
OUTPUT SPECS: Squeezing physics, camera flash effect.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Same photobooth.
CHARACTER DESIGN: Nun, blonde, and pink-haired girl in a duck onesie.
ACTION: The girl in the duck onesie enthusiastically pops into the frame from the left side. The characters adjust their positions slightly to fit together, smiling brightly. Another bright camera flash goes off.
STRICT RULES: Prevent clipping between the characters' bodies as they get closer.
🎬 CLIP 4: [9-12초] 완전체 옹기종기 (Scene 3 ➔ Scene 4 연결)
목표: 마지막 친구가 등장하며 화면이 꽉 차는 극한의 귀여운 압박감.
REFERENCE INSTRUCTION: Use Scene 3 as start frame and Scene 4 as end frame.
OUTPUT SPECS: Tight group physics (squishing together), multiple camera flashes.
CINEMATOGRAPHY: Static camera.
ENVIRONMENT: Same photobooth.
CHARACTER DESIGN: All four 3D chibi girls.
ACTION: The teal-haired girl jumps in from the bottom right. All four girls squeeze tightly together to fit into the limited frame, bursting with joyful smiles. Multiple bright camera flashes go off rapidly.
STRICT RULES: The characters must look like they are physically pressed together, but do not melt or deform their faces.
🎬 CLIP 5: [12-15초] 폴라로이드 출력 (Scene 4 ➔ Scene 5 연결)
목표: 찍힌 사진이 물리적인 폴라로이드 형태로 튀어나오며 영상 마무리.
REFERENCE INSTRUCTION: Use Scene 4 as start frame and Scene 5 as end frame.
OUTPUT SPECS: Object floating physics, static background characters.
CINEMATOGRAPHY: Static camera, focal shift to the foreground.
ENVIRONMENT: Same photobooth.
CHARACTER DESIGN: The four girls (background), Polaroid photo (foreground).
ACTION: A printed physical polaroid photo suddenly pops up from the bottom of the screen and floats into the center foreground. The four girls in the background freeze their happy poses.
STRICT RULES: The floating polaroid must look like a solid physical object. The girls in the background must remain completely still as the photo appears.
3. AI Caption Data (JSON)
[
  { "text": "", "startTime": 0, "endTime": 15 }
]

`;
