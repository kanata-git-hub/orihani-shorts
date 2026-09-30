// Screenplay-owned references use 1-based scene numbers within ONE episode.
// The images remain in the receiving work's existing image store; auto links
// resolve at generation time, while manual prop selections remain snapshots.
export type ReferencePlan = { background: number | null; props: { scene: number; objects: string[] }[] };
export type ReferenceSource = { scene: number; background: boolean; objects: string[]; imageUrl?: string };
const imageData = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i;

export function readReferencePlan(value: unknown, targetScene: number): ReferencePlan | undefined {
  if (value === undefined) return undefined;
  const v = value as ReferencePlan;
  const earlier = (n: unknown) => Number.isInteger(n) && Number(n) >= 1 && Number(n) < targetScene;
  const fail = () => { throw Error(`장면 ${targetScene}의 referencePlan이 올바르지 않습니다. 같은 화의 앞 장면 번호와 소품 이름을 확인해주세요.`); };
  if (!v || typeof v !== 'object' || Array.isArray(v) ||
      Object.keys(v).some(k => !['background','props'].includes(k)) ||
      !(v.background === null || earlier(v.background)) || !Array.isArray(v.props) || v.props.length > 3) return fail();
  const seen = new Set<number>();
  const props = v.props.map(p => {
    if (!p || typeof p !== 'object' || Object.keys(p).some(k => !['scene','objects'].includes(k)) ||
        !earlier(p.scene) || seen.has(p.scene) || !Array.isArray(p.objects) || !p.objects.length || p.objects.length > 8 ||
        p.objects.some(s => typeof s !== 'string' || !s.trim() || s.length > 120 || /[\r\n]/.test(s))) return fail();
    seen.add(p.scene);
    return {scene:p.scene,objects:[...new Set(p.objects.map(s => s.trim()))]};
  });
  return {background:v.background,props};
}

export function parseReferencePlans(scenario: string): ReferencePlan[] | undefined {
  if (!/^\s*referencePlan\s*:/m.test(scenario)) return undefined;
  const heads = [...scenario.matchAll(/^\s*\[장면\s*(\d+)\s*\([^\n)]+\)\s*\]\s*$/gm)];
  const fail = () => { throw Error('자동 참고 연결은 모든 장면에 referencePlan 한 줄씩 필요합니다. 장면 번호와 JSON 형식을 확인해주세요.'); };
  if (!heads.length || /^\s*referencePlan\s*:/m.test(scenario.slice(0, heads[0].index))) return fail();
  return heads.map((h,i) => {
    if (Number(h[1]) !== i+1) return fail();
    const body = scenario.slice(h.index!+h[0].length, heads[i+1]?.index ?? scenario.length);
    const lines = [...body.matchAll(/^\s*referencePlan\s*:\s*([^\n]+)$/gm)];
    if (lines.length !== 1) return fail();
    let value:unknown;
    try { value = JSON.parse(lines[0][1]); } catch { return fail(); }
    return readReferencePlan(value,i+1)!;
  });
}

export function referenceSources(plan:ReferencePlan, scenes:{title:string}[], images:Record<string,string>, manualProps=false):ReferenceSource[] {
  const sources = new Map<number,ReferenceSource>();
  const add = (n:number) => { if (!sources.has(n)) sources.set(n,{scene:n,background:false,objects:[]}); return sources.get(n)!; };
  if (plan.background !== null) add(plan.background).background = true;
  if (!manualProps) for (const p of plan.props) add(p.scene).objects.push(...p.objects);
  return [...sources.values()].map(s => {
    const url = images[scenes[s.scene-1]?.title];
    return {...s,imageUrl:typeof url === 'string' && imageData.test(url) ? url : undefined};
  });
}

export function plannedReferenceLabel(source:ReferenceSource) {
  return `SCRIPT REFERENCE — Scene ${source.scene}: ${source.background?'physical set architecture, fixed landmarks and materials':''}${source.background&&source.objects.length?'; ':''}${source.objects.length?`ONLY these recurring prop designs: ${source.objects.join(', ')}`:''}.`;
}

export const plannedReferenceInstruction = `[SCRIPT-ASSIGNED REFERENCES]
Each attached SCRIPT REFERENCE names exactly what may be reused from that image. A set reference controls architecture, fixed landmarks and materials, reframed for the current camera. A prop reference controls ONLY the named props' silhouette, material, colors and components, even across different locations. Do not copy unlisted props or a prop-only reference's background. Named script prop sources take priority over props visible incidentally in a set anchor or episode-wide reference.
The CURRENT scene controls camera, crop, gaze, pose, expression, light/weather and object STARTING STATE. A referenced image is an earlier START frame, NOT the previous clip's final frame. Do not restore an earlier closed door, intact wall, dry costume or other obsolete state. Do not draw the clip's later action result early. ORIGINAL character sheets control identity and anatomy. Explicit user-selected prop references override automatic prop sources. These connections describe visual design, not a request to repeat a previous composition.`;
