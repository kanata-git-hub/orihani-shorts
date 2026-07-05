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
  const [copiedClipIndex, setCopiedClipIndex] = useState<number | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const { showToast } = useToast();

  const overview = extractOverview(result);
  const clips = extractClips(result);


  const handleCopyVideoPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedClipIndex(index);
    showToast("Video prompt copied!");
    setTimeout(() => setCopiedClipIndex(null), 2000);
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
          <p className="font-bold uppercase tracking-widest text-sm">Workboard Empty</p>
          <p className="text-xs mt-2">Configure parameters in the sidebar to generate a new short-form plan.</p>
        </div>
      )}

      {(result || isGenerating) && (
        <div className="flex-1 flex flex-col gap-6 pb-8">
          

          {activeTab === 'scenario' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-[#552c24] font-bold text-lg md:text-xl tracking-tight">
                  🎬 {overview.title || (isGenerating ? 'Directing...' : 'Untitled Plan')}
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
                  {showRawPrompt ? "Hide Raw Output" : "View Raw Output"}
                </button>
              )}
            </div>
          )}

          {activeTab === 'scenario' && showRawPrompt && (
              <div className="mt-4 pt-4 border-t border-[#552c24]/10 prose prose-sm max-w-none prose-headings:text-[#552c24] prose-headings:font-bold prose-headings:uppercase prose-headings:text-sm prose-headings:tracking-wider prose-headings:border-b-2 prose-headings:border-[#ffcd4a] prose-headings:pb-1 prose-headings:mb-3 prose-strong:text-[#552c24] prose-p:leading-relaxed prose-li:leading-relaxed text-[#552c24]">
                {result.trim().startsWith('{') ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(JSON.parse(result), null, 2)}</pre>
                ) : (
                  <ReactMarkdown>{result}</ReactMarkdown>
                )}
                {isGenerating && (
                  <span className="inline-block w-2 h-3 ml-1 bg-[#ffcd4a] animate-pulse" />
                )}
              </div>
            )}
            {!showRawPrompt && isGenerating && (
              <div className="mt-4 text-xs font-bold text-[#552c24] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Generating Plan...
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
                          <><Loader2 size={24} className="animate-spin" /> Generating Image...</>
                        ) : (
                          <><ImageIcon size={24} className="opacity-50" /> Generate Start Frame</>
                        )}
                      </button>
                    ) : (
                      <div className="relative group">
                        <img src={sceneImages[clip.imageTitle]} alt={clip.imageTitle} className="w-full object-cover rounded aspect-[9/16] bg-gray-100 border-2 border-[#552c24]" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={sceneImages[clip.imageTitle]} download={`${clip.imageTitle}.png`} className="p-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a]">
                            <Download size={14} />
                          </a>
                          <button onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, currentScenes, result)} className="p-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a]">
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Video Prompt Area */}
                    <button
                       onClick={() => handleCopyVideoPrompt(clip.videoPrompt, idx)}
                       disabled={!clip.videoPrompt}
                       className="mt-auto w-full bg-[#552c24] hover:bg-[#552c24]/90 text-[#ffcd4a] py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0px_#ffcd4a] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copiedClipIndex === idx ? (
                        <><CheckCircle2 size={14} className="text-green-400" /> Copied!</>
                      ) : (
                        <><Copy size={14} /> Copy Video Prompt</>
                      )}
                    </button>
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
