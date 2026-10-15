import { getKling4Plan } from '../kling4';
import { Kling4Workspace } from '../workflow/Kling4Workspace';
import { ImageImport } from './ImageImport';
import { PromptLength } from './PromptLength';
import { ImagePreview } from './ImagePreview';
import { HistoryContinue } from '../workflow/HistoryContinue';
import type { DraftSummary } from '../editor/draft';
import ReactMarkdown from 'react-markdown';
import { Clapperboard, Copy, CheckCircle2, Download, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { WorkspaceTabs } from './WorkspaceTabs';
import { HistoryItem } from '../types';
import { extractOverview, extractClips } from '../utils/extractors';
import { useToast } from '../hooks/useToast';
import { videoPromptForCopy, clipVideoText } from '../videoPrompt';
import { IMAGE_GENERATION_NOTICE } from '../imageQuality';
import { prepareReelsCaption } from '../utils/socialCaption';
import { isAuthoredPlan } from '../workflow/productionPackage';

interface HistoryContentProps {
  onApplyImage:(title:string,image:string)=>Promise<boolean>;
  onUpdatePlan:(result:string)=>void;
  onKling4Copy:()=>void;
  viewingHistoryId: string | null;
  history: HistoryItem[];
  viewingScenes: any[];
  sceneImages: Record<string, string>;
  generatingImages: Record<string, boolean>;

  handleGenerateImage: (sceneTitle: string, promptText: string, sceneIdx: number, allScenes: any[], fullPlanText?: string) => Promise<boolean>;
  handleCompareImages?: (title:string, prompt:string, index:number, scenes:any[], plan?:string) => Promise<boolean>;
  onEdit:()=>void;
  onBusy:(v:boolean)=>void;
  draft?:DraftSummary;
  mediaReady:boolean;
  onReferenceScene?:(title:string)=>void;
  referenceSettings?: ReactNode;
  clipReferenceSettings?: ReactNode;
  backgroundSettings?: ReactNode;
  onRebuildPrompts?: () => void;
  busy?: boolean;
}

export function HistoryContent({
  viewingHistoryId,
  history,
  viewingScenes,
  sceneImages,
  generatingImages,
  handleGenerateImage, handleCompareImages, onEdit, onBusy, draft, mediaReady, onReferenceScene,
  referenceSettings, clipReferenceSettings, backgroundSettings, onRebuildPrompts, busy, onApplyImage, onUpdatePlan, onKling4Copy
}: HistoryContentProps) {
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const [copiedAllPrompts, setCopiedAllPrompts] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [clipCopy, setClipCopy] = useState<{index:number; status:'done'|'error'} | null>(null);
  const { showToast } = useToast();

  if (!viewingHistoryId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 mt-32">
        <Clapperboard size={48} className="mb-4 text-[#552c24]/20" />
        <p className="font-bold uppercase tracking-widest text-sm text-[#552c24]">기록을 선택하세요</p>
        <p className="text-xs mt-2 text-[#552c24]">사이드바에서 이전에 생성된 기획을 선택하여 확인하세요.</p>
      </div>
    );
  }

  const viewingItem = history.find(h => h.id === viewingHistoryId);
  const result = viewingItem?.result || '';

  const kling4 = getKling4Plan(result);
  const modernWorkspace = kling4 && <Kling4Workspace key={viewingItem!.id} result={result} images={sceneImages} busy={busy} ready={mediaReady} onApply={onApplyImage} onGenerate={handleGenerateImage} onUpdate={onUpdatePlan} onEdit={onEdit}/>;
  const overview = extractOverview(result);
  const socialCaption = prepareReelsCaption(overview, viewingItem?.episode);
  const clips = extractClips(result).map(clip=>({...clip,videoPrompt:videoPromptForCopy(clip.videoPrompt)}));

  const handleCopyAllVideoPrompts = () => {
    const allPrompts = clips.map((c, idx) => clipVideoText(c.videoPrompt, idx, c.title)).join('\n\n');
    navigator.clipboard.writeText(allPrompts);
    setCopiedAllPrompts(true);
    showToast("비디오 프롬프트 전체 복사 완료!");
    setTimeout(() => setCopiedAllPrompts(false), 2000);
  };

  const handleCopyInstagram = () => {
    const text = socialCaption.text;
    navigator.clipboard.writeText(text);
    setCopiedInstagram(true);
    showToast("인스타그램 내용 복사 완료!");
    setTimeout(() => setCopiedInstagram(false), 2000);
  };

  return (
    <WorkspaceTabs reelsCaption={socialCaption.text} label="기록 작업" defaultTab="content" tabs={[
      { id: 'content', label: '기획', content: <div className="flex-1 flex flex-col gap-6 pb-8">
      {!kling4&&<div className="ori-workflow"><p>이 제작안은 이전 클립 방식입니다.</p><button disabled={busy||!mediaReady} onClick={onKling4Copy}>Kling 4.0 작업으로 복사</button><p>이미지와 대본을 보관하고 새 작업을 만듭니다.</p></div>}
      {isAuthoredPlan(result) && <p className="ori-authored-note">완성 제작안 · 프롬프트 그대로 사용</p>}
      {viewingItem?.episode && !kling4 && !isAuthoredPlan(result) && onRebuildPrompts && <div className="ori-workflow ori-scene-reference">
        <button type="button" className="ori-workflow-primary" disabled={busy} onClick={onRebuildPrompts}>대본대로 프롬프트 다시 만들기</button>
        <p className="ori-reference-note">최초 설계에 Pro 1회, 검수와 최대 1회 수정에는 Flash를 사용해 새 기록으로 만듭니다. 기존 사진과 영상은 보관됩니다. Gemini 텍스트 처리 비용이 발생하며 사진은 따로 생성합니다.</p>
      </div>}

      {/* Top: Scenario Overview */}
      {(
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[#552c24] font-bold text-lg md:text-xl tracking-tight">
              🎬 {overview.title || '제목 없는 기획'}
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

          {socialCaption.text && (
            <div className="mt-4 p-4 bg-[#ffcd4a]/10 border-2 border-[#552c24]/20 rounded-md">
              <h4 className="text-sm font-bold text-[#552c24] mb-2 flex items-center justify-between">
                📱 인스타그램 릴스 본문
                <button
                  onClick={handleCopyInstagram}
                  className="text-xs flex items-center gap-1 bg-[#552c24] text-white px-2 py-1 rounded hover:bg-[#552c24]/80 transition-colors"
                >
                  {copiedInstagram ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copiedInstagram ? "복사됨" : "복사하기"}
                </button>
              </h4>
              <div className="text-sm text-[#552c24] whitespace-pre-wrap mb-3">
                {socialCaption.body}
              </div>
              <div className="text-sm font-medium text-blue-600 flex flex-wrap gap-1">
                {socialCaption.hashtags.map((tag: string, i: number) => (
                  <span key={i}>#{tag}</span>
                ))}
              </div>
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

      {showRawPrompt && (
        <div className="mt-4 pt-4 border-t border-[#552c24]/10 prose prose-sm max-w-none prose-headings:text-[#552c24] prose-headings:font-bold prose-headings:uppercase prose-headings:text-sm prose-headings:tracking-wider prose-headings:border-b-2 prose-headings:border-[#ffcd4a] prose-headings:pb-1 prose-headings:mb-3 prose-strong:text-[#552c24] prose-p:leading-relaxed prose-li:leading-relaxed text-[#552c24]">
          <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto p-4 bg-gray-100 rounded">{result}</pre>
        </div>
      )}

    </div> },
      { id: 'images', label: '주요장면·이미지', content: modernWorkspace || <div className="flex-1 flex flex-col gap-6 pb-8">
      {/* Bottom: Clip-by-clip Card List */}
      {clips.length > 0 && (
         <div className="ori-clips-workspace flex flex-col gap-4">
           <div className="ori-clip-picker flex gap-2 overflow-x-auto pb-2 shrink-0" role="group" aria-label="작업할 클립">
             {clips.map((clip, idx) => (
               <button
                 key={idx}
                 aria-pressed={activeClipIndex === idx}
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
              <div className="ori-clip-card bg-[#ffffff] border-2 border-[#552c24] p-4 flex flex-col gap-3 relative shadow-[4px_4px_0px_#552c24] max-w-md w-full self-center">
                <div className="ori-clip-title font-bold text-sm uppercase text-[#552c24] border-b border-[#552c24]/10 pb-2">
                  <span>{clip.title}</span><PromptLength text={clipVideoText(clip.videoPrompt, idx, clip.title)} />
                </div>

                <button type="button" className="ori-clip-copy" disabled={!clip.videoPrompt} onClick={async()=>{
                  try { await navigator.clipboard.writeText(clipVideoText(clip.videoPrompt, idx, clip.title)); setClipCopy({index:idx,status:'done'}); }
                  catch { setClipCopy({index:idx,status:'error'}); }
                }}><Copy size={16} aria-hidden="true" /><span aria-live="polite">{clipCopy?.index === idx ? clipCopy.status === 'done' ? '이 클립 프롬프트 복사 완료' : '복사 실패 · 다시 시도' : '이 클립 영상 프롬프트 복사'}</span></button>
                <p className="text-xs text-[#79655d]">이미지 생성·자동 검수 시 비용이 발생합니다.</p>
                <ImageImport title={clip.imageTitle} disabled={busy||!mediaReady} hasImage={!!sceneImages[clip.imageTitle]} onApply={onApplyImage}/>
                    {/* Image Generation Area */}
                {!sceneImages[clip.imageTitle] ? (
                  <button
                    onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, viewingScenes, result)}
                    disabled={generatingImages[clip.imageTitle] || !clip.imagePrompt}
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
                    <ImagePreview src={sceneImages[clip.imageTitle]} alt={clip.imageTitle} />

                    <div className="flex justify-end gap-2">
                      <a href={sceneImages[clip.imageTitle]} download={`${clip.imageTitle}.png`} className="flex items-center gap-1 px-3 py-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a] text-xs font-bold uppercase transition-colors">
                        <Download size={14} /> 다운로드
                      </a>
                      <button onClick={() => handleGenerateImage(clip.imageTitle, clip.imagePrompt, idx, viewingScenes, result)} className="flex items-center gap-1 px-3 py-2 bg-white rounded shadow-sm border border-[#552c24]/20 text-[#552c24] hover:bg-[#ffcd4a] text-xs font-bold uppercase transition-colors">
                        <RefreshCw size={14} /> 재시도
                      </button>
                    </div>
                  </div>
                )}
                <details className="ori-clip-extra"><summary>추가 작업·생성 안내</summary>
                {onReferenceScene&&<button className="ori-reference-shortcut" disabled={!mediaReady||Object.values(generatingImages).some(Boolean)} onClick={()=>onReferenceScene(clip.imageTitle)}>다른 화에서 참고하기</button>}
                <details className="ori-prompt-comparison"><summary>이미지 생성·검수 안내</summary><p>{IMAGE_GENERATION_NOTICE}</p></details>
                {handleCompareImages && <details className="ori-prompt-comparison">
                  <summary>이미지 모델 비교</summary>
                  <p>동일한 프롬프트와 참고 사진으로 Flash Image와 Pro Image를 각각 한 번 생성하고 Flash로 검수합니다. 비교에서는 자동 수정하지 않습니다. 이미지 2회와 검수 2회 비용이 발생합니다. 기존 장면은 유지합니다.</p>
                  <button type="button" disabled={Object.values(generatingImages).some(Boolean) || !clip.imagePrompt} onClick={() => void handleCompareImages(clip.imageTitle, clip.imagePrompt, idx, viewingScenes, result)}>현재 장면 두 이미지 모델 비교</button>
                </details>}
                </details>
              </div>
              );
           })()}
               <details className="ori-copy-options"><summary>여러 클립 프롬프트 복사</summary>
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

           {clips.length > 0 && (
             <div className="w-full max-w-md self-center grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
               {clips.map((c, idx) => (
                 <button
                   key={idx}
                   onClick={() => {
                     navigator.clipboard.writeText(clipVideoText(c.videoPrompt, idx, c.title));
                     showToast(`클립 ${idx + 1} 프롬프트 복사 완료!`);
                   }}
                   disabled={!c.videoPrompt}
                   className="bg-[#f9f7f4] border-2 border-[#552c24] text-[#552c24] py-2 px-3 font-bold text-xs uppercase hover:bg-[#ffcd4a]/20 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                 >
                   <Copy size={12} /> CLIP {idx + 1}
                 </button>
               ))}
             </div>
           )}

               </details>
         </div>
      )}
    </div> },
      { id: 'kling', label: 'Kling 영상 대기', content: viewingItem&&<HistoryContinue onApplyImage={onApplyImage} klingWorkspace={modernWorkspace} key={viewingItem.id} item={viewingItem} images={sceneImages} generating={generatingImages} onGenerate={handleGenerateImage} onEdit={onEdit} onBusy={onBusy} draft={draft} mediaReady={mediaReady} onReferenceScene={onReferenceScene}/> },
      { id: 'reference', label: '다른 화 참고', content: referenceSettings },
      { id: 'props', label: '장면별 소품', content: clipReferenceSettings },
      { id: 'background', label: '배경 에셋', content: backgroundSettings },

    ]}/>
  );
}
