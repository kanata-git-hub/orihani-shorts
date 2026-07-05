import fs from 'fs';

// Patch useHistory.ts
let useHistoryCode = fs.readFileSync('src/hooks/useHistory.ts', 'utf8');
useHistoryCode = useHistoryCode.replace(
  "  return { history, setHistory, viewingHistoryId, setViewingHistoryId, saveHistory, handleDeleteHistory };",
  `  const handleClearHistory = async () => {
    setHistory([]);
    localStorage.removeItem('pov_director_history');
    setViewingHistoryId(null);
    try {
      await db.clear(); // Clear all media
    } catch(err) {
      console.warn("DB clear error", err);
    }
  };

  return { history, setHistory, viewingHistoryId, setViewingHistoryId, saveHistory, handleDeleteHistory, handleClearHistory };`
);
fs.writeFileSync('src/hooks/useHistory.ts', useHistoryCode);

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "const { history, viewingHistoryId, setViewingHistoryId, saveHistory, handleDeleteHistory } = useHistory();",
  "const { history, viewingHistoryId, setViewingHistoryId, saveHistory, handleDeleteHistory, handleClearHistory } = useHistory();"
);
appCode = appCode.replace(
  "handleDeleteHistory={handleDeleteHistory}",
  "handleDeleteHistory={handleDeleteHistory}\n            handleClearHistory={handleClearHistory}"
);
fs.writeFileSync('src/App.tsx', appCode);

// Patch HistorySidebar.tsx
let sidebarCode = fs.readFileSync('src/components/HistorySidebar.tsx', 'utf8');
sidebarCode = sidebarCode.replace(
  "handleDeleteHistory: (id: string, e: React.MouseEvent) => void;",
  "handleDeleteHistory: (id: string, e: React.MouseEvent) => void;\n  handleClearHistory: () => void;"
);
sidebarCode = sidebarCode.replace(
  "export function HistorySidebar({ history, viewingHistoryId, setViewingHistoryId, handleDeleteHistory }: HistorySidebarProps) {",
  "export function HistorySidebar({ history, viewingHistoryId, setViewingHistoryId, handleDeleteHistory, handleClearHistory }: HistorySidebarProps) {"
);
sidebarCode = sidebarCode.replace(
  /<h2 className="text-xs font-bold uppercase tracking-widest text-\[#552c24\]\/50 mb-3">Generation History<\/h2>/g,
  `<div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#552c24]/50">Generation History</h2>
            {history.length > 0 && (
              <button 
                onClick={() => {
                  if(window.confirm('기록을 모두 삭제하시겠습니까?')) {
                    handleClearHistory();
                  }
                }}
                className="text-xs text-[#552c24]/50 hover:text-red-500 font-bold transition-colors uppercase"
              >
                Clear All
              </button>
            )}
          </div>`
);
fs.writeFileSync('src/components/HistorySidebar.tsx', sidebarCode);
