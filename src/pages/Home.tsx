import { useState } from 'react';
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
  
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[2].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [view, setView] = useState<'15s-plan' | '5s-plan' | 'scenario' | 'prompts' | 'history'>('15s-plan');

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
    apiKeys, selectedCharacter
  );

  const handleGenerate = (duration: '15s' | '5s' = '15s') => {
    setSceneImages({});
    setView('scenario');
    generatePlan(selectedCharacter, customPrompt, duration);
  };

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
    <div className="flex flex-col h-screen w-full bg-[#f5f2ed] font-sans text-[#552c24] overflow-hidden md:border-8 md:border-[#552c24]">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 shadow-[4px_4px_0px_#552c24] border-2 border-[#552c24] font-bold text-xs uppercase flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-[#fca5a5] text-red-900' : 'bg-[#ffcd4a] text-[#552c24]'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
          {toast.message}
        </div>
      )}
      <Header 
        view={view} 
        setView={setView} 
        setViewingHistoryId={setViewingHistoryId} 
      />

      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {(view === '15s-plan' || view === '5s-plan') && (
          <div className="flex-1 w-full bg-[#f9f7f4] flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
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
          <section className="flex-1 p-4 md:p-6 lg:p-10 flex flex-col gap-6 overflow-y-auto bg-[#ffffff]">
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 h-full">
              <HistoryContent 
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
      <nav className="md:hidden flex shrink-0 bg-[#552c24] shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-10 pb-safe">
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
          onClick={() => { setView('history'); setViewingHistoryId(null); }}
          className={`flex-1 py-3 text-xs font-bold uppercase text-center transition-colors border-l border-[#ffcd4a]/10 ${view === 'history' ? 'bg-[#ffcd4a] text-[#552c24]' : 'text-[#ffcd4a] opacity-60'}`}
        >
          기록
        </button>
      </nav>

      <footer className="hidden md:flex h-8 bg-[#ffcd4a] border-t border-[#552c24] px-4 items-center justify-between text-xs font-bold shrink-0">
        <div>© {new Date().getFullYear()} VIRAL POV STUDIO • BRAND ASSETS LOADED</div>
      </footer>
    </div>
  );
}
