import { SourceEpisode } from '../types';
export function parseWeekly(text:string): (SourceEpisode&{characters:string[]})[] {
 if(!text||text.length>300000)throw Error('300KB 이하 주간 대본을 넣어주세요.');
 const clean=text.replace(/\\([\\`*_{}\[\]()#+.!~>-])/g,'$1').replace(/\*\*/g,'');
 const heads=[...clean.matchAll(/^.*\[에피소드\s*(\d+)\s*:\s*(5|15)초[^\]]*\].*$/gm)];
 if(!heads.length)throw Error('주간 대본에서 [에피소드 번호: 5초/15초] 제목을 찾지 못했습니다.');
 return heads.map((m,i)=>{const body=clean.slice(m.index!+m[0].length,heads[i+1]?.index??clean.length);const sections:Record<number,string>={};
 const section=(label:string)=>/시나리오/.test(label)?1:/영어.*자막/.test(label)?3:/썸네일/.test(label)?5:/제목|해시태그/.test(label)?4:/(?:한글|한국어).*(?:나레이션|내레이션|자막)/.test(label)?2:0;
 const marks=[...body.matchAll(/^\s*(?:#{1,6}\s*)?([1-5])\.\s*([^\n]+)$/gm)].filter(s=>section(s[2]));
 marks.forEach((s,j)=>sections[section(s[2])]=body.slice(s.index!+s[0].length,marks[j+1]?.index??body.length).trim());
 if([1,2,4,5].some(n=>!sections[n]))throw Error(`에피소드 ${m[1]}에 시나리오·한글 대본·제목·썸네일 중 빠진 항목이 있습니다.`);
 const characters=[['오원장','owonjang'],['소미','nurse'],['덕이','deoki']].filter(([name])=>sections[1].includes(name)).map(([,id])=>id);
 return {duration:Number(m[2]) as 5|15,title:m[0].replace(/^#+\s*/,''),scenario:sections[1],korean:sections[2],caption:sections[4],thumbnail:sections[5],characters};});
}
