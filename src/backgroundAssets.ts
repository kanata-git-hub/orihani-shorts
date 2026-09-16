import { extractOverview } from './utils/extractors';

export const BACKGROUND_ASSETS = [
  { id: 'pantry', name: '탕비실', url: '/backgrounds/pantry.png', description: '밝은 원목과 크림색 벽, 차와 약과가 있는 탕비실' },
  { id: 'treatment', name: '치료실', url: '/backgrounds/treatment.png', description: '크림색 침대와 따뜻한 원목 가구가 있는 치료실' },
  { id: 'reception', name: '접수대', url: '/backgrounds/reception.png', description: '밝은 원목 카운터와 크림색 벽으로 꾸민 접수대' },
] as const;
export type BackgroundId = typeof BACKGROUND_ASSETS[number]['id'];
export type BackgroundChoice = BackgroundId | 'auto' | 'none';
export type BackgroundChoices = Record<string, BackgroundChoice>;
export interface BackgroundScene { title: string; prompt: string; videoPrompt?: string; backgroundAsset?: string; locationId?: string }
export const isBackgroundChoice = (v: unknown): v is BackgroundChoice => typeof v === 'string' && ['auto', 'none', ...BACKGROUND_ASSETS.map(a => a.id)].includes(v);

const patterns: [BackgroundId, RegExp][] = [
  ['pantry', /탕비실|다과실|휴게실|\b(?:pantry|break\s*room|staff\s*(?:lounge|kitchen)|tea\s*room)\b/i],
  ['treatment', /치료실|침구실|추나실|\b(?:treatment\s*(?:room|area)|acupuncture\s*(?:room|area))\b/i],
  ['reception', /접수대|접수실|대기실|\b(?:reception(?:\s*(?:desk|area))?|front\s*desk|waiting\s*(?:room|area))\b/i],
];
const otherPlace = /집|자취방|침실|거실|지하철|거리|야외|골프장|회사|사무실|게임방|화장실|\b(?:home|bedroom|living\s*room|subway|street|outdoor|office|bathroom|restaurant|cafe|stadium|forest|beach|mountain)\b/i;
const samePlace = /같은\s*(?:장소|방|공간|배경)|동일한\s*(?:장소|방|공간|배경)|\bsame\s+(?:room|location|setting|background|environment)\b/i;

function environmentOf(scene: BackgroundScene) {
  // Saved prompts may have headings on one line or escaped newlines.
  return scene.videoPrompt?.replace(/\\n/g, '\n').match(/\bENVIRONMENT\s*:\s*([\s\S]*?)(?=(?:ACTION|DIALOGUE|AUDIO|VOCALS|PERFORMANCE|STRICT RULES|CINEMATOGRAPHY|OUTPUT SPECS|REFERENCE INSTRUCTION)\s*(?:\([^)]*\))?\s*:|$)/i)?.[1]?.trim() || '';
}

function detect(text: string): { id?: BackgroundId; explicit: boolean } {
  // Dialogue and negative lists do not identify the room being shown.
  const clean = text.replace(/^(?:DIALOGUE|STRICT RULES|REFERENCE INSTRUCTION)[^\n]*/gmi, '').replace(/\b(?:no|not|without)\b[^.;\n]*/gi, '');
  const matches = patterns.filter(([, re]) => re.test(clean));
  if (matches.length === 1 && !otherPlace.test(clean)) return { id: matches[0][0], explicit: true };
  return { explicit: matches.length > 0 || otherPlace.test(clean) };
}

export function resolveBackground(scenes: BackgroundScene[], index: number, plan = '', choices: BackgroundChoices = {}) {
  const scene = scenes[index];
  if (!scene) return undefined;
  const choice = choices[scene.title];
  if (choice === 'none') return undefined;
  if (choice && choice !== 'auto' && isBackgroundChoice(choice)) return BACKGROUND_ASSETS.find(a => a.id === choice);
  if (scene.backgroundAsset === 'none') return undefined;
  if (scene.backgroundAsset && scene.backgroundAsset !== 'auto' && isBackgroundChoice(scene.backgroundAsset)) return BACKGROUND_ASSETS.find(a => a.id === scene.backgroundAsset);
  const environment = environmentOf(scene);
  for (const text of [environment, scene.prompt]) {
    const match = detect(text);
    if (match.explicit) return BACKGROUND_ASSETS.find(a => a.id === match.id);
  }
  if (index > 0 && samePlace.test(environment + '\n' + scene.prompt)) return resolveBackground(scenes, index - 1, plan, choices);
  // Only the overall location is a safe fallback. Never scan dialogue or the whole story.
  const match = detect(extractOverview(plan).location);
  return BACKGROUND_ASSETS.find(a => a.id === match.id);
}

