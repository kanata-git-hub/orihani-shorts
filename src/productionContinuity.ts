import { readShotDirection, shotDirectionInstruction } from './shotDirection';

// Text planning and image rendering are different models. Keep the image model
// unchanged; upgrade the converter/reviewer without silently buying Pro images.
export const PROMPT_MODEL = 'gemini-3.8-flash';
export const PRODUCTION_VERSION = 1;
const string = { type: 'STRING' };
const array = (items: any) => ({ type: 'ARRAY', items });
const object = (properties: Record<string, any>) => ({ type: 'OBJECT', properties, required: Object.keys(properties) });
export const propBibleSchema = array(object({
  id: string, name: string, appearance: string, scale: string,
  parts: array(object({ id: string, description: string })),
}));
export const frameSchema = object({
  environment: string,
  visibleCharacters: array({ type: 'STRING', enum: ['O-wonjang', 'Deok-i', 'Somi'] }),
  props: array(object({
    id: string, placement: string,
    parts: array(object({ id: string, state: string, visibility: { type: 'STRING', enum: ['visible', 'occluded', 'offscreen'] } })),
  })),
  action: string, endState: string, continuityFromPrevious: string,
});

export const productionConversionInstruction = `PRODUCTION CONTRACT: DESIGN, START FRAME, MOTION.
First read the ENTIRE screenplay and create ONE propBible for its recurring/story-critical props.
Give each prop one stable id. appearance describes material/color/shape; scale gives its fixed size relative to the original characters and required capacity, considering ALL later shots before drawing shot 1. Never enlarge a box to fit a later guest or shrink characters to fit it. Separate physical parts with stable ids and descriptions: their shape, attachment, hinge/axis and purpose. A front folding wall, side entrance door, star window and liftable roof are FOUR different parts, never interchangeable. Do not invent a roof hole or other new geometry to perform an action.
These are generic production rules, not a request to insert a box, door, window or roof into unrelated stories. Include only props and parts actually needed by this screenplay. A simple cookie can have a single body part; an episode without story props can use [].
If the source explicitly calls for a transformation or size change, keep the baseline design in the bible and specify the motivated change in states/action. Do not suppress an intentional fantasy event; reject only unmotivated redesign.
For each clip produce frame.environment (visible set/light only), frame.visibleCharacters (only visible cast), frame.props (refer to the SAME bible ids), and one state+visibility for EVERY defined part of each included prop. States describe the instantaneous START, not later outcomes. Use occluded/offscreen for parts outside the camera view, retaining their physical existence. Prop placement and scale must not change without a scripted cause. Preserve the current close-up; do not squeeze the whole cast or whole prop into it.
shot.startState contains visible character poses/gazes/expressions at frame zero, not the completed action. A running or falling character may already be mid-motion when the source says so. Explicitly closed/upright/off at the start remains so even if it opens/falls/starts later.
frame.action contains the clip's ONE main action, its causal order and timing from the screenplay. frame.endState describes the resulting state. frame.continuityFromPrevious explains previous END to current START, including only explicitly motivated off-screen movement/time jumps; scene 1 uses 'Opening shot'. Do not confuse the previous generated START still with its video's END.
Generate videoPrompt with the required headings and exact Korean dialogue/audio. Its ACTION will be assembled from the contract. Do not generate an independent imagePrompt: the application assembles it from environment, shot.startState and part START states ONLY. Future action/endState/transition explanations NEVER enter the image prompt.
Preserve all source directions. Never fix a contradiction by removing the gag, changing the dialogue or simplifying a cinematic event into a static conversation.`;

type Part = { id: string; description: string };
type Prop = { id: string; name: string; appearance: string; scale: string; parts: Part[] };
type PropState = { id: string; placement: string; parts: { id: string; state: string; visibility: string }[] };
type Frame = { environment: string; visibleCharacters: string[]; props: PropState[]; action: string; endState: string; continuityFromPrevious: string };
const fail = (detail: string): never => { throw Error(`프롬프트 연속성 검수: ${detail}`); };
function text(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 16000) fail(`${label} 누락 또는 길이 오류`);
}
function list(value: unknown, label: string, max = 32): asserts value is any[] {
  if (!Array.isArray(value) || value.length > max) fail(`${label} 형식 오류`);
}
function ids(values: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value || !/^[a-z][a-z0-9_-]{0,63}$/.test(value.id) || seen.has(value.id)) fail(`${label} 식별자 중복 또는 오류`);
    seen.add(value.id);
  }
}

