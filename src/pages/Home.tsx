import { ImageChecks } from '../components/ImageChecks';
import { useEffect, useState, useCallback } from 'react';
import { SourceEpisode } from '../types';
import { HistoryItem } from '../types';
import { WeeklyScript } from '../workflow/WeeklyScript';
import { episodePrompt } from '../workflow/weekly';
import { isAuthoredPlan } from '../workflow/productionPackage';
import { editorEpisode, readPackage, importIdentity, MAX_PACKAGE_BYTES } from '../workflow/package';
import { db, MEDIA_CHANGED, MediaSummary } from '../utils/db';
import { DraftSummary } from '../editor/draft';
import { RecentWork, RecentTarget, readRecentTarget } from '../workflow/RecentWork';
import { recordDraftId, recordProgress } from '../workflow/progress';
import { VideoEditor } from '../editor/VideoEditor';
import { Sparkles, Clapperboard, AlertCircle } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { extractScenes, extractOverview } from '../utils/extractors';
import { prepareSocialCaption } from '../utils/socialCaption';

import { MobileNavigation } from '../components/MobileNavigation';
import { Header } from '../components/Header';
import { WorkboardSidebar } from '../components/WorkboardSidebar';
import { HistorySidebar } from '../components/HistorySidebar';
import { WorkboardContent } from '../components/WorkboardContent';
import { HistoryContent } from '../components/HistoryContent';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { BackgroundSettings } from '../components/BackgroundSettings';
import { BackgroundChoice } from '../backgroundAssets';
import { SceneReferenceSettings } from '../components/SceneReferenceSettings';
import { ClipReferenceSettings } from '../components/ClipReferenceSettings';
import { captureSceneReference, readClipReferences, type SceneReference } from '../sceneReference';

// Hooks
import { useToast } from '../hooks/useToast';
import { useSettings } from '../hooks/useSettings';
import { useHistory } from '../hooks/useHistory';
import { useMedia } from '../hooks/useMedia';
import { useGeneration } from '../hooks/useGeneration';
import { useMediaGeneration } from '../hooks/useMediaGeneration';

