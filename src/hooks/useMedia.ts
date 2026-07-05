import { useState, useEffect } from 'react';
import { db } from '../utils/db';

export function useMedia(view: 'workboard' | 'history', currentWorkboardId: string | null, viewingHistoryId: string | null) {
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});

  const targetId = view === 'workboard' ? currentWorkboardId : viewingHistoryId;

  useEffect(() => {
    const loadMedia = async () => {
      if (!targetId) {
        setSceneImages({});
        return;
      }
      try {
        const data = await db.get(targetId);
        if (data) {
          setSceneImages(data.images || {});
        } else {
          setSceneImages({});
        }
      } catch (e) {
        console.warn("DB load error", e);
      }
    };
    loadMedia();
  }, [targetId]);

  const saveMediaToDB = async (idToSave: string, currentImages: Record<string, string>) => {
    try {
      const existing = await db.get(idToSave) || { images: {} };
      const dataToSave: any = {
        images: { ...existing.images, ...currentImages },
      };
      await db.set(idToSave, dataToSave);
    } catch(err) {
      console.warn("DB save error", err);
    }
  };

  return {
    generatingImages, setGeneratingImages,
    sceneImages, setSceneImages,
    saveMediaToDB,
    targetId
  };
}
