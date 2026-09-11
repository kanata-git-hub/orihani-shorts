import { parseWeekly } from '../../src/workflow/weekly';

export const WEEKLY_FOLDER = '1O2wOWOLyAXmq96aXOExX0fecwK7jZbq-';
type DriveFile = {id:string;name:string;mimeType:string;modifiedTime?:string};
export type LatestWeekly = {id:string;name:string;date:string;url:string;text:string;checkedAt:string;episodeCount:number};
const docsType='application/vnd.google-apps.document';
const stem=/^\[(\d{4}-\d{2}-\d{2})\]\s*3D 오리 삼총사 릴스 개그 시리즈 주간 패키지(?:\.md|\.txt)?$/;
function packageDate(name:string){
 const value=stem.exec(name)?.[1];if(!value)return null;
 const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?value:null;
}
export function newestWeekly(files:DriveFile[]){
 const candidates=files.filter(f=>typeof f?.name==='string'&&typeof f.id==='string'&&/^[\w-]{20,}$/.test(f.id)&&packageDate(f.name)&&
  (f.mimeType===docsType||(/\.(md|txt)$/i.test(f.name)&&['text/plain','text/markdown','text/x-markdown','application/octet-stream'].includes(f.mimeType))));
 candidates.sort((a,b)=>packageDate(b.name)!.localeCompare(packageDate(a.name)!)||(b.modifiedTime||'').localeCompare(a.modifiedTime||'')||a.id.localeCompare(b.id));
 if(!candidates.length)throw Error('지정된 폴더에서 날짜가 적힌 주간 대본을 찾지 못했습니다.');
 return candidates[0];
}
async function readText(response:Response,limit:number){
 if(Number(response.headers.get('content-length'))>limit)throw Error('주간 대본 파일이 너무 큽니다.');
 const reader=response.body?.getReader();if(!reader)throw Error('Drive에서 빈 응답을 받았습니다.');
 const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw Error('주간 대본 파일이 너무 큽니다.');chunks.push(value);}}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 return Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/,'');
}
function driveError(status:number){
 if(status===401||status===403)return Error('Drive 연결 권한을 확인하지 못했습니다. 서버의 Drive API 설정과 주간 폴더 공유 권한을 확인해주세요.');
 if(status===404)return Error('주간 대본 폴더 또는 문서를 찾지 못했습니다.');
 if(status===429)return Error('Drive가 잠시 요청을 제한했습니다. 잠시 후 다시 확인해주세요.');
 return Error(`Drive에서 대본을 읽지 못했습니다(${status}). 잠시 후 다시 확인해주세요.`);
}
// Only this configured public folder is read. Never accept arbitrary client file IDs or URLs.
export function createWeeklyReader(options:{key:()=>string|undefined;fetch?:typeof fetch;now?:()=>number}){
 const request=options.fetch||fetch,now=options.now||Date.now;
 let cached:LatestWeekly|undefined,pending:Promise<LatestWeekly>|undefined;
 const load=async()=>{
  const key=options.key();if(!key)throw Error('서버의 Drive 연결 키 설정이 필요합니다.');
  const signal=AbortSignal.timeout(25000),headers={'x-goog-api-key':key};
  const files:DriveFile[]=[];let pageToken:string|undefined;
  for(let page=0;page<10;page++){
   const url=new URL('https://www.googleapis.com/drive/v3/files');
   url.search=new URLSearchParams({q:`'${WEEKLY_FOLDER}' in parents and trashed = false`,pageSize:'1000',fields:'nextPageToken,incompleteSearch,files(id,name,mimeType,modifiedTime)',...(pageToken?{pageToken}:{})}).toString();
   const response=await request(url,{headers,signal,redirect:'error'});if(!response.ok)throw driveError(response.status);
   const result=JSON.parse(await readText(response,2500000));
   if(!Array.isArray(result.files)||result.incompleteSearch)throw Error('Drive 문서 목록이 완전하지 않습니다. 잠시 후 다시 확인해주세요.');
   files.push(...result.files);pageToken=result.nextPageToken;if(!pageToken)break;
   if(typeof pageToken!=='string'||page===9)throw Error('주간 폴더에 문서가 너무 많아 최신 파일을 확인하지 못했습니다.');
  }
  const file=newestWeekly(files);
  const url=new URL(`https://www.googleapis.com/drive/v3/files/${file.id}${file.mimeType===docsType?'/export':''}`);
  url.search=new URLSearchParams(file.mimeType===docsType?{mimeType:'text/plain'}:{alt:'media'}).toString();
  let response=await request(url,{headers,signal,redirect:'error'});
  if(file.mimeType===docsType&&[401,403].includes(response.status)){
   // Public Google Docs also exposes the same text export used by the desktop extension.
   // No API key or user cookies are forwarded across its redirects.
   let publicUrl=new URL(`https://docs.google.com/document/d/${file.id}/export?format=txt`);
   for(let hop=0;hop<5;hop++){
    response=await request(publicUrl,{signal,redirect:'manual',credentials:'omit'});
    if(![301,302,303,307,308].includes(response.status))break;
    const location=response.headers.get('location');if(!location)throw Error('문서 다운로드 주소를 확인하지 못했습니다.');
    const next=new URL(location,publicUrl);
    if(next.protocol!=='https:'||next.username||next.password||next.port||!(next.hostname==='docs.google.com'||next.hostname.endsWith('.googleusercontent.com')))throw Error('지원하지 않는 문서 다운로드 주소입니다.');
    publicUrl=next;
   }
  }
  if(!response.ok)throw driveError(response.status);
  const text=await readText(response,1000000);
  if(text.length>300000||/^\s*<!doctype html|^\s*<html/i.test(text))throw Error('주간 대본을 텍스트로 읽지 못했습니다. 문서 공유 권한을 확인해주세요.');
  const episodes=parseWeekly(text);
  // A malformed latest document is an error; never silently substitute an older week.
  cached={id:file.id,name:file.name,date:packageDate(file.name)!,url:file.mimeType===docsType?`https://docs.google.com/document/d/${file.id}/edit`:`https://drive.google.com/file/d/${file.id}/view`,text,checkedAt:new Date(now()).toISOString(),episodeCount:episodes.length};
  return cached;
 };
 return async(refresh=false)=>{
  if(cached&&now()-Date.parse(cached.checkedAt)<(refresh?5000:60000))return cached;
  if(!pending)pending=load().finally(()=>{pending=undefined;});
  return pending;
 };
}
export const latestWeekly=createWeeklyReader({key:()=>process.env.WEEKLY_DRIVE_API_KEY||process.env.GEMINI_API_KEY});
