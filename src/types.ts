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
  duration?: 5 | 15;
  customPrompt?: string;
  episode?: SourceEpisode;
  editorKey?: string;
}

export interface SourceEpisode {
  duration: 5 | 15;
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
