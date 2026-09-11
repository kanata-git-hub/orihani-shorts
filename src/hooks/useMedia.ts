import { useState, useEffect } from 'react';
import { db } from '../utils/db';

export function useMedia(view: 'workboard' | 'history', currentWorkboardId: string | null, viewingHistoryId: string | null) {
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [loadedId,setLoadedId]=useState<string|null>(null);

  const targetId = view === 'workboard' ? currentWorkboardId : viewingHistoryId;

  useEffect(() => {
    let active=true;setSceneImages({});setLoadedId(null);
    const loadMedia = async () => {
      if (!targetId) {
        setSceneImages({});
        return;
      }
      try {
        const data = await db.get(targetId);
        if(!active)return;
        setLoadedId(targetId);
        if (data) {
          setSceneImages(data.images || {});
        } else {
          setSceneImages({});
        }
      } catch (e) {
        console.warn("DB load error", e);
      }
    };
    loadMedia();return ()=>{active=false;};
  }, [targetId]);

  const saveMediaToDB = async (idToSave: string, currentImages: Record<string, string>) => {
    try {
      const existing = await db.get(idToSave) || { images: {} };
      const dataToSave: any = {
        images: { ...existing.images, ...currentImages },
      };
      await db.set(idToSave, dataToSave);
    } catch(err) {
      console.warn("DB save error", err);throw err;
    }
  };

  return {
    generatingImages, setGeneratingImages,
    sceneImages:loadedId===targetId?sceneImages:{}, setSceneImages,
    saveMediaToDB,
    targetId,
    mediaReady: !!targetId && loadedId === targetId
  };
}
