import { Settings, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  view: '15s-plan' | '5s-plan' | 'scenario' | 'prompts' | 'history' | 'editor';
  setView: (view: '15s-plan' | '5s-plan' | 'scenario' | 'prompts' | 'history' | 'editor') => void;
  setViewingHistoryId: (id: string | null) => void;
}

export function Header({ view, setView, setViewingHistoryId }: HeaderProps) {
  const { isAdmin, logout } = useAuth();
  
  return (
    <header className="h-14 md:h-16 bg-white text-[#552c24] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-10 border-b-2 border-[#552c24]">
      <div className="flex items-center gap-2 md:gap-3">
        <img src="/icon.png" alt="App Icon" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0 bg-white" />
        <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase truncate mt-0.5">
          오리쇼츠 <span className="hidden md:inline text-[10px] md:text-xs font-bold opacity-70 ml-1.5">v4.2 PRO</span>
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-base font-bold">
          <button 
            onClick={() => setView('15s-plan')}
            className={`${view === '15s-plan' ? 'border-b-2 border-[#552c24] pb-1 cursor-default opacity-100' : 'opacity-60 hover:opacity-100 cursor-pointer'} uppercase`}
          >
            15초 기획
          </button>
          <button 
            onClick={() => setView('5s-plan')}
            className={`${view === '5s-plan' ? 'border-b-2 border-[#552c24] pb-1 cursor-default opacity-100' : 'opacity-60 hover:opacity-100 cursor-pointer'} uppercase`}
          >
            5초 숏츠
          </button>
          <button 
            onClick={() => setView('scenario')}
            className={`${view === 'scenario' ? 'border-b-2 border-[#552c24] pb-1 cursor-default opacity-100' : 'opacity-60 hover:opacity-100 cursor-pointer'} uppercase`}
          >
            기획
          </button>
          <button 
            onClick={() => setView('prompts')}
            className={`${view === 'prompts' ? 'border-b-2 border-[#552c24] pb-1 cursor-default opacity-100' : 'opacity-60 hover:opacity-100 cursor-pointer'} uppercase`}
          >
            시각화
          </button>
          <button 
            onClick={() => { setView('history'); }}
            className={`${view === 'history' ? 'border-b-2 border-[#552c24] pb-1 cursor-default opacity-100' : 'opacity-60 hover:opacity-100 cursor-pointer'} uppercase`}
          >
            기록
          </button>
          <button onClick={() => setView('editor')} className={view === 'editor' ? 'border-b-2 border-[#552c24] pb-1' : 'opacity-60 hover:opacity-100'}>영상 편집</button>
          {isAdmin && (
            <a href="/admin" className="flex items-center gap-1 opacity-60 hover:opacity-100 cursor-pointer text-[#ffcd4a] uppercase bg-[#552c24] px-2 py-1 rounded-md text-xs">
              <Shield size={14} /> 관리자
            </a>
          )}
          <button onClick={logout} className="opacity-60 hover:opacity-100 cursor-pointer text-xs underline">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
