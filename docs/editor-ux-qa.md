# 영상 편집 UX·자막 수정

## 변경 범위

- 첫 기획 화면의 최근 작업 카드: 제목·상태·다음 행동 표시. 기획 생성, 기록 선택, 독립 편집을 각각 정확한 ID로 기억합니다.
- 기록의 사진 준비 수와 편집 상태 표시. 메타데이터 없는 이전 기록은 확인 필요로 표시합니다. 사진 한 장만 있을 때 Kling 단계가 선택되지 않습니다.
- 기록에서 해당 편집으로 바로 이동. 기존 편집 복원과 새 대본 가져오기의 안내를 구분합니다.
- 영상 / 음성 / 자막 / 완성본 단계. 목소리, 고급 음량, 자막 상세 시간, 기록 관리 기능은 펼쳐서 사용합니다.
- 프런트·서버 공통 문자 정리. 이모티콘 조합, 피부색, 국기, 장식, 보이지 않는 제어 문자를 정리합니다. 숫자 키캡은 숫자를 남기며 한글·영문·숫자·일반 문장부호는 유지합니다.
- 이전 편집의 영상·음성·완성 Blob과 정리 전 원문을 보존합니다. 새 문자 정책과 맞지 않는 완성 파일은 명시적으로 이전 설정의 결과로 표시합니다.
- 저장 실패 시 재시도 전까지 편집 전환을 막고, 내용 없는 새 편집은 저장하지 않습니다.

## 유지 사항

5초 영상 1개, 15초 영상 4개(4/4/3/4초), 해설 전용 TTS, 원본 대사 보호, 숫자 발음 변환, 음성 분석 캐시를 유지합니다. 폰트는 Kyobo Handwriting 2024입니다. 제목은 0~1초 x=540/y=480, 자막은 x=540/y=1440에 표시됩니다.

`orihani-editor-import`의 version/key/episode와 `data-ori-editor-ready`, `data-ori-editor-imported` 계약은 유지합니다. 독립 편집 UUID를 기록에 추측 연결하지 않습니다.

## 저장 구조

편집 DB 버전은 1을 유지합니다. 기존 `list` 항목에 가벼운 요약만 추가하며 Blob·목록·current를 한 트랜잭션으로 저장합니다. 열어 본 이전 편집만 갱신합니다.

사진 DB는 버전 2에 `summaries` 저장소를 추가합니다. 기존 `media`를 유지하고, 실제로 연 기록의 사진 이름만 요약합니다. 상태 조회로 모든 사진이나 영상 Blob을 읽지 않습니다. 다른 탭이 업그레이드를 막으면 해당 탭을 닫도록 안내합니다.

기록은 같은 기기·같은 브라우저 저장입니다. 기기 간 자동 동기화 기능은 추가하지 않았습니다.

## 검사

```sh
npm ci
npm run lint
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck server.ts server/editor/routes.ts server/editor/render.ts
FFMPEG_PATH=ffmpeg node --test tests/editor.test.cjs
node --test tests/character-reference.test.cjs
npm run build
```

실제 렌더 검사에는 ffmpeg, fontconfig와 앱의 TTF 설치가 필요합니다. 자막 폰트의 실제 문자 지원 목록도 검사합니다. 테스트에서 만든 영상에는 220Hz 원본 오디오와 880Hz 해설 오디오를 사용하며 실제 유료 생성 API는 호출하지 않습니다.

로컬 개발 화면의 `/tests/editor-ui.html`은 합성 자료를 준비한 뒤 모바일 390px·데스크톱 1280px, 재시작, 직접 가져오기, 일부 사진, 독립 편집, 자막 수정, 기존 결과 구분을 검증하는 전용 진입점입니다. 운영 빌드에는 포함되지 않으며 운영 로그인·권한 검사를 변경하지 않습니다. HTTP 검증 화면에서만 UUID 대체 함수를 사용합니다.

`server.ts`의 개발용 `--port`/`--host` 처리만 추가했습니다. 운영 Cloud Run의 PORT, 자원, 모델, 배포 설정은 변경하지 않았습니다.
