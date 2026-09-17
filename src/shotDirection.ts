export const SHOT_SIZES = ['extreme-wide', 'wide', 'full', 'medium', 'close-up', 'extreme-close-up'] as const;
export const SCENE_TRANSITIONS = ['continuous', 'reframe', 'new-scene'] as const;
export interface ShotDirection {
  size: typeof SHOT_SIZES[number];
  angle: string;
  focus: string;
  startState: string;
}

export function readShotDirection(value: unknown): ShotDirection | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as ShotDirection;
  if (!SHOT_SIZES.includes(v.size) || ![v.angle, v.focus, v.startState].every(s => typeof s === 'string' && !!s.trim() && s.length <= 8000)) return undefined;
  return { size: v.size, angle: v.angle, focus: v.focus, startState: v.startState };
}

export function readSceneTransition(value: unknown): typeof SCENE_TRANSITIONS[number] | undefined {
  return SCENE_TRANSITIONS.includes(value as any) ? value as typeof SCENE_TRANSITIONS[number] : undefined;
}

export function shotDirectionInstruction(value: unknown): string {
  const shot = readShotDirection(value);
  if (!shot) return '';
  return `[CURRENT SHOT COMPOSITION]
Shot size: ${shot.size}.
Camera angle: ${shot.angle}
Visible focus and framing: ${shot.focus}
Starting state to depict: ${shot.startState}
Compose a new photograph from this camera. A set-reference image supplies architecture and prop design, not its crop, lens distance or character pose. Frame only the subjects specified above; other cast members and their feet need not fit inside a close-up. In a wide landscape, show the scripted distance and scale rather than enlarging the mascot to fill the image. Keep anatomy and identity consistent with the original sheets. The current written prompt takes precedence if the user has edited it.`;
}

export const shotConversionInstruction = `SHOT DIRECTION MUST SURVIVE CONVERSION:
Preserve the source's dramatic action, outcome, camera scale, angle, framing, location changes and match cuts. Do not reduce travel, physical action or a surreal visual metaphor to standing characters explaining it. A coherent short story can use several locations; character continuity does not mean the whole episode stays in one room.
For each clip, fill shot.size, shot.angle, shot.focus and shot.startState with the CURRENT shot's actual framing and beginning state. Repeat them faithfully in imagePrompt. A close-up stays a close-up even when other characters exist outside the crop. A distant epic wide shot keeps the character small within the landscape. Describe foreground, subject and background depth when useful. Do not make every clip the same full-body two-shot.
Set sceneTransition to continuous for an unbroken action in the same set, reframe for an intentional new camera setup within that set, or new-scene for a location change, fantasy/reality cut, time jump or deliberate new visual setting. Use new-scene for a changed visual world even if the nominal place has the same locationId. For different locations use different locationIds. Keep backgroundAsset none for fantasy worlds, landscapes and homes; use clinic assets only when that clinic room is actually visible.
Use cuts to separate difficult contact or transformations, preserving a visible causal cue and the resulting state. Ordinary acting and a simple physical action/reaction may occur within one clip. Never invent an additional montage or internal cut that the source did not request. Keep the given clip count and durations.`;
