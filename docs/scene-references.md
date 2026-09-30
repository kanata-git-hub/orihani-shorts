# 대본의 자동 참고 연결

주간 MD/Google Docs의 `1. 시나리오`에서 각 `[장면 N (4초)]` 등의 장면 머리말 바로 아래에 다음 JSON 한 줄을 쓴다. 다른 다섯 섹션의 이름이나 영상 길이는 바꾸지 않는다.

```text
[장면 1 (4초)]
referencePlan: {"background":null,"props":[]}

[장면 2 (4초)]
referencePlan: {"background":1,"props":[{"scene":1,"objects":["상자집"]}]}

[장면 3 (3초)]
referencePlan: {"background":1,"props":[{"scene":1,"objects":["상자집"]}]}

[장면 4 (4초)]
referencePlan: {"background":1,"props":[{"scene":1,"objects":["상자집"]},{"scene":3,"objects":["청록색 선풍기"]}]}
```

- 번호는 현재 화 안의 1부터 시작하는 장면 번호다. 자신이나 미래 장면을 참조할 수 없다.
- `background`는 실제 세트가 잘 보이는 앞 장면 번호다. 새 장소라면 `null`. 같은 공간의 클로즈업을 직전 컷이라는 이유로 전체 배경 기준으로 선택하지 않는다.
- `props`는 필요한 소품 디자인의 출처 목록이다. 한 출처의 소품은 `objects`에 함께 쓴다. 최대 3개 출처, 출처당 1~8개 이름, 이름 120자 이하. 참고할 소품이 없으면 빈 배열.
- 처음 등장하는 소품은 앞 사진에 없으므로 그 장면의 설명에서 디자인한다. 다음 장면부터 실제로 보였던 출처를 연결한다. 장소가 달라도 소품만 이어갈 수 있다.
- 한 장면에 이 정보를 쓴다면 모든 장면에 정확히 한 줄씩 쓴다. 생략을 자동 추측으로 해석하지 않는다.
- 배경 구조와 지정 소품의 디자인만 참고한다. 현재 컷의 구도, 자세, 표정, 시선, 조명, 문 개폐와 젖음 같은 상태는 현재 대본이 우선이다. 앞 사진은 영상 끝 프레임이 아니다.

## 앱 동작

원본 대본의 연결을 기획 JSON의 각 clip.referencePlan으로 복사한다. 변환 모델이 생략하거나 변경해도 원본을 사용한다. 기록과 작업 내보내기에 함께 보존된다. `장면별 참고 연결`에서 연결 대상과 준비 여부를 볼 수 있다.

생성할 때 현재 작업의 최신 출처 사진을 읽는다. 배경과 소품 출처가 같으면 사진은 한 번만 전송하고 역할을 함께 표시한다. 필요한 출처 사진이 없으면 이미지 생성 요청 전에 중단하고 먼저 만들 장면을 알린다. 정상적인 1→2→3→4 사진 생성 흐름에서 자동으로 이어진다.

사용자가 수동 소품 참고를 지정하면 해당 장면의 자동 소품 목록 전체를 대신한다. 자동 배경 연결은 유지한다. 수동 연결을 해제하면 대본의 자동 소품 연결이 다시 적용된다. 수동 선택은 기존처럼 선택 당시 사진을 저장한다.

과거 기록은 자동 연결 정보가 없으면 기존 배경 추론과 수동 소품 연결을 그대로 사용한다. 업데이트만으로 기존 사진이나 기획을 덮어쓰거나 유료 재생성하지 않는다. 새 연결을 쓰려면 수정된 주간 대본으로 기획을 불러온다.
# Start-frame production contract

New planning requests use Gemini 3.8 Flash for conversion and a separate continuity
review. Rendering remains Gemini 3.1 Flash Image. `productionVersion: 1` records have
one `propBible` with stable part IDs, attachment geometry and baseline scale/capacity;
each clip's `frame` gives the parts' starting states and visibility, action, ending
state, and a bridge from the preceding video's end. Scripted transformations remain
allowed. Reference photos cannot silently add a hole, remove a wall or resize a prop.

The server assembles `imagePrompt` from an allowlist of current environment, shot,
visible characters, design and START states. It never interpolates action/end/bridge
fields or an independently generated image prompt. Video ACTION is assembled from
start, action and end, retaining the exact dialogue/audio headings. A schema check
rejects missing/unknown/duplicate parts; the model review checks semantic fidelity
to the screenplay. One repair is allowed, then a failed check returns an error.
This checks text, not rendered image quality; paid images are still user-triggered.

Existing records remain unchanged. In History, records with their original episode
have `대본대로 프롬프트 다시 만들기`: it converts the saved original into a new record,
preserving the old record's photos/video and the selected episode-wide reference.
The new record starts without old generated images or per-shot manual overrides;
its scripted referencePlan resolves references as its new images are generated.
