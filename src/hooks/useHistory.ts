import { useState, useEffect, useRef, useCallback } from 'react';
import { HistoryItem } from '../types';
import { db } from '../utils/db';
import { sourceEpisode, recordDuration } from '../workflow/package';
import { BackgroundChoice } from '../backgroundAssets';
import { refreshAuthoredVideoPrompts } from '../workflow/promptRevision';
import type { ProductionPackage } from '../workflow/productionPackage';

export function useHistory() {
  const [history,setHistory]=useState<HistoryItem[]>(()=>{try{return JSON.parse(localStorage.getItem('pov_director_history')||'[]');}catch{return [];}});
  const current=useRef(history);current.current=history;
  const [viewingHistoryId,setViewingHistoryId]=useState<string|null>(null);
  const persist=(next:HistoryItem[])=>{localStorage.setItem('pov_director_history',JSON.stringify(next));current.current=next;setHistory(next);};
  const saveHistory=(item:HistoryItem)=>persist([item,...current.current.filter(h=>h.id!==item.id)]);
  const applyVideoPromptRevision=useCallback((pack:ProductionPackage)=>{
    const before=current.current;
    const next=before.map(item=>refreshAuthoredVideoPrompts(item,pack));
    const changed=next.filter((item,i)=>item!==before[i]);
    if(changed.length)persist(next);
    return changed;
  },[]);
  const setBackgroundChoice=(id:string,title:string,choice:BackgroundChoice)=>persist(current.current.map(item=>item.id===id?{...item,backgroundChoices:{...item.backgroundChoices,[title]:choice}}:item));
  useEffect(()=>{
    const handler=(event:Event)=>{try{
      const p=(event as CustomEvent).detail;
      if(p?.version!==1||typeof p.key!=='string'||!p.key||p.key.length>200)return;
      const item=current.current.find(h=>h.id===p.historyId);
      // Bind only the exact generated record, never whichever record is newest.
      if(!item||item.result!==p.result)return;
      const episode=sourceEpisode(p.episode);if(recordDuration(item)!==episode.duration)return;
      if(item.episode&&JSON.stringify(item.episode)!==JSON.stringify(episode))return;
      persist(current.current.map(h=>h.id===item.id?{...h,episode,editorKey:p.key}:h));
      document.documentElement.dataset.oriWorkImported=p.key;
    }catch(e){console.warn('대본 연결 실패',e);}};
    window.addEventListener('orihani-work-source',handler);
    document.documentElement.dataset.oriWorkReady='1';
    return()=>{window.removeEventListener('orihani-work-source',handler);delete document.documentElement.dataset.oriWorkReady;};
  },[]);
  const handleDeleteHistory=async(id:string,e:React.MouseEvent)=>{e.stopPropagation();persist(current.current.filter(h=>h.id!==id));if(viewingHistoryId===id)setViewingHistoryId(null);await db.delete(id).catch(console.warn);};
  const handleClearHistory=async()=>{persist([]);setViewingHistoryId(null);await db.clear().catch(console.warn);};
  return {history,setHistory,viewingHistoryId,setViewingHistoryId,saveHistory,applyVideoPromptRevision,setBackgroundChoice,handleDeleteHistory,handleClearHistory};
}
