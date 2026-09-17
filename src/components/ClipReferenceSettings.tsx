import { useEffect, useState } from 'react';
import type { HistoryItem } from '../types';
import { captureClipReference, type ClipReferences, type SceneReference } from '../sceneReference';
import { extractClips, extractOverview } from '../utils/extractors';
import { db } from '../utils/db';
import '../workflow/workflow.css';

export function ClipReferenceSettings({item,history,images,value,onChange,onGenerate,disabled=false}: {
  item:HistoryItem;
  history:HistoryItem[];
  images:Record<string,string>;
  value:ClipReferences;
  onChange:(title:string,reference:SceneReference|null)=>Promise<void>;
  onGenerate?:(title:string,index:number)=>Promise<boolean>;
  disabled?:boolean;
}) {
  const clips=extractClips(item.result);
  const [targetIndex,setTargetIndex]=useState(0),[choosing,setChoosing]=useState(false);
  const [sourceId,setSourceId]=useState(item.id),[loadedId,setLoadedId]=useState('');
  const [sourceImages,setSourceImages]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  const sources=[item,...history.filter(h=>h.id!==item.id&&extractClips(h.result).length>0)];
  const source=sources.find(h=>h.id===sourceId),target=clips[targetIndex];
  const current=sourceId===item.id,availableImages=current?images:sourceImages;
  const ready=current||loadedId===sourceId;
  const reference=target?value[target.imageTitle]:undefined;
  useEffect(()=>{
    let active=true;setSourceImages({});setLoadedId('');setLoading(false);
    if(!choosing||current||!sourceId)return;
    setLoading(true);
    db.get(sourceId).then(media=>{if(active){setSourceImages(media?.images||{});setLoadedId(sourceId);}})
      .catch(()=>{if(active)setMessage('참고 사진을 불러오지 못했습니다. 다시 선택해주세요.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[sourceId,current,choosing]);
  if(!target)return null;
  const apply=async(next:SceneReference|null)=>{
    if(disabled||saving)return;
    setSaving(true);setMessage('');
    try{await onChange(target.imageTitle,next);setChoosing(false);setMessage(next?`장면 ${targetIndex+1}에 소품 참고 사진을 연결했습니다.`:`장면 ${targetIndex+1}의 소품 참고를 해제했습니다.`);}
    catch(e){setMessage((e as Error).message||'참고 사진을 저장하지 못했습니다.');}
    finally{setSaving(false);}
  };
  const select=(title:string)=>{
    if(!source||!ready)return;
    try{void apply(captureClipReference(item,target.imageTitle,source,title,availableImages));}
    catch(e){setMessage((e as Error).message);}
  };
  const generate=async()=>{
    if(disabled||saving||!onGenerate)return;
    setSaving(true);setMessage('');
    try{if(await onGenerate(target.imageTitle,targetIndex))setMessage(`소품 참고를 반영해 장면 ${targetIndex+1} 사진을 만들었습니다.`);}
    catch(e){setMessage((e as Error).message||'사진을 만들지 못했습니다.');}
    finally{setSaving(false);}
  };
  const candidates=source?extractClips(source.result).map((clip,i)=>({clip,i})).filter(({i})=>!current||i<targetIndex):[];
  return <section className="ori-workflow ori-scene-reference" aria-label="장면별 소품 참고">
    <h2>장면별 소품 참고</h2>
    <p>현재 화의 앞 장면이나 다른 화의 사진에서 소품을 가져옵니다. 예: 장면 4의 치킨을 장면 2 사진과 같은 디자인으로 만들기.</p>
    <fieldset disabled={disabled||saving}>
      <label>소품을 이어갈 장면<select value={targetIndex} onChange={e=>{setTargetIndex(Number(e.target.value));setChoosing(false);setSourceId(item.id);setMessage('');}}>
        {clips.map((clip,i)=><option key={clip.imageTitle} value={i}>장면 {i+1} · {clip.title}{value[clip.imageTitle]?' · 참고 연결됨':''}</option>)}
      </select></label>
      {reference?<div className="ori-reference-selected">
        <img src={reference.imageUrl} alt={`장면 ${targetIndex+1}의 소품 참고 사진`}/>
        <div><strong>{reference.sourceId===item.id?'현재 화':reference.sourceTitle} · 장면 {reference.sceneNumber}</strong><p>이 사진에 나온 소품의 디자인을 참고합니다.</p></div>
      </div>:<p>장면 {targetIndex+1}에 연결된 소품 참고 사진이 없습니다.</p>}
      <div className="ori-workflow-actions">
        <button type="button" onClick={()=>{setChoosing(v=>!v);setSourceId(item.id);setMessage('');}}>{choosing?'선택 닫기':reference?'소품 참고 사진 변경':'소품 참고 사진 선택'}</button>
        {reference&&<button type="button" onClick={()=>void apply(null)}>이 장면 연결 해제</button>}
      </div>
      {choosing&&<div className="ori-reference-picker">
        <label>사진을 가져올 화<select value={sourceId} onChange={e=>{setSourceId(e.target.value);setMessage('');}}>
          {sources.map(h=><option key={h.id} value={h.id}>{h.id===item.id?'현재 화 · ':''}{h.episode?.title||extractOverview(h.result).title||'제목 없는 기획'}</option>)}
        </select></label>
        {current&&<p>현재 화에서는 장면 {targetIndex+1}보다 앞서 나온 사진을 선택할 수 있습니다.</p>}
        {loading&&<p>사진을 불러오는 중입니다…</p>}
        {!loading&&ready&&<div className="ori-reference-grid">{candidates.map(({clip,i})=><div key={clip.imageTitle}>
          {availableImages[clip.imageTitle]?<img src={availableImages[clip.imageTitle]} alt={`소품 참고 후보 장면 ${i+1}`}/>:<div className="ori-reference-empty">먼저 이 장면의 사진을 만들어주세요</div>}
          <span>장면 {i+1} · {clip.title}</span>
          <button type="button" disabled={!availableImages[clip.imageTitle]} onClick={()=>select(clip.imageTitle)}>장면 {i+1}의 소품 참고</button>
        </div>)}</div>}
        {current&&!candidates.length&&<p>첫 장면에는 같은 화의 앞 장면이 없습니다. 다른 화에서 선택하거나 연결 없이 만드세요.</p>}
      </div>}
      {reference&&onGenerate&&<button type="button" className="ori-workflow-primary" onClick={()=>void generate()}>{`장면 ${targetIndex+1} 사진 ${images[target.imageTitle]?'다시 만들기':'만들기'}`}</button>}
    </fieldset>
    <p className="ori-reference-note">소품만 참고하며 배경·구도·자세는 생성할 장면의 지시를 따릅니다. 이 연결은 선택한 장면에만 적용됩니다.</p>
    {!!images[target.imageTitle]&&<p className="ori-reference-note">장면 {targetIndex+1}은 이미 사진이 있습니다. 선택 후 해당 사진을 다시 생성해야 반영됩니다.</p>}
    <p className="ori-reference-note">선택 당시 사진을 함께 저장합니다. 원본을 다시 만들었다면 참고 사진도 다시 선택해주세요.</p>
    {reference&&onGenerate&&<p className="ori-reference-note">사진 생성에는 기존 Gemini 비용이 발생합니다.</p>}
    {message&&<p role="status" aria-live="polite">{message}</p>}
  </section>;
}
