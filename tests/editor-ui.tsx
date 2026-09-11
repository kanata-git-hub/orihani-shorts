// Local Vite QA entry only; not referenced by index.html or the production build.
// Uses synthetic data and no authenticated API requests.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from '../src/pages/Home';
import { defaultPlan } from '../src/editor/model';
import { Draft, syncKey, resultKey, summarizeDraft } from '../src/editor/draft';
import { editorStore, persistDraft } from '../src/editor/storage';
import { db } from '../src/utils/db';
import '../src/index.css';

// The internal QA preview is HTTP. Production remains HTTPS with native UUIDs.
if (!crypto.randomUUID) Object.defineProperty(crypto, 'randomUUID', {value:()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('')});

async function fixtures() {
  if (location.hostname !== 'terminal.local' && location.hostname !== 'localhost') throw Error('로컬 검증 전용입니다.');
  const result = await fetch('/.editor-test/media/verified-5s.mp4').then(r=>{if(!r.ok)throw Error('먼저 실제 렌더 테스트를 실행해주세요.');return r.blob();});
  const file = new File([result], '검증-5초.mp4', {type:'video/mp4',lastModified:1});
  const history = ['일부 사진 작업','사진 준비 작업','영상 입력 작업','완성된 작업'].map((title,i)=>({id:'qa-'+i,timestamp:100+i,characterId:'deoki',duration:5 as const,result:JSON.stringify({title,scenario:'검증용 대본',location:'검증',instagramCaption:'검증 #밈',hashtags:[],clips:[2,3].map((n,j)=>({title:`장면 ${j+1}`,imageTitle:`사진${j}`,imagePrompt:'test only',videoPrompt:`OUTPUT SPECS: ${n}s`}))}),episode:{duration:5 as const,title,scenario:'검증용',korean:'나레이션: 없음\n[0~2초] 덕이: "가자!"',thumbnail:'치약 짰더니 로켓? 🚀',caption:'검증'}}));
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6D1cAAAAASUVORK5CYII=';
  localStorage.setItem('pov_director_history',JSON.stringify(history));
  await db.set(history[0].id,{images:{사진0:image}});
  await db.set(history[1].id,{images:{사진0:image,사진1:image}});
  const base:Draft={id:'episode-history-qa-2',plan:{...defaultPlan(),title:'영상 입력 작업',thumbnail:'치약 짰더니 로켓? 🚀',captions:[{start:0,end:2,text:'가자! 🚀',source:'dialogue',review:'발화 시간을 확인해주세요.'}]},original:'검증용 원문 🚀',voice:'Zubenelgenubi',style:'편안하게',videos:[file]};
  await persistDraft(base,102);
  const finished:Draft={...base,id:'episode-history-qa-3',plan:{...defaultPlan(),title:'완성된 작업',thumbnail:'치약 짰더니 로켓?',captions:[]},result};
  finished.syncKey=syncKey(finished);finished.resultKey=resultKey(finished);await persistDraft(finished,103);
  const independent={...finished,id:'qa-independent-uuid',plan:{...finished.plan,title:'독립 편집',thumbnail:'이전 제목 🚀'},resultKey:'old-policy'};
  independent.syncKey=syncKey(independent);
  // Seed a v1 title-only index to exercise lazy migration without scanning Blobs.
  await editorStore(independent.id,independent);
  await editorStore('list',[{id:independent.id,title:'독립 편집'},summarizeDraft(base,102),summarizeDraft(finished,103)]);
  await editorStore('current',independent.id);
  localStorage.setItem('orihani-recent-work',JSON.stringify({kind:'editor',id:independent.id}));
}
function Harness() {
  const [width,setWidth]=useState(390),[ready,setReady]=useState(false),[error,setError]=useState('');
  const verify=async()=>{
    const before=await editorStore<any[]>('list')||[],current=await editorStore<string>('current');
    await persistDraft({id:'qa-empty-never-saved',plan:defaultPlan(),original:'',voice:'Kore',style:'',videos:[]});
    const after=await editorStore<any[]>('list')||[];
    if(after.length!==before.length||await editorStore('current')!==current||await editorStore('qa-empty-never-saved'))throw Error('빈 편집 저장 방지 실패');
    const independent=await editorStore<Draft>('qa-independent-uuid');
    if(independent?.plan.thumbnail!=='이전 제목'||!independent.result?.size||independent.textBackup?.thumbnail!=='이전 제목 🚀')throw Error('이전 편집 보존 실패');
    const summaries=await db.summaries();
    if(JSON.stringify(summaries).includes('base64')||summaries['qa-0'].imageTitles.length!==1)throw Error('사진 요약 실패');
    setError('통과: 빈 편집 미저장 / 기존 영상·원문 보존 / 가벼운 사진 요약');
  };
  return <><div style={{display:'flex',gap:12,padding:12,fontFamily:'sans-serif',fontSize:14,flexWrap:'wrap'}}><button onClick={()=>void fixtures().then(()=>setReady(true)).catch(e=>setError(e.message))}>검증 자료 준비</button><button onClick={()=>setReady(true)}>저장된 상태로 앱 열기</button><button onClick={()=>setWidth(390)}>모바일 390px</button><button onClick={()=>setWidth(1280)}>데스크톱 1280px</button><button onClick={()=>void verify().catch(e=>setError(e.message))}>저장소 회귀 검사</button><span>{error||'검증 전용 · 유료 API 호출 없음'}</span></div>{ready&&<iframe title="검증 앱" src="/tests/editor-ui.html?app=1" style={{width,height:850,border:'1px solid #ccc'}}/>}</>;
}
createRoot(document.getElementById('root')!).render(location.search==='?app=1'?<Home/>:<Harness/>);
