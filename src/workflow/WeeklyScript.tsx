import { useEffect, useRef, useState } from 'react';
import { SourceEpisode } from '../types';
import { auth } from '../lib/firebase';
import { parseWeekly } from './weekly';
import './workflow.css';
export function WeeklyScript({onChoose}:{onChoose:(episode:SourceEpisode,character:string)=>void}) {
  const [raw,setRaw]=useState(''),[episodes,setEpisodes]=useState<ReturnType<typeof parseWeekly>>([]),[index,setIndex]=useState(0),[message,setMessage]=useState('');
  const [loading,setLoading]=useState(true),[source,setSource]=useState<{name:string;url:string}|null>(null);
  const revision=useRef(0),selectedTitle=useRef('');
  const interrupt=()=>{revision.current++;setLoading(false);};
  const load=(text:string)=>{interrupt();setSource(null);setRaw(text);try{setEpisodes(parseWeekly(text));setIndex(0);selectedTitle.current='';setMessage('만들 에피소드를 골라 기획에 넣으세요.');}catch(e){setMessage((e as Error).message);setEpisodes([]);}};
  const latest=async(refresh=false)=>{
    const request=++revision.current;setLoading(true);setMessage('Drive에서 최신 주간 대본을 확인하고 있습니다…');
    try{
      const user=auth.currentUser;if(!user)throw Error('로그인 후 최신 대본을 확인할 수 있습니다.');
      const response=await fetch('/api/editor/weekly'+(refresh?'?refresh=1':''),{headers:{Authorization:`Bearer ${await user.getIdToken()}`},signal:AbortSignal.timeout(35000)});
      const data=await response.json();if(!response.ok)throw Error(data.error||'최신 대본을 읽지 못했습니다.');
      if(typeof data.text!=='string'||data.text.length>300000||typeof data.name!=='string'||!/^https:\/\/(docs|drive)\.google\.com\//.test(data.url))throw Error('대본 응답을 확인하지 못했습니다.');
      const parsed=parseWeekly(data.text);
      // A slow response must not replace a manually loaded script or selection.
      if(request!==revision.current)return;
      setRaw(data.text);setEpisodes(parsed);setIndex(Math.max(0,parsed.findIndex(e=>e.title===selectedTitle.current)));
      setSource({name:data.name,url:data.url});setMessage(`최신 대본에서 에피소드 ${parsed.length}개를 가져왔습니다. 만들 에피소드를 골라주세요.`);
    }catch(e){if(request===revision.current)setMessage((e instanceof Error&&e.name!=='TimeoutError'?e.message:'최신 대본 확인이 지연되고 있습니다.')+' 아래에서 파일이나 내용으로 직접 가져올 수도 있습니다.');}
    finally{if(request===revision.current)setLoading(false);}
  };
  useEffect(()=>{void latest();return()=>{revision.current++;};},[]);
  return <details open className="ori-workflow w-full max-w-2xl mb-4 shrink-0"><summary>주간 대본에서 에피소드 고르기</summary>
    <p>최신 주간 대본을 자동으로 가져옵니다. 문서를 따로 찾아 복사하지 않아도 됩니다.</p>
    {source&&<p><a className="ori-workflow-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a></p>}
    <p role="status" aria-live="polite">{message}</p>
    {!!episodes.length&&<><label>만들 에피소드<select value={index} onChange={e=>{interrupt();const n=Number(e.target.value);setIndex(n);selectedTitle.current=episodes[n].title;}}>{episodes.map((e,i)=><option key={i} value={i}>{e.title}</option>)}</select></label><p>{episodes[index].scenario}</p><button className="ori-workflow-primary" onClick={()=>{interrupt();const e=episodes[index];onChoose(e,e.characters[0]||'owonjang');setMessage('아래 기획에 넣었습니다. 주인공을 확인하고 영상 기획 생성을 누르세요.');}}>이 에피소드로 기획 준비</button></>}
    <button disabled={loading} onClick={()=>void latest(true)}>{loading?'최신 대본 확인 중…':'최신 대본 다시 확인'}</button>
    <details><summary>이전 대본·파일을 직접 가져오기</summary>
      <a className="ori-workflow-link" href="https://drive.google.com/drive/folders/1O2wOWOLyAXmq96aXOExX0fecwK7jZbq-" target="_blank" rel="noopener noreferrer">주간 대본 폴더 열기</a>
      <label>주간 대본 파일<input type="file" accept=".md,.txt,text/plain,text/markdown" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;interrupt();const request=revision.current;if(file.size>300000){setMessage('대본은 300KB 이하 텍스트 파일로 넣어주세요.');return;}try{const text=await file.text();if(request===revision.current)load(text);}catch{if(request===revision.current)setMessage('대본 파일을 읽지 못했습니다.');}}}/></label>
      <textarea aria-label="주간 대본 내용" rows={5} value={raw} maxLength={300000} onChange={e=>{interrupt();setRaw(e.target.value);}}/><button onClick={()=>load(raw)}>대본 읽기</button>
    </details>
  </details>;
}
