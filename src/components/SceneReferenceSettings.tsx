import { useEffect, useState } from 'react';
import type { HistoryItem } from '../types';
import { captureSceneReference, type SceneReference } from '../sceneReference';
import { extractClips, extractOverview } from '../utils/extractors';
import { db } from '../utils/db';
import '../workflow/workflow.css';

export function SceneReferenceSettings({history,value,onChange,disabled=false,excludeId,hasImages=false}: {
  history:HistoryItem[];
  value:SceneReference|null;
  onChange:(reference:SceneReference|null)=>void|Promise<void>;
  disabled?:boolean;
  excludeId?:string|null;
  hasImages?:boolean;
}) {
  const [choosing,setChoosing]=useState(false),[sourceId,setSourceId]=useState('');
  const [loadedId,setLoadedId]=useState(''),[images,setImages]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  const sources=history.filter(item=>item.id!==excludeId&&extractClips(item.result).length>0);
  const source=sources.find(item=>item.id===sourceId);
  useEffect(()=>{
    let active=true;setImages({});setLoadedId('');setMessage('');
    if(!sourceId||!choosing){setLoading(false);return;}
    setLoading(true);
    db.get(sourceId).then(media=>{if(active){setImages(media?.images||{});setLoadedId(sourceId);}})
      .catch(()=>{if(active)setMessage('사진을 불러오지 못했습니다. 다른 기록을 선택하거나 다시 열어주세요.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[sourceId,choosing]);
  const apply=async(reference:SceneReference|null)=>{
    if(saving||disabled)return;
    setSaving(true);setMessage('');
    try{await onChange(reference);setChoosing(false);setMessage(reference?'이 화에 참고 장면을 연결했습니다.':'참고 장면 연결을 해제했습니다.');}
    catch(e){setMessage((e as Error).message||'참고 장면을 저장하지 못했습니다.');}
    finally{setSaving(false);}
  };
  const select=(title:string)=>{
    if(!source||loadedId!==source.id)return;
    try{void apply(captureSceneReference(source,title,images));}catch(e){setMessage((e as Error).message);}
  };
  return <section className="ori-workflow ori-scene-reference" aria-label="다른 화 참고 장면">
    <h2>다른 화 참고 장면</h2>
    <p>이전 화의 사진을 참고해 같은 소품을 이어갑니다. 인물의 동작과 구도는 이번 대본에 맞춥니다.</p>
    {value?<div className="ori-reference-selected">
      <img src={value.imageUrl} alt="선택한 다른 화 참고 장면"/>
      <div><strong>{value.sourceTitle}</strong><p>장면 {value.sceneNumber} · {value.sceneTitle}</p></div>
    </div>:<p>연결된 참고 장면이 없습니다. 새 이야기는 연결 없이 시작하세요.</p>}
    <fieldset disabled={disabled||saving}>
      <div className="ori-workflow-actions">
        <button type="button" onClick={()=>{setChoosing(v=>!v);setSourceId('');}}>{choosing?'선택 닫기':value?'참고 장면 변경':'이전 화에서 장면 선택'}</button>
        {value&&<button type="button" onClick={()=>void apply(null)}>연결 해제</button>}
      </div>
      {choosing&&<div className="ori-reference-picker">
        <label>참고할 이전 기획<select value={sourceId} onChange={e=>setSourceId(e.target.value)}>
          <option value="">기획을 선택해주세요</option>
          {sources.map(item=><option key={item.id} value={item.id}>{item.episode?.title||extractOverview(item.result).title||'제목 없는 기획'}</option>)}
        </select></label>
        {!sources.length&&<p>참고할 기획이 없습니다. 사진이 있는 작업 파일을 기록에서 가져올 수도 있습니다.</p>}
        {loading&&<p>선택한 기획의 사진을 불러오고 있습니다…</p>}
        {!loading&&source&&loadedId===source.id&&<div className="ori-reference-grid">
          {extractClips(source.result).map((clip,i)=><div key={clip.imageTitle}>
            {images[clip.imageTitle]?<img src={images[clip.imageTitle]} alt={`참고 후보 장면 ${i+1}`}/>:<div className="ori-reference-empty">아직 사진이 없습니다</div>}
            <span>장면 {i+1} · {clip.title||clip.imageTitle}</span>
            <button type="button" disabled={!images[clip.imageTitle]} onClick={()=>select(clip.imageTitle)}>장면 {i+1} 참고하기</button>
          </div>)}
        </div>}
      </div>}
    </fieldset>
    {hasImages&&<p className="ori-reference-note">변경·해제는 앞으로 생성할 사진부터 적용됩니다. 이미 만든 사진은 다시 생성해야 바뀝니다.</p>}
    <p className="ori-reference-note">선택한 사진은 이 화에 함께 저장되며, 다음 화에 자동으로 연결되지 않습니다.</p>
    {message&&<p role="status" aria-live="polite">{message}</p>}
  </section>;
}
