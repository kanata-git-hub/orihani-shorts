import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  viewingHistoryId: string | null;
  setViewingHistoryId: (id: string | null) => void;
  handleDeleteHistory: (id: string, e: React.MouseEvent) => void;
  handleClearHistory: () => void;
}

export function HistorySidebar({ history, viewingHistoryId, setViewingHistoryId, handleDeleteHistory, handleClearHistory }: HistorySidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <aside className="w-full md:w-72 bg-[#ffffff] border-b md:border-b-0 md:border-r border-[#552c24]/10 p-4 md:p-5 flex flex-col shrink-0 overflow-y-auto max-h-[30vh] md:max-h-none">
      <div className="mb-6 space-y-6 flex-1">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#552c24]/50">Generation History</h2>
            {history.length > 0 && (
              showConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-red-500 font-bold">정말 삭제할까요?</span>
                  <button onClick={() => { handleClearHistory(); setShowConfirm(false); }} className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase hover:bg-red-600">Yes</button>
                  <button onClick={() => setShowConfirm(false)} className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-gray-300">No</button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="text-xs text-[#552c24]/50 hover:text-red-500 font-bold transition-colors uppercase"
                >
                  Clear All
                </button>
              )
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs opacity-60">No history yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map(item => {
                const titleMatch = item.result.match(/\*\*(.*?제목.*?)\*\*\s*(.*)/);
                const displayTitle = titleMatch ? titleMatch[2].replace(/[\[\]*]/g, '').trim() : 'Video Plan';
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setViewingHistoryId(item.id)}
                    className={`group p-3 border rounded text-xs cursor-pointer transition-colors relative ${viewingHistoryId === item.id ? 'bg-[#ffcd4a]/10 border-[#ffcd4a]/40' : 'border-[#552c24]/10 hover:bg-gray-50 opacity-70 hover:opacity-100'}`}
                  >
                    <div className="font-bold truncate pr-6">{displayTitle}</div>
                    <div className="text-xs opacity-60 mt-1">{new Date(item.timestamp).toLocaleString()}</div>
                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="absolute right-2 top-2 p-1 text-[#552c24]/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Plan"
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
    </aside>
  );
}
