import { useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import type { HistoryItem } from '../types';
import { readProductionPackage, type ProductionPackage } from './productionPackage';
import { needsVideoPromptRefresh } from './promptRevision';

export function usePromptRefresh(history: HistoryItem[], disabled: boolean, apply: (pack: ProductionPackage) => void) {
  const attempted = useRef(new Set<string>());
  const applyRef = useRef(apply); applyRef.current = apply;
  const pending = history.filter(needsVideoPromptRefresh);
  const key = JSON.stringify(pending.map(item => [item.id, item.result]));
  useEffect(() => {
    const user = auth.currentUser;
    if (disabled || !pending.length || !user || attempted.current.has(key)) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    void (async () => {
      try {
        const response = await fetch('/api/editor/weekly?refresh=1', { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, signal: controller.signal });
        if (!response.ok) throw Error('최신 영상 프롬프트를 확인하지 못했습니다.');
        const data = await response.json();
        if (typeof data.text !== 'string') throw Error('제작안 응답이 올바르지 않습니다.');
        const pack = readProductionPackage(data.text);
        if (active) { applyRef.current(pack); attempted.current.add(key); }
      } catch {
        // Keep the original record and its visible length warning; retry on next app load.
        if (active) attempted.current.add(key);
      } finally { clearTimeout(timer); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [key, disabled]);
}
