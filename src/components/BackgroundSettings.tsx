import { BACKGROUND_ASSETS, BackgroundChoices, BackgroundChoice, resolveBackground } from '../backgroundAssets';
import { extractScenes } from '../utils/extractors';
import '../workflow/workflow.css';

export function BackgroundSettings({ result, choices, onChange, disabled, images }: { result: string; choices: BackgroundChoices; onChange: (title: string, choice: BackgroundChoice) => void; disabled: boolean; images: Record<string, string> }) {
  const scenes = extractScenes(result);
  if (!scenes.length) return null;
  return <section className="ori-workflow ori-backgrounds" aria-label="배경 에셋">
    <h2 className="font-bold text-lg">배경 에셋</h2>
    <p>장면의 장소가 탕비실·치료실·접수대이면 저장된 원본을 사진 생성에 함께 사용합니다.</p>
    <details><summary>배경 원본 3장 보기·저장</summary>
      <div className="ori-background-gallery">{BACKGROUND_ASSETS.map(asset => <figure key={asset.id}>
        <img src={asset.url} alt={asset.description} loading="lazy" />
        <figcaption>{asset.name}</figcaption>
        <a href={asset.url} download={`오리한의원-${asset.name}.png`} className="ori-workflow-link">원본 저장</a>
      </figure>)}</div>
    </details>
    <fieldset disabled={disabled}>
      {scenes.map((scene, index) => {
        const resolved = resolveBackground(scenes, index, result, choices);
        return <label key={scene.title}>Clip {index + 1} 배경
          <select aria-label={`Clip ${index + 1} 배경`} value={choices[scene.title] || 'auto'} onChange={event => onChange(scene.title, event.target.value as BackgroundChoice)}>
            <option value="auto">자동 · {resolveBackground(scenes, index, result, { ...choices, [scene.title]: 'auto' })?.name || '지정 배경 없음'}</option>
            {BACKGROUND_ASSETS.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            <option value="none">배경 에셋 사용 안 함</option>
          </select>
          <small>{resolved ? `${resolved.name} 원본을 다음 사진 생성에 사용합니다.` : '이 장면의 프롬프트로 배경을 만듭니다.'}{images[scene.title] ? ' 기존 사진은 유지됩니다. 바꾸려면 해당 사진을 다시 생성하세요.' : ''}</small>
        </label>;
      })}
    </fieldset>
  </section>;
}
