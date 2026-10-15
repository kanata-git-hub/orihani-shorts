import { useState } from 'react';
import { defaultKeyframeTimes, CHARACTER_DRIVE_URL, type VideoDuration } from '../kling4';

export function Kling4Start() {
  const [duration, setDuration] = useState<VideoDuration>(15), [message, setMessage] = useState('');
  const times = defaultKeyframeTimes(duration);
  const request = `오리쇼츠 앱에 가져올 Kling 4.0 완성 제작안과 주요장면 이미지를 만들어주세요.
별도 GPT API를 호출하지 말고 이 대화에서 제공되는 이미지 생성 기능을 사용해주세요. 다른 유료 API는 별도 동의 없이는 사용하지 마세요.
캐릭터 원본: ${CHARACTER_DRIVE_URL}
영상은 ${duration}초, 세로 9:16, 한 편입니다. 주요장면 이미지는 기본 ${times.length}장(권장 시점 ${times.join(', ')}초)이며 사건에 맞게 중간 시점을 조절하세요. 장면별로 따로 영상을 만들지 않습니다.
기획을 먼저 확인하고 첫 이미지를 만든 뒤 같은 장소의 후속 이미지는 첫 이미지를 편집해서 캐릭터·배경·소품을 유지하세요. 각 이미지는 독립 파일로 저장하고, 승인된 이미지와 제작안 JSON을 Drive에 저장해주세요. 캐릭터 참고 원본은 덮어쓰지 마세요.
제작안 JSON 형식: {"format":"orihani-production","version":1,"revision":"날짜-버전","episodes":[{"number":회차번호,"characterId":"owonjang 또는 deoki 또는 nurse","episode":{"duration":${duration},"title":"[에피소드 N] 제목","scenario":"한글 기획 전체","korean":"해설: 없음 또는 명시된 대사와 자막 시간","thumbnail":"","caption":"릴스 문구"},"plan":{"workflow":"kling4","duration":${duration},"title":"에피소드 접두어를 제외한 동일 제목","location":"장소","scenario":"episode.scenario와 완전히 동일한 기획","instagramCaption":"릴스 본문","hashtags":["태그1","태그2","태그3","태그4","태그5"],"continuity":"고정할 캐릭터·배경·소품의 색상·수량·크기·소유·접촉·배치","videoPrompt":"시간대별 사건·원인·반응·동작·카메라·정확한 대사 또는 무음·소리를 포함한 전체 ${duration}초용 영문 프롬프트 하나","keyframes":[{"time":0,"title":"시작","imageTitle":"고유한 이미지 이름","imagePrompt":"해당 시점의 정확한 정지 상태를 그릴 영문 요청문","locationId":"장소 식별자","backgroundAsset":"none","referencePlan":{"background":null,"props":[]}}]}}]}
keyframes에는 ${times.length}장 전체를 넣으세요. time은 0초부터 오름차순, 마지막은 ${duration}초입니다. 같은 장소의 후속 이미지 referencePlan.background는 첫 이미지 번호 1을 참고하고, props는 [{"scene":1,"objects":["고정할 소품 이름"]}]처럼 앞 이미지의 실제 소품을 지정하세요. 새 장소는 background:null입니다. 영상의 이야기 장면 수와 이미지 수는 같을 필요가 없습니다. clips 배열은 넣지 마세요. 앱에 넣기 전 제작안 형식과 실제 그림의 일관성을 확인해주세요.`;
  return <section className="ori-workflow ori-kling4-start">
    <h2>Kling 4.0으로 만들기</h2>
    <p>ChatGPT에서 기획·이미지를 준비하고, 아래에서 제작안을 가져오세요. 앱의 이미지 가져오기는 API를 호출하지 않습니다.</p>
    <div className="ori-keyframe-picker" role="group" aria-label="Kling 4.0 영상 길이">{([5, 15, 30] as const).map(d => <button key={d} aria-pressed={duration === d} onClick={() => setDuration(d)}>{d}초 · {defaultKeyframeTimes(d).length}장</button>)}</div>
    <p>시작·중요 변화·끝을 주요장면으로 정합니다. 기본 {times.length}장 → 완성 영상 1개</p>
    <button onClick={async () => { try { await navigator.clipboard.writeText(request); setMessage('ChatGPT에 붙여넣을 제작 요청문을 복사했습니다.'); } catch { setMessage('복사하지 못했습니다. 다시 눌러주세요.'); } }}>ChatGPT 제작 요청문 복사</button>
    <p role="status">{message}</p>
  </section>;
}
