import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, Clapperboard, Copy, CheckCircle2, Download, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { extractOverview, extractClips } from '../utils/extractors';
import { useToast } from '../hooks/useToast';

interface WorkboardContentProps {
  activeTab: 'scenario' | 'prompts';
  selectedCharacter: string;
  result: string;
  isGenerating: boolean;
  error: string | null;
  currentScenes: any[];
  sceneImages: Record<string, string>;
  generatingImages: Record<string, boolean>;
  handleSaveDraft: () => void;
  handleExportPlan: () => void;
  handleGenerateImage: (sceneTitle: string, promptText: string, sceneIdx: number, allScenes: any[], fullPlanText?: string) => void;
}

export function WorkboardContent({
  activeTab,
  selectedCharacter,
  result,
  isGenerating,
  error,
  currentScenes,
  sceneImages,
  generatingImages,
  handleSaveDraft,
  handleExportPlan,
  handleGenerateImage
}: WorkboardContentProps) {
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const [copiedAllPrompts, setCopiedAllPrompts] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const { showToast } = useToast();

  const overview = extractOverview(result);
  const clips = extractClips(result);


  const handleCopyAllVideoPrompts = () => {
    const allPrompts = clips.map((c, idx) => `[CLIP ${idx + 1}: ${c.title}]\n${c.videoPrompt}`).join('\n\n');
    navigator.clipboard.writeText(allPrompts);
    setCopiedAllPrompts(true);
    showToast("비디오 프롬프트 전체 복사 완료!");
    setTimeout(() => setCopiedAllPrompts(false), 2000);
  };

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 font-bold text-sm shrink-0 flex gap-2 shadow-[2px_2px_0px_#fca5a5]">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!result && !isGenerating && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
          <Clapperboard size={48} className="mb-4" />
          <p className="font-bold uppercase tracking-widest text-sm">기획이 없습니다</p>
          <p className="text-xs mt-2">사이드바에서 설정을 완료하고 새로운 숏폼 기획을 생성하세요.</p>
        </div>
      )}

      {(result || isGenerating) && (
        <div className="flex-1 flex flex-col gap-6 pb-8">
          

          {activeTab === 'scenario' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-[#552c24] font-bold text-lg md:text-xl tracking-tight">
                  🎬 {overview.title || (isGenerating ? '기획 중...' : '제목 없는 기획')}
                </h3>
                {overview.location && (
                  <p className="text-sm text-[#552c24]/70 font-medium mt-1">📍 {overview.location}</p>
                )}
              </div>
              
              {overview.scenario && (
                <div className="text-sm leading-relaxed text-[#552c24] whitespace-pre-wrap">
                  {overview.scenario}
                </div>
              )}

              {result && (
                <button 
                  onClick={() => setShowRawPrompt(!showRawPrompt)}
                  className="text-xs uppercase font-bold text-[#552c24]/60 hover:text-[#552c24] underline underline-offset-2 flex items-center gap-1 self-start mt-2"
                >
                  {showRawPrompt ? "전체 결과 숨기기" : "전체 결과 보기"}
                </button>
              )}
            </div>
          )}

          {activeTab === 'scenario' && showRawPrompt && (
              <div className="mt-4 pt-4 border-t border-[#552c24]/10 prose prose-sm max-w-none prose-headings:text-[#552c24] prose-headings:font-bold prose-headings:uppercase prose-headings:text-sm prose-headings:tracking-wider prose-headings:border-b-2 prose-headings:border-[#ffcd4a] prose-headings:pb-1 prose-headings:mb-3 prose-strong:text-[#552c24] prose-p:leading-relaxed prose-li:leading-relaxed text-[#552c24]">
                <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto p-4 bg-gray-100 rounded">{result}</pre>
                {isGenerating && (
                  <span className="inline-block w-2 h-3 ml-1 bg-[#ffcd4a] animate-pulse" />
                )}
              </div>
            )}
            {!showRawPrompt && isGenerating && (
              <div className="mt-4 text-xs font-bold text-[#552c24] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> 기획 생성 중...
              </div>
            )}

          {/* Bottom: Clip-by-clip Card List */}
          {activeTab === 'prompts' && clips.length > 0 && (
             <div className="flex flex-col gap-4">
               <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
                 {clips.map((clip, idx) => (
                   <button
                     key={idx}
                     onClick={() => setActiveClipIndex(idx)}
                     className={`px-4 py-2 font-bold text-xs uppercase border-2 transition-colors shrink-0 ${activeClipIndex === idx ? 'bg-[#552c24] border-[#552c24] text-[#ffcd4a] shadow-[2px_2px_0px_#ffcd4a]' : 'bg-[#f9f7f4] border-[#552c24] text-[#552c24] opacity-70 hover:opacity-100'}`}
                   >
                     CLIP {idx + 1}
                   </button>
                 ))}
               </div>
               
               <button
                 onClick={handleCopyAllVideoPrompts}
                 disabled={clips.some(c => !c.videoPrompt)}
                 className="w-full max-w-md self-center bg-[#552c24] hover:bg-[#552c24]/90 text-[#ffcd4a] py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_#ffcd4a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[2px_2px_0px_#ffcd4a] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#552c24] rounded-sm"
               >
                 {copiedAllPrompts ? (
                   <><CheckCircle2 size={16} className="text-green-400" /> 전체 복사 완료!</>
                 ) : (
                   <><Copy size={16} /> 비디오 프롬프트 전체 복사</>
                 )}
               </button>

               {clips[activeClipIndex] && (() => {
                  const clip = clips[activeClipIndex];
                  const idx = activeClipIndex;
                  return (
                  <div className="bg-[#ffffff] border-2 border-[#552c24] p-4 flex flex-col gap-3 relative shadow-[4px_4px_0px_#552c24] max-w-md w-full self-center">
                    <div className="font-bold text-sm uppercase text-[#552c24] border-b border-[#552c24]/10 pb-2">
                      {clip.title}
                    </div>

                    {/* Image Generation Area */}
                    {!sceneImages[clip.imageTitle] ? (
                      <button 
                        onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, currentScenes, result)}
                        disabled={generatingImages[clip.imageTitle] || isGenerating || !clip.imagePrompt}
                        className="w-full bg-[#f9f7f4] border-2 border-dashed border-[#552c24]/20 text-[#552c24] hover:border-[#552c24] hover:bg-[#ffcd4a]/20 transition-all py-8 flex flex-col items-center justify-center gap-2 text-xs font-bold uppercase disabled:opacity-50 min-h-[160px] rounded"
                      >
                        {generatingImages[clip.imageTitle] ? (
                          <><Loader2 size={24} className="animate-spin" /> 이미지 생성 중...</>
                        ) : (
                          <><ImageIcon size={24} className="opacity-50" /> 시작 이미지 생성</>
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <img src={sceneImages[clip.imageTitle]} alt={clip.imageTitle} className="w-full object-cover rounded aspect-[9/16] bg-gray-100 border-2 border-[#552c24]" referrerPolicy="no-referrer" />
                        <div className="flex justify-end gap-2">
                          <a href={sceneImages[clip.imageTitle]} download={`${clip.imageTitle}.png`} className="flex items-center gap-1 px-3 py-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a] text-xs font-bold uppercase transition-colors">
                            <Download size={14} /> 다운로드
                          </a>
                          <button onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, currentScenes, result)} className="flex items-center gap-1 px-3 py-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a] text-xs font-bold uppercase transition-colors">
                            <RefreshCw size={14} /> 재시도
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
               })()}
             </div>
          )}
        </div>
      )}
    </>
  );
}