export function compileProductionPlan(plan: any) {
  list(plan?.propBible, '소품 구조'); ids(plan.propBible, '소품');
  const bible = plan.propBible as Prop[];
  for (const prop of bible) {
    for (const key of ['name', 'appearance', 'scale'] as const) text(prop[key], `소품 ${key}`);
    list(prop.parts, '소품 부품'); ids(prop.parts, '소품 부품');
    if (!prop.parts.length) fail('소품 부품 누락');
    prop.parts.forEach(part => text(part.description, '부품 구조'));
  }
  list(plan.clips, '장면', 4);
  if (!plan.clips.length) fail('장면 누락');
  const clips = plan.clips.map((clip: any, index: number) => {
    const shot = readShotDirection(clip.shot);
    if (!shot) fail(`장면 ${index + 1} 시작 구도 누락`);
    const frame = clip.frame as Frame;
    if (!frame) fail(`장면 ${index + 1} 시작 상태 누락`);
    for (const key of ['environment', 'action', 'endState', 'continuityFromPrevious'] as const) text(frame[key], `장면 ${index + 1} ${key}`);
    list(frame.visibleCharacters, '등장인물', 3);
    if (new Set(frame.visibleCharacters).size !== frame.visibleCharacters.length || frame.visibleCharacters.some(n => !['O-wonjang','Deok-i','Somi'].includes(n))) fail('등장인물 오류');
    list(frame.props, '장면 소품'); ids(frame.props, '장면 소품');
    const designs: string[] = [];
    for (const state of frame.props) {
      const prop = bible.find(p => p.id === state.id);
      if (!prop) fail(`장면 ${index + 1}에 정의되지 않은 소품`);
      text(state.placement, '소품 위치'); list(state.parts, '부품 상태'); ids(state.parts, '부품 상태');
      if (state.parts.length !== prop.parts.length || prop.parts.some(p => !state.parts.some(s => s.id === p.id))) fail(`장면 ${index + 1} ${prop.name} 부품 상태 누락 또는 추가`);
      const parts = prop.parts.map(part => {
        const current = state.parts.find(s => s.id === part.id)!;
        text(current.state, '시작 부품 상태');
        if (!['visible','occluded','offscreen'].includes(current.visibility)) fail('부품 가시성 오류');
        return `${part.id}: ${part.description}\nSTART state: ${current.state}; visibility: ${current.visibility}.`;
      });
      designs.push(`${prop.name} (${prop.id})\nFixed design: ${prop.appearance}\nFixed scale/capacity: ${prop.scale}\nSTART placement: ${state.placement}\n${parts.join('\n')}`);
    }
    // Deliberate allowlist: never pass frame.action/endState, later scenes or the
    // model's old imagePrompt to the image generator, even when they are present.
    const imagePrompt = `[SINGLE START FRAME — SCENE ${index + 1}]
One clean vertical 9:16 start-frame image in the established matte 3D duck style. No title, dialogue captions, montage or panels.
Visible cast: ${frame.visibleCharacters.join(', ') || 'No characters in this crop'}.
SET AND LIGHT: ${frame.environment}
${shotDirectionInstruction(shot)}
[PROP BLUEPRINT AND CURRENT START STATES]
${designs.join('\n\n') || 'No story props in this crop.'}
Retain the fixed scale, attachment points and distinct parts. Apply the written START states even if a reference photo shows a different state or accidental missing part. Do not copy reference geometry that conflicts with this explicit blueprint. Offscreen/occluded parts stay outside the crop; do not remove them physically. Do not add openings or components. This is the instant before the described clip unfolds.`;
    text(clip.videoPrompt, '영상 프롬프트');
    const action = `Start: ${shot!.startState}\n${frame.props.map(p => `${p.id}: ${p.placement}; ${p.parts.map(s => `${s.id} ${s.state}`).join('; ')}`).join('\n')}\nDuring this clip: ${frame.action}\nEnd: ${frame.endState}`;
    // New converter outputs use real, line-separated headings. Keep exact audio
    // and dialogue rather than asking a second prose writer to paraphrase them.
    const actionSection = /^ACTION\s*:[\s\S]*?(?=^[A-Z][A-Z _-]*(?:\s*\([^\n)]*\))?\s*:|$(?![\s\S]))/m;
    if (!actionSection.test(clip.videoPrompt)) fail('영상 ACTION 항목 누락');
    const videoPrompt = clip.videoPrompt.replace(actionSection, `ACTION: ${action}\n`);
    return { ...clip, imagePrompt, videoPrompt };
  });
  return { ...plan, clips, productionVersion: PRODUCTION_VERSION, promptModel: PROMPT_MODEL };
}

export const continuityReviewSchema = object({ issues: array(string) });
export const continuityReviewInstruction = `You are a production continuity reviewer, not a creative writer. Compare the authoritative screenplay and compiled prompts supplied as data. Return issues=[] ONLY when faithful. Report concrete contradictions, not preferences or generic advice.
Check each START image against the source START, never against the clip's end. Check previous END -> next START with the stated off-screen bridge. Check one fixed prop scale/capacity from shot 1 through the ending, distinct physical parts and their attachment/hinge directions, every part's state, crop/visibility, character placement, intended gag, Korean dialogue/speaker and silent beats. Check image and video directions do not contradict each other. Reject early reveals, walls already fallen before they fall, improvised holes, window/door swaps, resizing a house between shots, disappearing characters in a wide shot, or inventing actions absent from source. A deliberate close-up can omit other cast. New viewpoints are allowed; fixed pose/camera across all shots is NOT required. Do not insert any example into an unrelated story. Do not claim to inspect generated images; these are text prompts only.`;

export function readReviewIssues(raw: string): string[] {
  const value = JSON.parse(raw);
  list(value?.issues, '검수 결과', 40);
  value.issues.forEach((issue: unknown) => text(issue, '검수 지적'));
  return value.issues;
}
