const LEGACY_PROP_MARKER = '[RECURRING PROP DESIGN — START FRAME PRIORITY]';
const LEGACY_PROP_TEXT = 'The supplied start-frame image defines the exact design of recurring props. Preserve their silhouette, materials, colors, proportions and attached components throughout this clip. If an incidental prop description above conflicts with the visible start frame, keep the start-frame design and perform the current scripted action with it. Animate only the specified action and state changes; do not redesign the prop or add unpictured components. Character identity stays consistent with the bound character assets.';

export const SILENT_CLIP_AUDIO = `[CLIP AUDIO — NO VOICES IN THIS CLIP]
AUDIO: During this clip, background ambience and synchronized object/action sound effects only. Any requested music is instrumental.
VOCALS: None during this clip. No speech, narration, singing, or vocal sounds in any language, including off-screen voices.
PERFORMANCE: During this clip, characters act without speaking or speech-like mouth movements.`;

export const videoAudioInstruction = `MANDATORY AUDIO DIRECTION FOR EVERY CLIP:
Preserve the source script's exact spoken lines and their assigned clips. Do not add dialogue, narration, exclamations or vocal reactions to a wordless scene. Captions, UI text, thoughts and sound-effect labels are not spoken lines.
Always write DIALOGUE and AUDIO on separate lines, alongside the other video prompt headings.
For a clip without a spoken line, write DIALOGUE: None. Then include this exact block:
${SILENT_CLIP_AUDIO}
Also describe the specific non-vocal ambience and object/action sounds that fit the scene, such as room tone, a vacuum motor, footsteps or a door click. Do not fill the silence with crowd chatter, muttering or voice references. Preserve the visual action; speech-like mouth movements are excluded, but eating or surprised expressions must remain possible.
For a speaking clip, write DIALOGUE: Character English Name: "Exact Korean line". Only the named speaker delivers that line in Korean without translation or extra words; other characters stay silent. Retain any explicitly requested voice-over under NARRATION instead of inventing one. Describe supporting ambience and effects under AUDIO. Never apply the no-voices block to a clip with an explicit spoken line.
These audio requirements apply even when older examples omit dialogue/audio sections or discourage visual negative prompts.`;

// Read headings even in older flattened prompts, but never treat a heading
// inside a quoted spoken line as a new field.
function fields(prompt:string) {
  const quoted = [...prompt.matchAll(/"[^"\n]*"|“[^”]*”|「[^」]*」/g)].map(m=>[m.index!,m.index!+m[0].length]);
  const headings = [...prompt.matchAll(/(?:Specific\s+)?(REFERENCE INSTRUCTION|OUTPUT SPECS|CINEMATOGRAPHY|ENVIRONMENT|ACTION|DIALOGUES?|DIALOG|NARRATION|VOICE[ -]?OVER|AUDIO|SFX|SOUND EFFECTS|MUSIC|VOCALS|PERFORMANCE|STRICT RULES)(?:\s*\([^\n)]*\))?\s*\*{0,2}\s*[:：]\s*\*{0,2}/gi)]
    .filter(m=>(!/[\w]/.test(prompt[m.index!-1]||'')||m[1]===m[1].toUpperCase())&&!quoted.some(([start,end])=>m.index!>start&&m.index!<end));
  return headings.map((m,i)=>({name:m[1].toUpperCase(),value:prompt.slice(m.index!+m[0].length,headings[i+1]?.index??prompt.length).trim(),start:m.index!,end:headings[i+1]?.index??prompt.length}));
}

// New generated clips bind to their actual starting image. A model-written
// reference field must not override the original assets with invented colors.
export function bindClipStartFrame(raw: string, scene: number): string {
  const prompt = raw.replace(/\\r\\n|\\n/g, '\n');
  let body = prompt;
  for (const section of fields(prompt).filter(s => s.name === 'REFERENCE INSTRUCTION').reverse()) {
    body = body.slice(0,section.start) + body.slice(section.end);
  }
  return `REFERENCE INSTRUCTION: @image${scene} = Scene ${scene} start frame reference. Preserve the character identities and colors shown in this frame and their bound original character assets.\n\n${body.trim()}`;
}

function noLine(value:string) {
  const clean=value.replace(/[*_`"“”'()\[\]{}]/g,'').trim().replace(/[.!。]+$/,'').trim();
  return /^(?:none(?:\s*[-,;:]?\s*(?:silent|silence|sfx only|sound effects only|no (?:dialogue|speech|speaking)))?|n\/?a|not applicable|no (?:spoken dialogue|dialogue|speech|speaking)(?:\s*[-,;:]?\s*(?:silent|silence))?|silent|silence|없음|대사\s*없음|침묵|무대사|[-–—…]*)$/i.test(clean);
}

export function videoPromptForCopy(raw:string):string {
  if(!raw.trim())return raw;
  let prompt=raw.replace(/\\r\\n|\\n/g,'\n');
  const escape=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const oldBlock=new RegExp(escape(LEGACY_PROP_MARKER)+'\\s*'+LEGACY_PROP_TEXT.split(/\s+/).map(escape).join('\\s+'),'g');
  prompt=prompt.replace(oldBlock,'').replace(SILENT_CLIP_AUDIO,'').trim();
  if(!prompt)return '';
  const sections=fields(prompt);
  const spoken=sections.filter(s=>/^(?:DIALOGUES?|DIALOG|NARRATION|VOICE[ -]?OVER)$/.test(s.name));
  // Never mute a written line, including one in a legacy ACTION/AUDIO field.
  if(spoken.some(s=>!noLine(s.value)))return prompt;
  const legacyAction=sections.filter(s=>/^(?:ACTION|AUDIO)$/.test(s.name)).map(s=>s.value).join('\n')||prompt;
  if(/(?:O[- ]wonjang|Somi|Deok[- ]i|오원장|소미|덕이)\s*(?:\([^)]*\))?\s*[:：]\s*["“「']/i.test(legacyAction))return prompt;
  const speechCue=/\b(?:says?|speaks?|speaking|asks?|replies|reply|whispers?|mutters?|shouts?|sings?|singing|narrat(?:es?|ion)|voice[ -]?over|delivers? (?:the |a )?line)\b|말한다|말하며|속삭|대답한다|나레이션|내레이션/i;
  if(speechCue.test(legacyAction)&&(!spoken.length||/["“「][^"”」]*[\p{L}\p{N}][^"”」]*["”」]/u.test(legacyAction)))return prompt;
  return prompt+(spoken.some(s=>/^DIALOG/.test(s.name))?'':'\nDIALOGUE: None.')+'\n\n'+SILENT_CLIP_AUDIO;
}

export function normalizeVideoPlan(raw:string):string {
  const plan=JSON.parse(raw);
  if(Array.isArray(plan.clips))plan.clips=plan.clips.map((clip:any)=>({...clip,videoPrompt:videoPromptForCopy(clip.videoPrompt||'')}));
  return JSON.stringify(plan);
}
