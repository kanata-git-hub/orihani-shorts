import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  viewingHistoryId: string | null;
  setViewingHistoryId: (id: string | null) => void;
  handleDeleteHistory: (id: string, e: React.MouseEvent) => void;
  handleClearHistory: () => void;
  onImport:(file:File)=>void;
  busy?:boolean;
  progress:Record<string,{label:string;action:string}>;
  onContinue:(item:HistoryItem)=>void;
}

export function HistorySidebar({ history, viewingHistoryId, setViewingHistoryId, handleDeleteHistory, handleClearHistory, onImport, busy, progress, onContinue }: HistorySidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <aside inert={busy||undefined} className={` ${viewingHistoryId?'ori-history-list-selected':''} w-full md:w-72 bg-[#ffffff] border-b md:border-b-0 md:border-r border-[#552c24]/10 p-4 md:p-5 flex flex-col shrink-0 overflow-y-auto max-h-full md:max-h-none`}>
      <p className="text-sm mb-4">같은 기기·같은 브라우저에 저장된 기록입니다.</p>
      <div className="mb-6 space-y-6 flex-1">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#552c24]/50">기록</h2>
          </div>
          {history.length === 0 ? (
            <p className="text-xs opacity-60">기록이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {history.map(item => {
                let displayTitle = '기획 내용';
                try {
                  const data = JSON.parse(item.result);
                  if (data.title) displayTitle = data.title;
                } catch(e) {
                  const titleMatch = item.result.match(/\*\*(.*?제목.*?)\*\*\s*(.*)/);
                  if (titleMatch) displayTitle = titleMatch[2].replace(/[\[\]*]/g, '').trim();
                }
                return (
                  <div 
                    key={item.id} 
                    role="button" tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();setViewingHistoryId(item.id);}}} onClick={() => setViewingHistoryId(item.id)}
                    className={`group p-3 border rounded text-xs cursor-pointer transition-colors relative ${viewingHistoryId === item.id ? 'bg-[#ffcd4a]/10 border-[#ffcd4a]/40' : 'border-[#552c24]/10 hover:bg-gray-50 opacity-70 hover:opacity-100'}`}
                  >
                    <div className="font-bold truncate pr-6">{displayTitle}</div>
                    <div className="text-xs opacity-60 mt-1">{new Date(item.timestamp).toLocaleString()}</div>
                    <p className="ori-record-state">{progress[item.id]?.label||'진행 상태 확인 필요'}</p>
                    <button className="ori-record-action" onClick={e=>{e.stopPropagation();onContinue(item);}}>{progress[item.id]?.action||'작업 확인하기'}</button>
                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="absolute right-2 top-2 p-3 text-[#552c24]/40 hover:text-red-500 opacity-70 md:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="기획 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <details className="ori-workflow"><summary>작업 파일 가져오기 / 기록 관리</summary><label>작업 파일 가져오기<input aria-label="작업 파일 가져오기" type="file" accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)onImport(f);}}/></label><p>기획·사진·대본만 가져옵니다. 편집 중인 영상·음성은 포함되지 않습니다.</p><p>전체 삭제는 기획·사진만 지웁니다. 편집 영상은 편집 목록에 남습니다.</p>
            {history.length > 0 && (
              showConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-red-500 font-bold">정말 삭제할까요?</span>
                  <button onClick={() => { handleClearHistory(); setShowConfirm(false); }} className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase hover:bg-red-600">네</button>
                  <button onClick={() => setShowConfirm(false)} className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-gray-300">아니오</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="text-xs text-[#552c24]/50 hover:text-red-500 font-bold transition-colors uppercase"
                >
                  전체 삭제
                </button>
              )
            )}
      </details>
    </aside>
  );
}
