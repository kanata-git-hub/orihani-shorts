import { MemeCaption } from '../types';

export const extractOverview = (text: string) => {
  try {
    const data = JSON.parse(text);
    return {
      title: data.title || '',
      location: data.location || '',
      scenario: data.scenario || ''
    };
  } catch (e) {
    // Fallback for old history items
    const overviewMatch = text.match(/(?:###\s*)?0\.\s*Planning\s*&\s*Narrative\s*\(Korean\)[\s\S]*?(?=(?:###\s*)?1\.|$)/i);
    let section0 = overviewMatch ? overviewMatch[0] : text;
    const getMatch = (regex: RegExp) => {
      const m = section0.match(regex);
      return m ? m[1].trim() : '';
    };
    const title = getMatch(/(?:\*\*)?영상 제목:?(?:\*\*)?\s*([^\n]+)/);
    const location = getMatch(/(?:\*\*)?공간적 배경\s*(?:\(Location\))?:?(?:\*\*)?\s*([^\n]+)/);
    const scenarioMatch = section0.match(/(?:\*\*)?시나리오:?(?:\*\*)?\s*([\s\S]*?)(?=(?:\n\s*[-*]\s*(?:\*\*)?자막)|(?:###)|$)/);
    const scenario = scenarioMatch ? scenarioMatch[1].trim() : '';
    return { title, location, scenario };
  }
};

export const extractClips = (text: string) => {
  try {
    const data = JSON.parse(text);
    if (data.clips && Array.isArray(data.clips)) {
      return data.clips.map((c: any, i: number) => ({
        title: c.title || `CLIP ${i+1}`,
        imageTitle: c.imageTitle || `Scene ${i+1}`,
        imagePrompt: c.imagePrompt || '',
        videoTitle: c.videoTitle || `CLIP ${i+1}`,
        videoPrompt: c.videoPrompt || ''
      }));
    }
  } catch (e) {
    // Fallback for old history items
    const clips: { title: string, imageTitle: string, imagePrompt: string, videoTitle: string, videoPrompt: string }[] = [];
    const section1Regex = /(?:###\s*)?(?:\*\*)?(?:1\.\s*)?(?:Image Generation(?: Prompts)?|이미지 프롬프트)[\s\S]*?(?=(?:###\s*)?(?:\*\*)?(?:2\.\s*)?(?:Video Generation(?: Prompts)?|비디오 프롬프트|🎥|영상 프롬프트|CLIP|$))/i;
    const section1Match = text.match(section1Regex);
    const section1 = section1Match ? section1Match[0] : '';
    const imageRegex = /(?:^|\n)\s*(?:[-*]\s+|\d+\.\s+)?(?:\*\*)?((?:Scene|Cut|Image|씬)\s*\d+[^:*\n]*)(?:\*\*)?[:*]*\s*\n?([\s\S]*?)(?=(?:^|\n)\s*(?:[-*]\s+|\d+\.\s+)?(?:\*\*)?(?:Scene|Cut|Image|씬)\s*\d+|$)/gi;
    const imagePrompts: {title: string, prompt: string}[] = [];
    let m;
    while ((m = imageRegex.exec(section1)) !== null) {
      let title = m[1].trim();
      let prompt = m[2].trim().replace(/^[-*:\s]+/, '');
      imagePrompts.push({ title, prompt });
    }
    const section2Regex = /(?:(?:###\s*)?2\.\s+Video\s+Generation|🎥?\s*영상\s*프롬프트\s*마스터\s*세트|비디오\s*프롬프트)[\s\S]*?(?=\n(?:###\s*)?3|$)/i;
    const section2Match = text.match(section2Regex);
    const section2 = section2Match ? section2Match[0] : '';
    const videoRegex = /(?:^|\n)\s*(?:🎬)?\s*((?:CLIP|클립)\s*\d+[^:*\n]*)(?:\*\*)?[:*]*\s*\n?([\s\S]*?)(?=(?:^|\n)\s*(?:🎬)?\s*(?:CLIP|클립)\s*\d+|$)/gi;
    const videoPrompts: {title: string, prompt: string}[] = [];
    let vM;
    while ((vM = videoRegex.exec(section2)) !== null) {
      let title = vM[1].trim();
      let prompt = vM[2].trim().replace(/^[-*:\s]+/, '');
      videoPrompts.push({ title, prompt });
    }
    const count = Math.max(imagePrompts.length, videoPrompts.length);
    for (let i = 0; i < count; i++) {
      const vTitle = videoPrompts[i]?.title || `CLIP ${i+1}`;
      const shortTitle = vTitle.replace(/\[([^\]]+)\]\s*(.*)/, '$1 $2');
      clips.push({
        title: shortTitle || `CLIP ${i+1}`,
        imageTitle: imagePrompts[i]?.title || `Scene ${i+1}`,
        imagePrompt: imagePrompts[i]?.prompt || '',
        videoTitle: vTitle,
        videoPrompt: videoPrompts[i]?.prompt || ''
      });
    }
    return clips;
  }
  return [];
};

export const extractScenes = (text: string) => {
  return extractClips(text).map(c => ({ title: c.imageTitle, prompt: c.imagePrompt }));
};

export const extractVideoPrompt = (text: string) => {
  const sectionRegex = /(?:(?:###\s*)?2\.\s+Video\s+Generation|🎥?\s*영상\s*프롬프트\s*마스터\s*세트|비디오\s*프롬프트)[\s\S]*?(?=\n(?:###\s*)?3|$)/i;
  const match = sectionRegex.exec(text);
  
  if (match) {
    return match[0].replace(/(?:(?:###\s*)?2\.\s+Video\s+Generation|🎥?\s*영상\s*프롬프트\s*마스터\s*세트|비디오\s*프롬프트)[^\n]*\n/, '').trim();
  }
  return "";
};

export const extractCaptions = (text: string): MemeCaption[] => {
  const sectionRegex = /(?:###\s*)?3\./i;
  const matchSection = text.match(sectionRegex);
  if (!matchSection || matchSection.index === undefined) return [];
  
  const subsection = text.slice(matchSection.index);
  const match = subsection.match(/\[\s*\{[\s\S]*\}\s*\]/);
  
  if (match) {
    try {
      const cleanJson = match[0].replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(cleanJson);
    } catch(e) {
      console.error("Failed to parse captions JSON:", e);
      return [];
    }
  }
  return [];
};
