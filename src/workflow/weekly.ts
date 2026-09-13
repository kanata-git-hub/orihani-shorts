import { SourceEpisode } from '../types';

function episodeDuration(heading:string,scenario:string):5|15 {
 const stated=heading.match(/(?:^|[^\d])(\d+)\s*초/);
 if(stated){const n=Number(stated[1]);if(n===5||n===15)return n;throw Error('에피소드 길이는 5초 또는 15초여야 합니다.');}
 // Serial scripts omit duration in the episode heading. Use all numbered scenes,
 // never the number of episodes or a blanket 15-second default.
 const scenes=[...scenario.matchAll(/\[장면\s*(\d+)\s*\(([^)\n]+)\)\s*\]/g)];
 const lengths=scenes.map((s,i)=>{
  if(Number(s[1])!==i+1)return NaN;
  const single=s[2].match(/^\s*(\d+(?:\.\d+)?)\s*초\s*$/);
  const range=s[2].match(/^\s*(\d+(?:\.\d+)?)\s*초?\s*[~～–—-]\s*(\d+(?:\.\d+)?)\s*초\s*$/);
  return single?Number(single[1]):range?Number(range[2])-Number(range[1]):NaN;
 });
 const total=lengths.reduce((sum,n)=>sum+n,0);
 if(lengths.every(n=>n>0)&&(total===5||total===15))return total;
 throw Error('에피소드의 영상 길이를 확인하지 못했습니다. 제목에 5초/15초를 적거나 각 장면의 시간을 확인해주세요.');
}

// The visual scenario alone no longer contains the character dialogue in serial
// scripts. Keep the selected source's spoken lines with the planning input.
export function episodePrompt(episode:SourceEpisode):string {
 return `${episode.title}\n\n${episode.scenario}\n\n[한글 원본 대본 — 장면별 화자·대사·무대사 구분을 유지]\n${episode.korean}\n\n등장인물 대사는 해당 장면의 Kling 원본 음성으로 유지하고, 화면 자막과 무대사 문구는 읽지 마세요. 해설은 명시된 경우에만 사용하세요.`;
}

export function parseWeekly(text:string): (SourceEpisode&{characters:string[]})[] {
 if(!text||text.length>300000)throw Error('300KB 이하 주간 대본을 넣어주세요.');
 const clean=text.replace(/\r\n?/g,'\n').replace(/\\([\\`*_{}\[\]()#+.!~>-])/g,'$1').replace(/\*\*/g,'');
 const heads=[...clean.matchAll(/^.*\[에피소드\s*(\d+)(?:\s*:\s*[^\]\n]+)?\s*\].*$/gm)];
 if(!heads.length)throw Error('주간 대본에서 [에피소드 번호] 제목을 찾지 못했습니다.');
 return heads.map((m,i)=>{const body=clean.slice(m.index!+m[0].length,heads[i+1]?.index??clean.length);const sections:Record<number,string>={};
 const section=(label:string)=>/시나리오/.test(label)?1:/영어.*자막/.test(label)?3:/썸네일/.test(label)?5:/제목|해시태그/.test(label)?4:/(?:한글|한국어).*(?:나레이션|내레이션|자막)/.test(label)?2:0;
 const marks=[...body.matchAll(/^\s*(?:#{1,6}\s*)?([1-5])\.\s*([^\n]+)$/gm)].filter(s=>section(s[2]));
 marks.forEach((s,j)=>sections[section(s[2])]=body.slice(s.index!+s[0].length,marks[j+1]?.index??body.length).trim());
 if([1,2,4,5].some(n=>!sections[n]))throw Error(`에피소드 ${m[1]}에 시나리오·한글 대본·제목·썸네일 중 빠진 항목이 있습니다.`);
 const characters=[['오원장','owonjang'],['소미','nurse'],['덕이','deoki']].filter(([name])=>sections[1].includes(name)).map(([,id])=>id);
 return {duration:episodeDuration(m[0],sections[1]),title:m[0].replace(/^#+\s*/,''),scenario:sections[1],korean:sections[2],caption:sections[4],thumbnail:sections[5],characters};});
}
