import { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { readSceneReference, type SceneReference } from '../sceneReference';

export function useMedia(view: 'workboard' | 'history', currentWorkboardId: string | null, viewingHistoryId: string | null) {
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [loadedId,setLoadedId]=useState<string|null>(null);
  const [sceneReference,setSceneReference]=useState<SceneReference|null>(null);

  const targetId = view === 'workboard' ? currentWorkboardId : viewingHistoryId;
  const targetRef=useRef(targetId);targetRef.current=targetId;

  useEffect(() => {
    let active=true;setSceneImages({});setSceneReference(null);setLoadedId(null);
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
          setSceneReference(data.sceneReference || null);
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
      await db.setImages(idToSave, currentImages);
    } catch(err) {
      console.warn("DB save error", err);throw err;
    }
  };

  const saveSceneReference=async(reference:SceneReference|null)=>{
    if(!targetId)throw Error('참고 장면을 연결할 기획을 먼저 선택해주세요.');
    const checked=readSceneReference(reference);
    await db.setSceneReference(targetId,checked);
    if(targetRef.current===targetId)setSceneReference(checked);
  };

  return {
    generatingImages, setGeneratingImages,
    sceneImages:loadedId===targetId?sceneImages:{}, setSceneImages,
    saveMediaToDB,
    targetId,
    sceneReference:loadedId===targetId?sceneReference:null, saveSceneReference,
    mediaReady: !!targetId && loadedId === targetId
  };
}
