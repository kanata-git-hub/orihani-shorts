import { useState } from 'react';
import { SourceEpisode } from '../types';
import { parseWeekly } from './weekly';
import './workflow.css';
export function WeeklyScript({onChoose}:{onChoose:(episode:SourceEpisode,character:string)=>void}) {
  const [raw,setRaw]=useState(''),[episodes,setEpisodes]=useState<ReturnType<typeof parseWeekly>>([]),[index,setIndex]=useState(0),[message,setMessage]=useState('');
  const load=(text:string)=>{setRaw(text);try{setEpisodes(parseWeekly(text));setIndex(0);setMessage('만들 에피소드를 골라 기획에 넣으세요.');}catch(e){setMessage((e as Error).message);setEpisodes([]);}};
  return <details className="ori-workflow w-full max-w-2xl mb-4 shrink-0"><summary>주간 대본에서 에피소드 고르기</summary>
    <p>휴대폰에서도 대본 파일을 열거나 내용을 붙여넣어 시작할 수 있습니다.</p>
    <a className="ori-workflow-link" href="https://drive.google.com/drive/folders/1O2wOWOLyAXmq96aXOExX0fecwK7jZbq-" target="_blank" rel="noopener noreferrer">주간 대본 폴더 열기</a>
    <label>주간 대본 파일<input type="file" accept=".md,.txt,text/plain,text/markdown" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>300000){setMessage('대본은 300KB 이하 텍스트 파일로 넣어주세요.');return;}try{load(await file.text());}catch{setMessage('대본 파일을 읽지 못했습니다.');}}}/></label>
    <details><summary>내용을 복사해서 가져오기</summary><textarea aria-label="주간 대본 내용" rows={5} value={raw} maxLength={300000} onChange={e=>setRaw(e.target.value)}/><button onClick={()=>load(raw)}>대본 읽기</button></details>
    <p role="status">{message}</p>
    {!!episodes.length&&<><label>만들 에피소드<select value={index} onChange={e=>setIndex(Number(e.target.value))}>{episodes.map((e,i)=><option key={i} value={i}>{e.title}</option>)}</select></label><p>{episodes[index].scenario}</p><button className="ori-workflow-primary" onClick={()=>{const e=episodes[index];onChoose(e,e.characters[0]||'owonjang');setMessage('아래 기획에 넣었습니다. 주인공을 확인하고 영상 기획 생성을 누르세요.');}}>이 에피소드로 기획 준비</button></>}
  </details>;
}
