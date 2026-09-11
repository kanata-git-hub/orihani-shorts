import { useState } from 'react';
import { HistoryItem } from '../types';
import { extractClips, extractOverview, extractScenes } from '../utils/extractors';
import { makePackage, recordDuration } from './package';
import { imageFile, shareFile } from './share';
import './workflow.css';

export function HistoryContinue({item,images,generating,onGenerate,onEdit,onBusy}:{item:HistoryItem;images:Record<string,string>;generating:Record<string,boolean>;onGenerate:(title:string,prompt:string,i:number,scenes:any[],result?:string)=>Promise<boolean>;onEdit:()=>void;onBusy:(v:boolean)=>void}) {
  const clips=extractClips(item.result), scenes=extractScenes(item.result);
  const [step,setStep]=useState(Object.keys(images).length?'kling':'images');
  const [index,setIndex]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  let duration:5|15;try{duration=recordDuration(item);}catch{return <p>이 기록의 클립 수를 확인해주세요.</p>;}
  const missing=clips.filter(c=>!images[c.imageTitle]);
  const lengths=duration===5?[2,3]:[4,4,3,4];
  const action=async(fn:()=>Promise<void>)=>{if(busy)return;setBusy(true);onBusy(true);try{await fn();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);onBusy(false);}};
  const copy=async(text:string,label:string)=>{if(!text.trim())throw Error('복사할 내용이 없습니다.');await navigator.clipboard.writeText(text);setMessage(label+' 복사 완료');};
  const caption=item.episode?.caption||[extractOverview(item.result).instagramCaption,...(extractOverview(item.result).hashtags||[]).map((s:string)=>'#'+s)].filter(Boolean).join('\n');
  const title=caption.replace(/#[^\s#]+/g,'').trim();
  const shortsTitle=Array.from(caption).length<=100?caption:Array.from(title).slice(0,100).join('');
  const exportFile=()=>action(async()=>{const raw=makePackage(item,images);const name=(extractOverview(item.result).title||'오리쇼츠').replace(/[\\/:*?"<>|]/g,'').slice(0,60);await shareFile(new File([raw],name+'.ori.json',{type:'application/json'}));setMessage('다른 기기에서 기록 → 작업 파일 가져오기로 열면 됩니다. 영상 파일과 편집 중인 음성은 별도로 보관해주세요.');});
  return <article className="ori-workflow">
    <p className="ori-workflow-label">{duration}초 밈 · 이 기록에서 이어하기</p>
    <div className="ori-workflow-steps" role="group" aria-label="제작 단계">
      <button disabled={busy} aria-pressed={step==='images'} onClick={()=>setStep('images')}>1. 사진</button>
      <button disabled={busy} aria-pressed={step==='kling'} onClick={()=>setStep('kling')}>2. Kling</button>
      <button disabled={busy} aria-pressed={step==='edit'} onClick={()=>setStep('edit')}>3. 편집</button>
    </div>
    <p role="status" aria-live="polite">{message||`사진 ${clips.length-missing.length}/${clips.length}장 준비됨`}</p>
    <fieldset disabled={busy||Object.values(generating).some(Boolean)}>
      {step==='images'&&<>
        <p>이미 있는 사진은 그대로 사용합니다. 새 사진 생성에는 기존 Gemini 비용이 발생합니다. 완료될 때까지 화면을 열어두세요.</p>
        <div className="ori-workflow-pictures">{clips.map((c,i)=><div key={i}>{images[c.imageTitle]?<img src={images[c.imageTitle]} alt={`클립 ${i+1} 시작 사진`}/>:<span>사진 없음</span>}<span>Clip {i+1} · {lengths[i]}초</span></div>)}</div>
        <button className="ori-workflow-primary" onClick={()=>missing.length?action(async()=>{for(let i=0;i<clips.length;i++){const c=clips[i];if(images[c.imageTitle])continue;setMessage(`사진 ${i+1}/${clips.length} 생성 중`);if(!await onGenerate(c.imageTitle,c.imagePrompt,i,scenes,item.result))throw Error(`사진 ${i+1} 생성을 완료하지 못했습니다. 이미 만든 사진은 보관했습니다.`);}setStep('kling');setMessage('사진이 준비되었습니다. Kling에서 사용할 자료를 확인하세요.');}):setStep('kling')}>{missing.length?`남은 사진 ${missing.length}장 만들기`:'사진 준비 완료 → Kling'}</button>
      </>}
      {step==='kling'&&<>
        <p>{duration===5?'한 영상으로 만듭니다. Clip 1 사진은 시작 프레임, Clip 2 사진은 마지막 프레임에 넣고 프롬프트를 순서대로 붙여넣으세요.':'클립마다 별도 영상을 만듭니다. 각 사진을 시작 프레임에 넣고 마지막 프레임은 비워두세요. 순서는 4초·4초·3초·4초입니다.'}</p>
        <div className="ori-workflow-steps">{clips.map((_,i)=><button key={i} aria-pressed={index===i} onClick={()=>setIndex(i)}>Clip {i+1}</button>)}</div>
        {clips[index]&&<div className="ori-workflow-clip">
          <strong>{duration===5?(index===0?'시작 프레임 · 2초':'마지막 프레임 · 3초'):`${index+1}번 영상 · ${lengths[index]}초`}</strong>
          {images[clips[index].imageTitle]&&<img src={images[clips[index].imageTitle]} alt={`Clip ${index+1} 사진`}/>}
          <div className="ori-workflow-actions"><button disabled={!images[clips[index].imageTitle]} onClick={()=>action(async()=>{await shareFile(imageFile(images[clips[index].imageTitle],`clip-${index+1}`));})}>사진 저장·공유</button>
          <button disabled={!clips[index].videoPrompt} onClick={()=>action(()=>copy(`[CLIP ${index+1}]\n${clips[index].videoPrompt}`,`Clip ${index+1} 프롬프트`))}>프롬프트 복사</button></div>
          <details><summary>프롬프트 보기</summary><textarea readOnly value={clips[index].videoPrompt} rows={5} aria-label="Kling 프롬프트"/></details>
        </div>}
        <a className="ori-workflow-link" href="https://kling.ai/app/video/new?ac=1" target="_blank" rel="noopener noreferrer">Kling 열기</a>
        <p>에셋·오디오·영상 길이를 확인하고 생성하세요. 완성 영상을 휴대폰에 저장한 뒤 편집으로 넘어오면 됩니다.</p>
        <button className="ori-workflow-primary" onClick={()=>setStep('edit')}>Kling 영상 준비됨 → 편집</button>
      </>}
      {step==='edit'&&<>
        <p>{item.episode?'이 기록의 한글 나레이션·자막·첫 화면 문구를 편집으로 연결합니다. 기존 편집이 있으면 그대로 이어갑니다.':'이 기록에는 주간 대본이 연결되어 있지 않습니다. 편집 화면에서 한글 나레이션·자막을 한 번 가져와주세요. 등장인물 대사는 원본 영상에서 유지합니다.'}</p>
        <button className="ori-workflow-primary" onClick={onEdit}>이 밈 영상 편집 이어하기</button>
        {!!caption&&<div className="ori-workflow-actions"><button onClick={()=>action(()=>copy(caption,'릴스 내용·쇼츠 설명'))}>릴스 내용·쇼츠 설명 복사</button><button onClick={()=>action(()=>copy(shortsTitle,'쇼츠 제목'))}>쇼츠 제목 복사</button></div>}
      </>}
      <details><summary>다른 기기로 옮기기</summary><p>기획·사진·연결된 주간 대본을 한 파일로 옮깁니다. 새 기기에서는 기록의 ‘작업 파일 가져오기’를 누르세요. 편집 중인 영상·음성 파일은 포함되지 않습니다.</p><button onClick={exportFile}>작업 파일 저장·공유</button></details>
    </fieldset>
  </article>;
}
