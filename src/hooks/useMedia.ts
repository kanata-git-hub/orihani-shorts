import { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { readSceneReference, readClipReferences, type ClipReferences, type SceneReference } from '../sceneReference';

export function useMedia(view: 'workboard' | 'history', currentWorkboardId: string | null, viewingHistoryId: string | null) {
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [loadedId,setLoadedId]=useState<string|null>(null);
  const [sceneReference,setSceneReference]=useState<SceneReference|null>(null);
  const [clipReferences,setClipReferences]=useState<ClipReferences>({});

  const targetId = view === 'workboard' ? currentWorkboardId : viewingHistoryId;
  const targetRef=useRef(targetId);targetRef.current=targetId;

  useEffect(() => {
    let active=true;setSceneImages({});setSceneReference(null);setClipReferences({});setLoadedId(null);
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
          setClipReferences(readClipReferences(data.clipReferences));
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

  const saveClipReference=async(title:string,reference:SceneReference|null)=>{
    if(!targetId)throw Error('소품을 참고할 기획을 먼저 선택해주세요.');
    const checked=reference?readClipReferences({[title]:reference})[title]:null;
    await db.setClipReference(targetId,title,checked);
    if(targetRef.current===targetId)setClipReferences(previous=>{
      const next={...previous};if(checked)next[title]=checked;else delete next[title];return next;
    });
  };

  return {
    generatingImages, setGeneratingImages,
    sceneImages:loadedId===targetId?sceneImages:{}, setSceneImages,
    saveMediaToDB,
    targetId,
    sceneReference:loadedId===targetId?sceneReference:null, saveSceneReference,
    clipReferences:loadedId===targetId?clipReferences:{}, saveClipReference,
    mediaReady: !!targetId && loadedId === targetId
  };
}
