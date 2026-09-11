import { useState } from 'react';
import { SourceEpisode } from '../types';
import { HistoryItem } from '../types';
import { WeeklyScript } from '../workflow/WeeklyScript';
import { editorEpisode, readPackage, importIdentity, MAX_PACKAGE_BYTES } from '../workflow/package';
import { db } from '../utils/db';
import { VideoEditor } from '../editor/VideoEditor';
import { Sparkles, Clapperboard, AlertCircle } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { extractScenes } from '../utils/extractors';

import { Header } from '../components/Header';
import { WorkboardSidebar } from '../components/WorkboardSidebar';
import { HistorySidebar } from '../components/HistorySidebar';
import { WorkboardContent } from '../components/WorkboardContent';
import { HistoryContent } from '../components/HistoryContent';

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
  const { history, viewingHistoryId, setViewingHistoryId, saveHistory, handleDeleteHistory, handleClearHistory } = useHistory();
  
  const [source,setSource]=useState<SourceEpisode|null>(null);
  const [workflowBusy,setWorkflowBusy]=useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[2].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [view, setView] = useState<'15s-plan' | '5s-plan' | 'scenario' | 'prompts' | 'history' | 'editor'>('15s-plan');

  const {
    isGenerating,
    result,
    error,
    currentWorkboardId,
    handleGenerate: generatePlan
  } = useGeneration(showToast, saveHistory, apiKeys);
  
  const {
    generatingImages, setGeneratingImages,
    sceneImages, setSceneImages,
    saveMediaToDB,
    targetId
  } = useMedia(view === 'history' ? 'history' : 'workboard', currentWorkboardId, viewingHistoryId);

  const {
    handleGenerateImage
  } = useMediaGeneration(
    showToast, saveMediaToDB, targetId,
    setGeneratingImages, sceneImages, setSceneImages,
    apiKeys, view==='history'?(history.find(h=>h.id===viewingHistoryId)?.characterId||selectedCharacter):selectedCharacter
  );

  const handleGenerate = (duration: '15s' | '5s' = '15s') => {
    setSceneImages({});
    setView('scenario');
    generatePlan(selectedCharacter, customPrompt, duration, source&&source.duration===(duration==='5s'?5:15)&&source.scenario===customPrompt?source:undefined);
  };

  const locked=workflowBusy||Object.values(generatingImages).some(Boolean);
  const openRecordEditor=(item:HistoryItem)=>{try{if(document.documentElement.dataset.oriEditorReady!=='1')throw Error('편집 화면을 준비 중입니다. 잠시 후 다시 눌러주세요.');window.dispatchEvent(new CustomEvent('orihani-editor-import',{detail:{version:1,key:item.editorKey||'history-'+item.id,episode:editorEpisode(item)}}));}catch(e){showToast((e as Error).message,'error');}};
  const importWork=async(file:File)=>{try{if(file.size>MAX_PACKAGE_BYTES)throw Error('작업 파일은 48MB 이하로 넣어주세요.');const pack=readPackage(await file.text());const item=importIdentity(pack.item,history);await db.set(item.id,{images:pack.images});saveHistory(item);setViewingHistoryId(item.id);showToast('기획·사진·대본을 가져왔습니다.');}catch(e){showToast((e as Error).message,'error');}};
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

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#f5f2ed] font-sans text-[#552c24] overflow-hidden md:border-8 md:border-[#552c24]">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 shadow-[4px_4px_0px_#552c24] border-2 border-[#552c24] font-bold text-xs uppercase flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-[#fca5a5] text-red-900' : 'bg-[#ffcd4a] text-[#552c24]'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
          {toast.message}
        </div>
      )}
      <div inert={locked||undefined}><Header 
        view={view} 
        setView={setView} 
        setViewingHistoryId={setViewingHistoryId} 
      /></div>

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <VideoEditor visible={view === 'editor'} open={() => setView('editor')} />
        {(view === '15s-plan' || view === '5s-plan') && (
          <div className="flex-1 w-full bg-[#f9f7f4] flex flex-col items-center p-4 md:p-6 overflow-y-auto">
            <WeeklyScript onChoose={(episode,character)=>{setSource(episode);setCustomPrompt(episode.scenario);setSelectedCharacter(character);setView(episode.duration===5?'5s-plan':'15s-plan');}}/>
            <div className="w-full max-w-2xl bg-white shadow-[8px_8px_0px_#552c24] border-2 border-[#552c24] flex flex-col shrink-0 my-auto">
              <WorkboardSidebar 
                selectedCharacter={selectedCharacter}
                setSelectedCharacter={setSelectedCharacter}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                handleGenerate={() => handleGenerate(view === '5s-plan' ? '5s' : '15s')}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        )}

        {view === 'history' && (
          <HistorySidebar
            history={history}
            viewingHistoryId={viewingHistoryId}
            setViewingHistoryId={setViewingHistoryId}
            handleDeleteHistory={handleDeleteHistory}
            handleClearHistory={handleClearHistory}
            onImport={importWork} busy={locked}
          />
        )}

        {(view === 'scenario' || view === 'prompts') && (
          <section className="flex-1 p-4 md:p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto bg-[#ffffff]">
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 h-full">
              <WorkboardContent 
                activeTab={view}
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
              />
            </div>
          </section>
        )}

        {view === 'history' && (
          <section className={`ori-history-content ${!viewingHistoryId?'ori-history-content-empty':''} flex-1 p-4 md:p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto bg-[#ffffff]`}>
            <button disabled={locked} className="ori-history-back" onClick={()=>setViewingHistoryId(null)}>← 다른 기록 고르기</button>
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
              <HistoryContent key={viewingHistoryId} 
                onEdit={()=>{const item=history.find(h=>h.id===viewingHistoryId);if(item)openRecordEditor(item);}} onBusy={setWorkflowBusy}
                viewingHistoryId={viewingHistoryId}
                history={history}
                viewingScenes={viewingScenes}
                sceneImages={sceneImages}
                generatingImages={generatingImages}
                handleGenerateImage={handleGenerateImage}
              />
            </div>
          </section>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav inert={locked||undefined} className="md:hidden flex shrink-0 bg-[#552c24] shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-10 pb-safe">
        <button 
          onClick={() => setView('15s-plan')}
          className={`flex-1 py-3 text-xs font-bold uppercase text-center transition-colors ${view === '15s-plan' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}
        >
          15초 기획
        </button>
        <button 
          onClick={() => setView('5s-plan')}
          className={`flex-1 py-3 text-xs font-bold uppercase text-center transition-colors border-l border-[#ffcd4a]/10 ${view === '5s-plan' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}
        >
          5초 숏츠
        </button>
        <button 
          onClick={() => setView('scenario')}
          className={`flex-1 py-3 text-xs font-bold uppercase text-center transition-colors border-l border-[#ffcd4a]/10 ${view === 'scenario' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}
        >
          기획
        </button>
        <button 
          onClick={() => setView('prompts')}
          className={`flex-1 py-3 text-xs font-bold uppercase text-center transition-colors border-l border-[#ffcd4a]/10 ${view === 'prompts' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}
        >
          시각화
        </button>
        <button 
          onClick={() => { setView('history'); }}
          className={`flex-1 py-3 text-xs font-bold uppercase text-center transition-colors border-l border-[#ffcd4a]/10 ${view === 'history' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}
        >
          기록
        </button>
        <button onClick={() => setView('editor')} className={`flex-1 py-3 text-xs font-bold ${view === 'editor' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}>영상 편집</button>
      </nav>

      <footer className="hidden md:flex h-8 bg-[#ffcd4a] border-t border-[#552c24] px-4 items-center justify-between text-xs font-bold shrink-0">
        <div>© {new Date().getFullYear()} VIRAL POV STUDIO • BRAND ASSETS LOADED</div>
      </footer>
    </div>
  );
}
