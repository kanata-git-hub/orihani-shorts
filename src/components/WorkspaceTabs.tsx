import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import './workspace-tabs.css';

interface WorkspaceTab {
  id: string;
  label: string;
  content: ReactNode;
}

export function WorkspaceTabs({ label, tabs, defaultTab, reelsCaption }: {
  label: string;
  tabs: WorkspaceTab[];
  defaultTab: string;
  reelsCaption?: string;
}) {
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState(defaultTab);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle');
  useEffect(() => { setCopyState('idle'); }, [reelsCaption]);
  useEffect(() => {
    if (copyState !== 'done') return;
    const timer = setTimeout(() => setCopyState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [copyState]);
  const copyCaption = async () => {
    if (!reelsCaption?.trim() || copyState === 'copying') return;
    setCopyState('copying');
    try { await navigator.clipboard.writeText(reelsCaption); setCopyState('done'); }
    catch { setCopyState('error'); }
  };
  const active = tabs.some(tab => tab.id === selected) ? selected : tabs[0]?.id;

  const select = (id: string) => {
    if (id === active) return;
    setSelected(id);
    root.current?.closest('[data-workspace-scroll]')?.scrollTo({ top: 0 });
  };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % tabs.length; break;
      case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    select(tabs[next].id);
    buttons.current[next]?.focus({ preventScroll: true });
  };

  return <div ref={root} className="ori-workspace-tabs">
    <div className="ori-workspace-menu">
    <div className={`ori-workspace-tablist ${tabs.length > 4 ? 'ori-workspace-tablist-five' : ''}`} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => <button
        key={tab.id}
        ref={element => { buttons.current[index] = element; }}
        type="button"
        role="tab"
        id={`${prefix}-tab-${tab.id}`}
        aria-controls={`${prefix}-panel-${tab.id}`}
        aria-selected={active === tab.id}
        tabIndex={active === tab.id ? 0 : -1}
        onClick={() => select(tab.id)}
        onKeyDown={event => navigate(event, index)}
      >{tab.label}</button>)}
    </div>
    {reelsCaption !== undefined && <button
      type="button"
      className="ori-workspace-copy"
      disabled={!reelsCaption.trim() || copyState === 'copying'}
      data-copy-state={copyState}
      onClick={copyCaption}
    >
      {copyState === 'copying' ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : copyState === 'done' ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
      <span aria-live="polite">{copyState === 'done' ? '릴스 본문 복사 완료' : copyState === 'error' ? '복사 실패 · 다시 시도' : '릴스 본문 복사'}</span>
    </button>}
    </div>
    {tabs.map(tab => <div
      key={tab.id}
      id={`${prefix}-panel-${tab.id}`}
      className="ori-workspace-panel"
      role="tabpanel"
      aria-labelledby={`${prefix}-tab-${tab.id}`}
      tabIndex={0}
      hidden={active !== tab.id}
      inert={active !== tab.id || undefined}
    >{tab.content}</div>)}
  </div>;
}