const otherRooms: [string, RegExp][] = [
  ['clinic-office', /원장실|진료실|\b(?:doctor'?s?|clinic|korean medicine)\s+(?:office|consultation\s*room)\b/i],
  ['bedroom', /침실|\bbedroom\b/i],
  ['living-room', /거실|\bliving\s*room\b/i],
  ['bathroom', /화장실|\bbathroom\b/i],
  ['office', /회사|사무실|\boffice\b/i],
  ['home', /집|자취방|\bhome\b/i],
  ['subway', /지하철|\bsubway\b/i],
  ['street', /거리|\bstreet\b/i],
  ['outdoors', /야외|\boutdoor(?:s)?\b/i],
  ['cafe', /카페|\bcafe\b/i],
  ['restaurant', /식당|\brestaurant\b/i],
  ['beach', /해변|\bbeach\b/i],
  ['forest', /숲|\bforest\b/i],
  ['mountain', /산속|\bmountain\b/i],
  ['stadium', /경기장|\bstadium\b/i],
  ['golf', /골프장/],
  ['gaming-room', /게임방/],
];

function continuityLocation(scenes: BackgroundScene[], index: number, plan: string, choices: BackgroundChoices): string {
  const scene = scenes[index];
  const background = resolveBackground(scenes, index, plan, choices);
  const locationId = scene.locationId?.trim();
  // Asset selection and narrative location are separate: 'none' is not a location change.
  if (background) return `asset:${background.id}:${locationId || ''}`;
  if (locationId) return `location:${locationId}`;
  const text = environmentOf(scene) || scene.prompt.replace(/^(?:DIALOGUE|STRICT RULES|REFERENCE INSTRUCTION)[^\n]*/gmi, '');
  // Legacy plans have no locationId. Recognize repeated locations without requiring an asset.
  const room = otherRooms.find(([, pattern]) => pattern.test(text));
  if (room) return `legacy:${room[0]}`;
  if (samePlace.test(text) && index > 0) return continuityLocation(scenes, index - 1, plan, choices);
  if (detect(text).explicit || environmentOf(scene)) return `unresolved:${index}`;
  return index > 0 ? continuityLocation(scenes, index - 1, plan, choices) : 'unspecified';
}

export function mayUsePreviousScene(scenes: BackgroundScene[], index: number, previousIndex: number, plan: string, choices: BackgroundChoices) {
  if (previousIndex < 0 || previousIndex >= index || !scenes[index] || !scenes[previousIndex]) return false;
  // Check every intervening cut: A -> B -> A must start a new continuous run.
  const location = continuityLocation(scenes, previousIndex, plan, choices);
  for (let i = previousIndex + 1; i <= index; i++) {
    if (continuityLocation(scenes, i, plan, choices) !== location) return false;
  }
  return true;
}

export function backgroundInstruction(id: BackgroundId) {
  const asset = BACKGROUND_ASSETS.find(a => a.id === id)!;
  return `[CANONICAL CLINIC BACKGROUND: ${asset.name} / ${asset.id}]
The labelled room photograph is the authoritative environment reference for THIS scene's room geometry, materials and colors. Preserve its warm light wood, cream walls, furniture design, room layout and lighting palette. Use the same clinic interior, adapting the camera angle and framing to the action. Keep the pantry's yakgwa snacks when visible. Render ALL jar labels, packaging labels, signs, screens and papers as clean, plain, blank surfaces; this clean-surface rule takes priority over any markings visible in the room original. Use the existing furniture and everyday props shown in the room original. Draw the characters requested in the scene using their ORIGINAL character sheets exclusively for identity, anatomy and colors. The room original controls the setting; the current scene prompt controls the action and story props.`;
}
