import { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { db } from '../utils/db';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pov_director_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch(e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history];
    setHistory(newHistory);
    localStorage.setItem('pov_director_history', JSON.stringify(newHistory));
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('pov_director_history', JSON.stringify(newHistory));
    if (viewingHistoryId === id) {
      setViewingHistoryId(null);
    }
    try {
      await db.delete(id); // Clean up media
    } catch(err) {
      console.warn("DB delete error", err);
    }
  };

  const handleClearHistory = async () => {
    setHistory([]);
    localStorage.removeItem('pov_director_history');
    setViewingHistoryId(null);
    try {
      await db.clear(); // Clear all media
    } catch(err) {
      console.warn("DB clear error", err);
    }
  };

  return { history, setHistory, viewingHistoryId, setViewingHistoryId, saveHistory, handleDeleteHistory, handleClearHistory };
}