export default function App() {
  const { toast, showToast } = useToast();
  const { apiKeys } = useSettings();
  const { history, viewingHistoryId, setViewingHistoryId, saveHistory, setBackgroundChoice, handleDeleteHistory, handleClearHistory } = useHistory();
  
  const [source,setSource]=useState<SourceEpisode|null>(null);
  const [pendingReference,setPendingReference]=useState<SceneReference|null>(null);
  const [referenceBusy,setReferenceBusy]=useState(false);
  const [workflowBusy,setWorkflowBusy]=useState(false);
  const [editorBusy,setEditorBusy]=useState(false);
  const [drafts,setDrafts]=useState<DraftSummary[]>([]);
  const [mediaSummaries,setMediaSummaries]=useState<Record<string,MediaSummary>>({});
  const [resumeId,setResumeId]=useState<string>();
  const resumeHandled=useCallback(()=>setResumeId(undefined),[]);
  const [recent,setRecent]=useState<RecentTarget|undefined>(readRecentTarget);
  const remember=useCallback((value:RecentTarget)=>{setRecent(value);try{localStorage.setItem('orihani-recent-work',JSON.stringify(value));}catch{/* preference only */}},[]);
  const editorActive=useCallback((id:string)=>remember({kind:'editor',id}),[remember]);
  useEffect(()=>{
    let active=true;
    db.summaries().then(values=>{if(active)setMediaSummaries(current=>({...values,...current}));}).catch(()=>{});
    const changed=(event:Event)=>{const {id,summary,clear}=(event as CustomEvent).detail;setMediaSummaries(current=>{if(clear)return {};const next={...current};if(summary)next[id]=summary;else delete next[id];return next;});};
    window.addEventListener(MEDIA_CHANGED,changed);return()=>{active=false;window.removeEventListener(MEDIA_CHANGED,changed);};
  },[]);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[2].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [manualPlanOpen, setManualPlanOpen] = useState(false);
  const [view, setView] = useState<'15s-plan' | '5s-plan' | 'scenario' | 'prompts' | 'history' | 'editor'>('15s-plan');

  const {
    isGenerating,
    result,
    error,
    currentWorkboardId,
    handleGenerate: generatePlan, handleLoadPrepared
  } = useGeneration(showToast, saveHistory, apiKeys);
  useEffect(()=>{if(result&&currentWorkboardId&&!isGenerating)remember({kind:'history',id:currentWorkboardId});},[result,currentWorkboardId,isGenerating,remember]);
  
  const {
    generatingImages, setGeneratingImages,
    sceneImages, setSceneImages,
    saveMediaToDB,
    targetId, mediaReady, sceneReference, saveSceneReference, clipReferences, saveClipReference
  } = useMedia(view === 'history' ? 'history' : 'workboard', currentWorkboardId, viewingHistoryId);

  const {
    handleGenerateImage, handleCompareImages, handleReviewImage, handleApplyImage
  } = useMediaGeneration(
    showToast, saveMediaToDB, targetId,
    setGeneratingImages, sceneImages, setSceneImages,
    apiKeys, view==='history'?(history.find(h=>h.id===viewingHistoryId)?.characterId||selectedCharacter):selectedCharacter,
    history.find(h=>h.id===targetId)?.backgroundChoices
  );

  const handleGenerate = async (duration: '15s' | '5s' = '15s') => {
    setSceneImages({});
    setView('scenario');
    const ok=await generatePlan(selectedCharacter, customPrompt, duration, source&&source.duration===(duration==='5s'?5:15)&&episodePrompt(source)===customPrompt?source:undefined,pendingReference);
    if(ok){setPendingReference(null);setSource(null);setCustomPrompt('');}
  };

  const locked=workflowBusy||editorBusy||referenceBusy||isGenerating||Object.values(generatingImages).some(Boolean);
  const rebuildHistoryPrompts=async()=>{
    const item=history.find(h=>h.id===viewingHistoryId);
    if(locked||!item?.episode||isAuthoredPlan(item.result))return;
    setWorkflowBusy(true);
    try{
      const media=await db.get(item.id);
      setSelectedCharacter(item.characterId);setSceneImages({});setView('scenario');
      await generatePlan(item.characterId,episodePrompt(item.episode),item.episode.duration===15?'15s':'5s',item.episode,media?.sceneReference);
    }catch(e){showToast((e as Error).message,'error');}
    finally{setWorkflowBusy(false);}
  };
  const useInAnotherEpisode=(imageTitle:string)=>{
    try{
      const item=history.find(h=>h.id===targetId);
      if(!item||!mediaReady||locked)throw Error('사진이 준비된 기획에서 장면을 선택해주세요.');
      setPendingReference(captureSceneReference(item,imageTitle,sceneImages));
      setSource(null);setCustomPrompt('');setView('15s-plan');
      showToast('참고 장면을 선택했습니다. 이어서 만들 대본을 골라주세요.');
    }catch(e){showToast((e as Error).message,'error');}
  };
  const referenceSettings=()=>targetId&&<SceneReferenceSettings key={targetId} history={history} excludeId={targetId} value={sceneReference} disabled={locked||!mediaReady} hasImages={Object.keys(sceneImages).length>0} onChange={async reference=>{setReferenceBusy(true);try{await saveSceneReference(reference);}finally{setReferenceBusy(false);}}}/>;
  const clipReferenceSettings=()=>{
    const item=history.find(h=>h.id===targetId);
    return item&&<ClipReferenceSettings key={item.id} item={item} history={history} images={sceneImages} value={clipReferences} disabled={locked||!mediaReady} onGenerate={(title,index)=>{const scenes=extractScenes(item.result);return handleGenerateImage(title,scenes[index].prompt,index,scenes,item.result);}} onChange={async(title,reference)=>{
      setReferenceBusy(true);
      try{if(reference)readClipReferences({[title]:reference},item);await saveClipReference(title,reference);}
      finally{setReferenceBusy(false);}
    }}/>;
  };
  const backgroundSettings = (plan: string) => <BackgroundSettings result={plan} choices={history.find(h=>h.id===targetId)?.backgroundChoices || {}} images={sceneImages} disabled={locked || !targetId || isGenerating} onChange={(title:string,choice:BackgroundChoice)=>{try{if(targetId)setBackgroundChoice(targetId,title,choice);}catch{showToast('배경 선택을 저장하지 못했습니다. 저장 공간을 확인해주세요.','error');}}}/>;
  const selectHistory=(id:string|null)=>{setViewingHistoryId(id);if(id)remember({kind:'history',id});};
  const resumeEditor=(id:string)=>{setResumeId(id);setView('editor');remember({kind:'editor',id});};
  const openRecordEditor=(item:HistoryItem)=>{try{if(document.documentElement.dataset.oriEditorReady!=='1')throw Error('편집 화면을 준비 중입니다. 잠시 후 다시 눌러주세요.');setResumeId(undefined);window.dispatchEvent(new CustomEvent('orihani-editor-import',{detail:{version:1,key:item.editorKey||'history-'+item.id,episode:editorEpisode(item)}}));}catch(e){showToast((e as Error).message,'error');}};
  const importWork=async(file:File)=>{try{if(file.size>MAX_PACKAGE_BYTES)throw Error('작업 파일은 48MB 이하로 넣어주세요.');const pack=readPackage(await file.text());const item=importIdentity(pack.item,history);const importedRefs=Object.fromEntries(Object.entries(pack.clipReferences||{}).map(([title,ref])=>[title,ref.sourceId===pack.item.id?{...ref,sourceId:item.id}:ref]));await db.set(item.id,{images:pack.images,...(pack.sceneReference?{sceneReference:pack.sceneReference}:{}),clipReferences:importedRefs});saveHistory(item);selectHistory(item.id);showToast('기획·사진·대본을 가져왔습니다.');}catch(e){showToast((e as Error).message,'error');}};
  const currentOverview = extractOverview(result);
  const reelsCaption = prepareSocialCaption(currentOverview.instagramCaption, currentOverview.hashtags).text;
  const currentScenes = extractScenes(result);
  const viewingScenes = viewingHistoryId ? extractScenes(history.find(h => h.id === viewingHistoryId)?.result || '') : [];

  const handleExportPlan = () => {
    if (!result && !viewingHistoryId) return;
    const contentToExport = view === 'history' && viewingHistoryId 
      ? history.find(h => h.id === viewingHistoryId)?.result 
      : result;
    
    if (!contentToExport) return;

    const blob = new Blob([contentToExport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POV_Plan_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Plan exported successfully!");
  };

  const handleSaveDraft = () => {
    showToast("Plan saved to History successfully!");
  };

  const checkImageCandidate = (title: string, candidate: string, repair: boolean) => {
    const plan = view === 'history' ? history.find(h => h.id === viewingHistoryId)?.result || '' : result;
    const scenes = extractScenes(plan), index = scenes.findIndex(scene => scene.title === title);
    if (index < 0) { showToast('이 그림의 원래 장면을 찾지 못했습니다.', 'error'); return; }
    void handleReviewImage(title, scenes[index].prompt, index, scenes, plan, candidate, repair);
  };
  const workboardContent = <><ImageChecks targetId={targetId} busy={locked} onCheck={checkImageCandidate} onApply={handleApplyImage}/><WorkboardContent
    activeTab={view === 'prompts' ? 'prompts' : 'scenario'}
    selectedCharacter={selectedCharacter}
    result={result}
    isGenerating={isGenerating}
    error={error}
    currentScenes={currentScenes}
    sceneImages={sceneImages}
    generatingImages={generatingImages}
    handleSaveDraft={handleSaveDraft}
    handleExportPlan={handleExportPlan}
    handleGenerateImage={handleGenerateImage}
    handleCompareImages={handleCompareImages}
    onReferenceScene={useInAnotherEpisode}
  /></>;

  return (
    <div className="ori-app flex flex-col h-[100dvh] w-full bg-[#f5f2ed] font-sans text-[#552c24] overflow-hidden md:border-8 md:border-[#552c24]">
      {toast && (
        <div role="status" aria-live="polite" className={`ori-toast fixed bottom-4 right-4 z-50 px-4 py-3 shadow-[4px_4px_0px_#552c24] border-2 border-[#552c24] font-bold text-xs uppercase flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-[#fca5a5] text-red-900' : 'bg-[#ffcd4a] text-[#552c24]'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
          {toast.message}
        </div>
      )}
      <div inert={locked||undefined}><Header 
        view={view} 
        setView={next=>{setView(next);if(next==='5s-plan')setManualPlanOpen(true);}}
        setViewingHistoryId={setViewingHistoryId} 
      /></div>

      <main className="ori-app-main flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        <VideoEditor visible={view === 'editor'} open={() => setView('editor')} onIndex={setDrafts} onBusy={setEditorBusy} resumeId={resumeId} onResumeHandled={resumeHandled} onActive={editorActive}/>
        {(view === '15s-plan' || view === '5s-plan') && (
          <div className="ori-start-screen flex-1 min-h-0 w-full bg-[#f9f7f4] flex flex-col items-center p-4 md:p-6 overflow-y-auto">
            <div className="ori-page-heading"><p>오리쇼츠 스튜디오</p><h2>새 영상 만들기</h2><span>제작안을 고르고, 한 편씩 완성하세요.</span></div>
            <RecentWork history={history} drafts={drafts} media={mediaSummaries} recent={recent} onHistory={item=>{selectHistory(item.id);setView('history');}} onEditor={resumeEditor}/>
            <WeeklyScript disabled={locked} onPrepared={(entry,revision)=>{
              if(locked)return;
              const item=handleLoadPrepared(entry,revision);
              setSelectedCharacter(item.characterId);setSceneImages({});setPendingReference(null);setSource(null);setCustomPrompt('');setView('prompts');
              showToast('완성 제작안을 불러왔습니다. 장면 1부터 이미지를 만드세요.');
            }} onChoose={(episode,character)=>{if(source&&source.title!==episode.title)setPendingReference(null);setSource(episode);setManualPlanOpen(true);setCustomPrompt(episodePrompt(episode));setSelectedCharacter(character);setView(episode.duration===5?'5s-plan':'15s-plan');}}/>
            <details className="ori-manual-plan" open={manualPlanOpen} onToggle={e=>setManualPlanOpen(e.currentTarget.open)}>
              <summary><span>직접 기획하기</span><small>아이디어로 새 기획 만들기</small></summary>
              <div className="ori-duration-switch" role="group" aria-label="직접 기획할 영상 길이">
                <button type="button" aria-pressed={view === '15s-plan'} onClick={()=>setView('15s-plan')}>15초 · 4개 클립</button>
                <button type="button" aria-pressed={view === '5s-plan'} onClick={()=>setView('5s-plan')}>5초 · 짧은 영상</button>
              </div>
              <SceneReferenceSettings history={history} value={pendingReference} disabled={locked} onChange={setPendingReference}/>
              <WorkboardSidebar
                selectedCharacter={selectedCharacter}
                setSelectedCharacter={setSelectedCharacter}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                handleGenerate={() => handleGenerate(view === '5s-plan' ? '5s' : '15s')}
                isGenerating={isGenerating}
              />
            </details>
          </div>
        )}

        {view === 'history' && (
          <HistorySidebar
            history={history}
            viewingHistoryId={viewingHistoryId}
            setViewingHistoryId={selectHistory}
            handleDeleteHistory={handleDeleteHistory}
            handleClearHistory={handleClearHistory}
            onImport={importWork} busy={locked}
            progress={Object.fromEntries(history.map(item=>[item.id,recordProgress(item,mediaSummaries[item.id],drafts.find(d=>d.id===recordDraftId(item)))]))}
            onContinue={item=>{const draft=drafts.find(d=>d.id===recordDraftId(item));if(draft)resumeEditor(draft.id);else selectHistory(item.id);}}
          />
        )}

        {(view === 'scenario' || view === 'prompts') && (
          <section data-workspace-scroll className="ori-workspace-scroll flex-1 min-w-0 p-4 md:p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto bg-[#ffffff]">
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
              {view === 'prompts' && !isGenerating && result ? (
                <WorkspaceTabs reelsCaption={reelsCaption} key={currentWorkboardId} label="시각화 작업" defaultTab="clips" tabs={[
                  { id: 'clips', label: '클립·이미지', content: workboardContent },
                  { id: 'reference', label: '다른 화 참고', content: referenceSettings() },
                  { id: 'props', label: '장면별 소품', content: clipReferenceSettings() },
                  { id: 'background', label: '배경 에셋', content: backgroundSettings(result) },
                ]}/>
              ) : <>
                {!isGenerating && result && referenceSettings()}
                {workboardContent}
              </>}
            </div>
          </section>
        )}

        {view === 'history' && (
          <section data-workspace-scroll className={`ori-workspace-scroll ori-history-content ${!viewingHistoryId?'ori-history-content-empty':''} flex-1 min-w-0 p-4 md:p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto bg-[#ffffff]`}>
            <button disabled={locked} className="ori-history-back" onClick={()=>setViewingHistoryId(null)}>← 다른 기록 고르기</button>
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
              <ImageChecks targetId={targetId} busy={locked} onCheck={checkImageCandidate} onApply={handleApplyImage}/>
              <HistoryContent key={viewingHistoryId}
                onRebuildPrompts={()=>void rebuildHistoryPrompts()} busy={locked}
                referenceSettings={referenceSettings()}
                clipReferenceSettings={clipReferenceSettings()}
                backgroundSettings={viewingHistoryId && backgroundSettings(history.find(h=>h.id===viewingHistoryId)?.result || '')}
                draft={drafts.find(d=>d.id===recordDraftId(history.find(h=>h.id===viewingHistoryId)||{id:''} as HistoryItem))}
                mediaReady={mediaReady}
                onEdit={()=>{const item=history.find(h=>h.id===viewingHistoryId);if(item)openRecordEditor(item);}} onBusy={setWorkflowBusy}
                viewingHistoryId={viewingHistoryId}
                history={history}
                viewingScenes={viewingScenes}
                sceneImages={sceneImages}
                generatingImages={generatingImages}
                handleGenerateImage={handleGenerateImage}
    handleCompareImages={handleCompareImages}
                onReferenceScene={useInAnotherEpisode}
              />
            </div>
          </section>
        )}
      </main>

      <MobileNavigation view={view} setView={setView} disabled={locked} />

      <footer className="hidden lg:flex h-8 bg-[#ffcd4a] border-t border-[#552c24] px-4 items-center justify-between text-xs font-bold shrink-0">
        <div>© {new Date().getFullYear()} VIRAL POV STUDIO • BRAND ASSETS LOADED</div>
      </footer>
    </div>
  );
}
