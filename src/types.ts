import type { BackgroundChoices } from './backgroundAssets';

export interface Character {
  id: string;
  name: string;
  file: string;
  img: string;
  imgs: string[];
  desc: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  characterId: string;
  result: string;
  duration?: 5 | 12 | 15 | 30;
  customPrompt?: string;
  episode?: SourceEpisode;
  editorKey?: string;
  backgroundChoices?: BackgroundChoices;
}

export interface SourceEpisode {
  captionStyle?: 'clinic' | 'legacy' | 'screen' | 'korean';
  koreanTitlePreset?: 'balanced' | 'wide';
  headline?: [string, string];
  captions?: { start: number; end: number; text: string; source?: 'screen' }[];
  aspectRatio?: '9:16' | '16:9';
  originalVolume?: number;
  clinicBrandStart?: number;
  videoLayout?: 'single' | 'legacy-clips';
  duration: 5 | 12 | 15 | 30;
  title: string;
  scenario: string;
  korean: string;
  thumbnail: string;
  caption: string;
}

export interface MemeCaption {
  text: string;
  startTime: number;
  endTime: number;
}
