import { useState } from 'react';
import { getKling4Plan, validateKling4Plan, CHARACTER_DRIVE_URL } from '../kling4';
import { extractScenes } from '../utils/extractors';
import { ImageImport } from '../components/ImageImport';
import { ImagePreview } from '../components/ImagePreview';
import { downloadFile, imageFile } from './share';

export function Kling4Workspace({ result, images, busy, ready = true, onApply, onGenerate, onUpdate, onEdit }: {
  result: string; images: Record<string, string>; busy?: boolean; ready?: boolean;
  onApply: (title: string, image: string) => Promise<boolean>;
  onGenerate: (title: string, prompt: string, index: number, scenes: any[], result?: string) => unknown;
  onUpdate: (result: string) => void;
  onEdit?: () => void;
}) {
  const plan = getKling4Plan(result)!;
  const [index, setIndex] = useState(0), [message, setMessage] = useState('');
  const [prompt, setPrompt] = useState(plan.videoPrompt), [editing, setEditing] = useState(false);
  const frame = plan.keyframes[index] || plan.keyframes[0];
  const scenes = extractScenes(result), locked = busy || !ready;
  const count = plan.keyframes.filter(f => images[f.imageTitle]).length;
  const action = async (fn: () => unknown) => { try { await fn(); } catch (e) { setMessage((e as Error).message); } };
  const copy = (text: string, label: string) => action(async () => { await navigator.clipboard.writeText(text); setMessage(`${label} 복사 완료`); });
  return <article className="ori-workflow ori-kling4">
    <div className="ori-kling4-heading">
      <h3>Kling · {plan.duration}초</h3>
      <span>이미지 {count}/{plan.keyframes.length}장 준비</span>
    </div>
    <div className="ori-kling4-status" role="status" aria-live="polite">{message}</div>
    <div className="ori-keyframe-picker" role="group" aria-label="주요장면 이미지">
      {plan.keyframes.map((f, i) => <button key={f.imageTitle} disabled={busy} aria-pressed={index === i} onClick={() => setIndex(i)}>{i + 1}. {f.time === 0 ? '시작' : f.time === plan.duration ? '끝' : `${f.time}초`} {images[f.imageTitle] ? '✓' : ''}</button>)}
    </div>
    <h4 className="ori-keyframe-title">{frame.title} <span>{frame.time}초</span></h4>
    {images[frame.imageTitle] && <ImagePreview src={images[frame.imageTitle]} alt={frame.title}/>}
    <div className="ori-kling4-download">
      <button disabled={locked || !images[frame.imageTitle]} onClick={() => action(() => downloadFile(imageFile(images[frame.imageTitle], `keyframe-${index + 1}-${frame.time}s`)))}>이미지 다운로드</button>
    </div>
    <div className="ori-kling4-video">
      <h4 className="sr-only">전체 영상 프롬프트</h4>
      {plan.needsVideoReview && <p className="ori-note">예전 클립 지시문을 합친 초안입니다. 각 구간의 동작·카메라·시작 상태를 확인하고 저장해주세요. 기존 사진은 실제 시작 시점에 유지했으며, 마지막 사진을 끝 장면으로 바꾸지 않았습니다.</p>}
      <div className="ori-kling4-launch">
        <button className="ori-workflow-primary" disabled={!!plan.needsVideoReview || editing} onClick={() => copy(plan.videoPrompt, '전체 영상 프롬프트')}>전체 영상 프롬프트 복사</button>
        <a className="ori-workflow-link" href="https://kling.ai/app/video/new?ac=1" target="_blank" rel="noopener noreferrer">Kling 열기</a>
      </div>
      <div className="ori-kling4-next">
        <button disabled={locked} onClick={() => { setPrompt(plan.videoPrompt); setEditing(!editing); }}>{editing ? '수정 취소' : plan.needsVideoReview ? '프롬프트 확인·수정' : '프롬프트 보기·수정'}</button>
        {onEdit && <button disabled={locked} onClick={onEdit}>완성 영상 편집하기</button>}
      </div>
      {editing && <div><textarea aria-label="전체 영상 프롬프트 수정" rows={12} maxLength={30000} value={prompt} onChange={e => setPrompt(e.target.value)}/><button disabled={locked || !prompt.trim()} onClick={() => action(() => {
        const next = { ...plan, videoPrompt: prompt, needsVideoReview: false }; validateKling4Plan(next); onUpdate(JSON.stringify(next)); setEditing(false); setMessage('전체 영상 프롬프트를 저장했습니다.');
      })}>확인·저장</button></div>}
    </div>
    <details key={frame.imageTitle} className="ori-kling4-options" open={!images[frame.imageTitle]}>
      <summary>이미지 추가·교체 및 설정</summary>
      <ImageImport key={frame.imageTitle} title={frame.imageTitle} disabled={locked} hasImage={!!images[frame.imageTitle]} onApply={onApply}/>
      <button onClick={() => copy(`${plan.continuity}\n\nKEYFRAME AT ${frame.time}s OF ${plan.duration}s:\n${frame.imagePrompt}`, '이미지 요청문')}>이미지 요청문 복사</button>
      <details><summary>Gemini로 이 이미지 생성하기 · 선택</summary>
        <p>이미지 생성·자동 검수 시 비용이 발생합니다. 같은 장소는 첫 이미지를 기준으로 배경과 소품을 이어갑니다.</p>
        <button disabled={locked} onClick={() => onGenerate(frame.imageTitle, frame.imagePrompt, index, scenes, result)}>{images[frame.imageTitle] ? 'Gemini로 다시 생성' : 'Gemini로 생성'}</button>
      </details>
      <details><summary>배경·소품 고정 사항</summary><p className="whitespace-pre-wrap">{plan.continuity}</p><p>{frame.imagePrompt}</p></details>
      <a className="ori-workflow-link" href={CHARACTER_DRIVE_URL} target="_blank" rel="noopener noreferrer">캐릭터 참고 폴더 열기</a>
    </details>
    <details className="ori-kling4-help"><summary>Kling에 넣는 방법</summary>
      <p>이미지를 위 순서와 시점에 배치하고, 전체 프롬프트를 한 번 넣으세요. 캐릭터 원본은 인물 참고용이고, 위 이미지는 영상 속 주요 시점입니다.</p>
      <p>Kling에서 {plan.duration}초·세로 9:16으로 생성하세요. 완성된 MP4 한 개를 편집에 넣습니다.</p>
      <p>그림이 연결된 Drive 제작안은 시작할 때 함께 불러옵니다. 직접 만든 그림으로 교체할 수도 있습니다.</p>
    </details>
  </article>;
}
