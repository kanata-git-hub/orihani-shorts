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
}

export interface MemeCaption {
  text: string;
  startTime: number;
  endTime: number;
}
