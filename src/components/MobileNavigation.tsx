import { Clapperboard, FileText, History, Images, Plus } from 'lucide-react';

type View = '15s-plan' | '5s-plan' | 'scenario' | 'prompts' | 'history' | 'editor';

export function MobileNavigation({ view, setView, disabled }: {
  view: View;
  setView: (view: View) => void;
  disabled: boolean;
}) {
  const items = [
    { view: '15s-plan' as const, label: '만들기', icon: Plus, active: view.endsWith('-plan') },
    { view: 'scenario' as const, label: '기획', icon: FileText, active: view === 'scenario' },
    { view: 'prompts' as const, label: '이미지', icon: Images, active: view === 'prompts' },
    { view: 'history' as const, label: '기록', icon: History, active: view === 'history' },
    { view: 'editor' as const, label: '편집', icon: Clapperboard, active: view === 'editor' },
  ];
  return <nav className="ori-mobile-nav lg:hidden" aria-label="주요 메뉴">
    {items.map(item => <button key={item.view} type="button" disabled={disabled}
      aria-current={item.active ? 'page' : undefined}
      onClick={() => setView(item.view === '15s-plan' && view === '5s-plan' ? '5s-plan' : item.view)}>
      <item.icon size={22} strokeWidth={item.active ? 2.4 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </button>)}
  </nav>;
}
