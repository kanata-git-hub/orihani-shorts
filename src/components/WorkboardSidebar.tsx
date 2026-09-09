import { Type, Sparkles, Loader2 } from 'lucide-react';
import { CHARACTERS } from '../constants';

interface WorkboardSidebarProps {
  selectedCharacter: string;
  setSelectedCharacter: (id: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
}

export function WorkboardSidebar({
  selectedCharacter,
  setSelectedCharacter,
  customPrompt,
  setCustomPrompt,
  handleGenerate,
  isGenerating
}: WorkboardSidebarProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Character Selection */}
        <div>
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setCustomPrompt("")} disabled={isGenerating || !customPrompt}
              className="text-xs text-[#552c24]/70 hover:text-[#552c24] disabled:opacity-40"
              aria-label="제작 방향 내용 지우기">내용 지우기</button>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#552c24]/50 mb-3 flex items-center gap-2">
            <Type size={14} /> 등장인물
          </h2>
          <div className="flex flex-wrap gap-2">
            {CHARACTERS.map(char => (
              <div
                key={char.id}
                onClick={() => setSelectedCharacter(char.id)}
                className={`w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${
                  selectedCharacter === char.id 
                    ? 'border-[#552c24] bg-[#ffcd4a]/20 shadow-[2px_2px_0px_#552c24]' 
                    : 'border-[#552c24]/20 hover:border-[#552c24]/50 opacity-70 hover:opacity-100 bg-white'
                }`}
                title={char.name}
              >
                <img src={char.img} alt={char.name} className="w-10 h-10 rounded object-cover shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Custom Twist */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#552c24]/50 mb-3 flex items-center gap-2">
            <Sparkles size={14} /> 제작 방향
          </h2>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="아이디어를 적어주세요. 비워두면 무작위로 생성됩니다."
            className="w-full p-2.5 rounded border border-[#552c24]/20 bg-[#f9f7f4] text-xs text-[#552c24] placeholder:text-[#552c24]/40 focus:outline-none focus:border-[#ffcd4a] focus:ring-1 focus:ring-[#ffcd4a] min-h-[80px] resize-y"
          />
        </div>
      </div>

      <div className="p-4 md:p-6 pt-0 mt-auto shrink-0 bg-white">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-[#552c24] hover:bg-[#552c24]/90 text-[#ffcd4a] font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase text-xs tracking-wider shadow-[4px_4px_0px_#ffcd4a] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#ffcd4a] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#ffcd4a]" />
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>영상 기획 생성</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
