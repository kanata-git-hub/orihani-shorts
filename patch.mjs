import fs from 'fs';
let code = fs.readFileSync('src/components/HistoryContent.tsx', 'utf8');
code = code.replace(
  "  const clips = extractClips(result);",
  `  const clips = extractClips(result);

  const renderTabs = () => (
    <div className="flex border-b-2 border-[#552c24] mb-2 mt-4">
      <button 
        onClick={() => setActiveTab('scenario')}
        className={\`flex-1 py-3 text-sm font-bold uppercase transition-colors \${activeTab === 'scenario' ? 'bg-[#552c24] text-[#ffcd4a]' : 'bg-[#f9f7f4] text-[#552c24] opacity-70 hover:opacity-100'}\`}
      >
        기획 내용
      </button>
      <button 
        onClick={() => setActiveTab('prompts')}
        className={\`flex-1 py-3 text-sm font-bold uppercase transition-colors border-l-2 border-[#552c24] \${activeTab === 'prompts' ? 'bg-[#552c24] text-[#ffcd4a]' : 'bg-[#f9f7f4] text-[#552c24] opacity-70 hover:opacity-100'}\`}
      >
        프롬프트 / 시각화
      </button>
    </div>
  );
`
);
fs.writeFileSync('src/components/HistoryContent.tsx', code);
