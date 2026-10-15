import { useEffect, useRef, useState } from 'react';
import { SourceEpisode } from '../types';
import { auth } from '../lib/firebase';
import { readWeeklyInput, type PreparedEpisode, type WeeklyChoice } from './productionPackage';
import { PromptComparison } from './PromptComparison';
import './workflow.css';

export function WeeklyScript({onChoose,onPrepared,disabled=false}:{
  onChoose:(episode:SourceEpisode,character:string)=>void;
  onPrepared:(entry:PreparedEpisode,revision:string)=>void;
  disabled?:boolean;
}) {
  const [raw,setRaw]=useState(''),[episodes,setEpisodes]=useState<WeeklyChoice[]>([]),[index,setIndex]=useState(0),[message,setMessage]=useState('');
  const [loading,setLoading]=useState(true),[source,setSource]=useState<{name:string;url:string}|null>(null);
  const revision=useRef(0),selectedTitle=useRef('');
  const interrupt=()=>{revision.current++;setLoading(false);};
  const load=(text:string)=>{
    interrupt();setSource(null);setRaw(text);
    try{setEpisodes(readWeeklyInput(text));setIndex(0);selectedTitle.current='';setMessage('만들 에피소드를 골라주세요.');}
    catch(e){setMessage((e as Error).message);setEpisodes([]);}
  };
  const latest=async(refresh=false)=>{
    const request=++revision.current;setLoading(true);setMessage('Drive에서 최신 제작안을 확인하고 있습니다…');
    try{
      const user=auth.currentUser;if(!user)throw Error('로그인 후 최신 제작안을 확인할 수 있습니다.');
      const response=await fetch('/api/editor/weekly'+(refresh?'?refresh=1':''),{headers:{Authorization:`Bearer ${await user.getIdToken()}`},signal:AbortSignal.timeout(35000)});
      const data=await response.json();if(!response.ok)throw Error(data.error||'최신 제작안을 읽지 못했습니다.');
      if(typeof data.text!=='string'||data.text.length>300000||typeof data.name!=='string'||!/^https:\/\/(docs|drive)\.google\.com\//.test(data.url))throw Error('제작안 응답을 확인하지 못했습니다.');
      const parsed=readWeeklyInput(data.text);
      if(request!==revision.current)return;
      setRaw(data.text);setEpisodes(parsed);setIndex(Math.max(0,parsed.findIndex(e=>e.title===selectedTitle.current)));
      setSource({name:data.name,url:data.url});setMessage(`에피소드 ${parsed.length}개를 가져왔습니다. 만들 에피소드를 골라주세요.`);
    }catch(e){if(request===revision.current){setEpisodes([]);setSource(null);setMessage((e instanceof Error&&e.name!=='TimeoutError'?e.message:'최신 제작안 확인이 지연되고 있습니다.')+' 아래에서 파일이나 내용으로 직접 가져올 수도 있습니다.');}}
    finally{if(request===revision.current)setLoading(false);}
  };
  useEffect(()=>{void latest();return()=>{revision.current++;};},[]);
  const chosen=episodes[index];
  const choose=()=>{
    if(!chosen||disabled)return;
    interrupt();
    try{
      if(chosen.prepared){onPrepared(chosen.prepared,chosen.preparedRevision!);setMessage('완성 제작안을 열었습니다.');}
      else{onChoose(chosen,chosen.characters[0]||'owonjang');setMessage('아래 기획에 넣었습니다. 주인공을 확인하고 영상 기획 생성을 누르세요.');}
    }catch(e){setMessage((e as Error).message);}
  };
  return <details open className="ori-workflow ori-weekly w-full max-w-2xl mb-4 shrink-0"><summary>제작안에서 시작</summary>
    <p>만들 에피소드를 고르면 이미지 제작으로 이어집니다.</p>
    {source&&<details className="ori-weekly-source"><summary>불러온 제작안 정보</summary><p><a className="ori-workflow-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a></p></details>}
    <p role="status" aria-live="polite">{message}</p>
    {chosen&&<><label className="ori-episode-select">만들 에피소드<select disabled={disabled} value={index} onChange={e=>{interrupt();const n=Number(e.target.value);setIndex(n);selectedTitle.current=episodes[n].title;}}>{episodes.map((e,i)=><option key={i} value={i}>{e.title}</option>)}</select></label>
      <p className="ori-episode-preview">{chosen.prepared?chosen.scenario.split('\n')[0]:chosen.scenario}</p>
      {chosen.prepared&&<p className="ori-episode-meta">완성 제작안 · {chosen.duration}초 · 이미지 {chosen.prepared.plan.clips.length}장 · 영상 프롬프트 {chosen.prepared.plan.clips.length}개</p>}
      <button disabled={disabled||loading} className="ori-workflow-primary" onClick={choose}>{chosen.prepared?'이 제작안으로 시작':'이 에피소드로 기획 준비'}</button>
      {chosen.prepared&&<details><summary>장면별 기획 보기</summary><p>{chosen.scenario}</p></details>}</>}
    <button disabled={disabled||loading} onClick={()=>void latest(true)}>{loading?'최신 제작안 확인 중…':'최신 제작안 다시 확인'}</button>
    {!!episodes.length&&!chosen?.prepared&&<PromptComparison episodes={episodes}/>}
    <details><summary>제작안·이전 대본 파일 가져오기</summary>
      <a className="ori-workflow-link" href="https://drive.google.com/drive/folders/1O2wOWOLyAXmq96aXOExX0fecwK7jZbq-" target="_blank" rel="noopener noreferrer">제작안 폴더 열기</a>
      <label>제작안 또는 대본 파일<input disabled={disabled} type="file" accept=".json,.md,.txt,application/json,text/plain,text/markdown" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;interrupt();const request=revision.current;if(file.size>1000000){setMessage('파일은 1MB 이하로 넣어주세요.');return;}try{const text=await file.text();if(request===revision.current)load(text);}catch{if(request===revision.current)setMessage('파일을 읽지 못했습니다.');}}}/></label>
      <textarea disabled={disabled} aria-label="주간 대본 내용" rows={5} value={raw} maxLength={300000} onChange={e=>{interrupt();setRaw(e.target.value);setEpisodes([]);setSource(null);}}/><button disabled={disabled} onClick={()=>load(raw)}>내용 읽기</button>
    </details>
  </details>;
}
