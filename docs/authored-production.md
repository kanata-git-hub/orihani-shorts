# Complete production packages

The creator writes the screenplay, still-image requests and video direction together. The
app imports the approved strings without a Gemini planning/conversion/review call.
The preferred image workflow uses the conversation's built-in image generation within
the user's subscription, followed by Drive image loading. No OpenAI API connection or
paid fallback is authorized. Optional Gemini image generation remains explicit.
Kling remains the user's video-generation step.

## Kling 4.0 — current format for new work

Keep the same `orihani-production` version-1 envelope and episode metadata. In `plan`,
use `workflow: "kling4"`, numeric `duration` (5, 15 or 30), `continuity`, one
`videoPrompt` for the entire video, and `keyframes` instead of `clips`.
Keep title, location, scenario, instagramCaption and five hashtags as before.
`plan.scenario` and `episode.scenario` must match exactly; so must duration and title.

Defaults are 5 seconds / 2 images, 15 seconds / 3 images, 30 seconds / 5 images.
These are image-production defaults, not a fixed number of story beats. Use 2–10
keyframes only when justified by the event; do not create extra stills per camera cut.
Suggested timestamps are [0,5], [0,7.5,15], [0,7.5,15,22.5,30], adjusted to the story.
All formats feed **one finished MP4** into the editor.

Each keyframe has:

```json
{
  "time": 7.5,
  "title": "중요 변화",
  "imageTitle": "keyframe-02",
  "imagePrompt": "Exact static pose, support, contact, ownership and prop state at this moment.",
  "locationId": "park",
  "backgroundAsset": "none",
  "referencePlan": {"background":1,"props":[{"scene":1,"objects":["벤치"]}]}
}
```

`time` starts at 0, increases strictly, and never exceeds duration. A true ending
frame can use the exact duration; a legacy final clip's start is not an ending frame.
`imageTitle` is unique and stable so images survive reload/export/import. Reference
numbers refer to earlier **keyframes**, independently of any screenplay shot numbers.
The first keyframe uses `{ "background": null, "props": [] }`; later images in the
same set reuse its canonical background and named prop designs. New locations use null.
`continuity` explicitly fixes recurring geometry, count, size, color, ownership and set.
The final image depicts the actual payoff, overriding the legacy start-still restriction.

The app preserves the whole-video prompt byte for byte without clip headers, silent
audio normalization or truncation. Write timing, causal action, camera, state changes,
exact Korean dialogue (if any), sound and restrictions in this single prompt. The app's
30,000-character import bound is not a claim about Kling's model token limit. The legacy
1,900-character per-clip check does not apply to this format.

Upload finished PNG/JPG/WebP images directly into the existing weekly Drive folder.
Add an optional episode-level `assets` map keyed by each exact `imageTitle`; every
entry contains `{ "fileId": "actual-Drive-file-id", "sha256": "64-lowercase-hex" }`.
The map must cover all images in that episode. Keep the production JSON small;
do not embed base64 images in it. One image is limited to 8MB, one episode to 24MB.
The authenticated weekly start action loads only the selected episode's images,
checks folder membership, MIME, byte count and SHA-256, saves the complete set to
IndexedDB, then publishes its new work record. Errors remain visible for retry.
Membership comes from a paginated `'<weekly-folder>' in parents and trashed = false`
listing, not an assumption that public `files.get` metadata contains `parents`.
Missing/incomplete folder listings fail before downloading; raw bytes must still
match the authored hashes. Do not substitute an owner-authenticated metadata test
for verification of the public-folder loading path.
No generation, review or paid provider call is made. Existing work stays untouched.
Manual **직접 만든 이미지 가져오기** remains available for local replacements.
Use **전체 영상 프롬프트 복사**, place the keyframes at their
indicated timestamps in Kling, and import its one completed video into the editor.
The existing 26MB file / 28MB combined upload bound still applies.

Existing records retain their original images, clips, edit drafts and render outputs.
**Kling 4.0 작업으로 복사** creates a separate ID with all images at their true legacy
starting timestamps; it does not silently remove the fourth image or fabricate an end
pose. Its combined video prompt is explicitly a draft requiring review before copying.
New stories should be authored directly in the smaller keyframe format.

The old contract below remains supported for existing records and the optional legacy
Gemini text planner. Never run the legacy compiler over Kling 4.0 keyframes.

## App flow

1. The weekly picker reads the newest file from the existing Drive folder. For the
   same date, an authored `.json` takes priority over the legacy text/Google Doc.
2. Select an episode and press **이 제작안으로 시작**. When `assets` is present,
   its approved Drive images are loaded together with the unchanged prompts before
   a separate local work record opens. No download/ZIP/import step is required.
3. Inspect the prepared images and use them with the whole-video Kling prompt.
   For older packages without assets, local import remains available. Check actual end frames
   before proceeding across a cut. A prompt validation pass is not a footage pass.
4. Reopening/exporting the work preserves prompts and the source screenplay. The
   legacy prompt-regeneration button is hidden for authored records.

Manual `.json` file import and paste work in the same picker. Legacy `.md`/`.txt`
scripts keep their existing conversion route. An invalid newest package raises an
error; it never silently loads an older script or pays a model to repair the data.

## Legacy clip contract

Authoritative validator: `src/workflow/productionPackage.ts`. Actual worked example:
`tests/fixtures/authored-production.json` (synthetic test data, not a production story).

```json
{
  "format": "orihani-production",
  "version": 1,
  "revision": "YYYY-MM-DD-descriptive-revision",
  "episodes": [{
    "number": 1,
    "characterId": "nurse",
    "episode": {"duration":15,"title":"[에피소드 1] ...","scenario":"...","korean":"...","thumbnail":"...","caption":"..."},
    "plan": {"title":"...","location":"...","scenario":"...","instagramCaption":"...","hashtags":["...","...","...","...","..."],"propBible":[],"clips":[]}
  }]
}
```

The abbreviated example is explanatory, not importable. Required details:

- One to three episodes, distinct positive numbers, character ID `owonjang`,
  `nurse` or `deoki`, and 5 or 15 seconds. The normal weekly task writes three.
- `plan.scenario` is exactly `episode.scenario`; titles agree after the episode
  marker. The Korean source preserves the five weekly screenplay sections.
- Each clip has `title`, unique `imageTitle`, `videoTitle`, final `imagePrompt`,
  final `videoPrompt`, `backgroundAsset`, stable `locationId`, `sceneTransition`,
  `shot`, `frame` and `referencePlan`. Use the existing production continuity
  schema for `propBible`, `frame` and `shot`. References point only backward in
  the same episode and must agree with the screenplay's `referencePlan` lines.
- Still prompts depict only the start, while video prompts give the action and
  endpoint. Each video includes the established headings with real newlines and
  exactly the required `OUTPUT SPECS` duration. Keep motion prompts concise;
  do not repeat every appearance fact already established by the start image.
  The final clipboard string must be at most **1,900 UTF-16 code units**, including
  the clip/title prefix, whitespace and any legacy audio normalization. The user's
  current Kling field truncates at 2,000; the UI shows that observed limit. Use
  `clipVideoText` for both copying and measurement. Never silently truncate a prompt.
- The validator uses the production compiler for structural checks but discards
  its output: it does not replace either supplied prompt. Authorship markers are
  provenance, not a claim of generated-image QA or predicted audience success.

## Authoring and release

Use the current AGENTS story standard. Run actual story, body/character and
production passes; record honest projected-finished scores and unresolved issues.
Do not fake footage inspection. Actual story packages and detailed production
prompts belong in the creator's established Drive workflow, not in this public
repository. The synthetic fixture documents the schema only. Local validation
requires no provider credentials or model requests:

```sh
node scripts/check-weekly-review.mjs /path/to/screenplay.txt /path/to/review.json
node --test tests/production-package.test.cjs
node --import tsx scripts/check-production-prompts.ts /path/to/production.json
```

Bind the review to the exact screenplay hash and record the production JSON hash.
Verify eight start/end connections and original anatomy for a two-episode package.
Save the production JSON in the established folder with this exact dated pattern:
`[YYYY-MM-DD] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json`.
Read it back, validate the returned bytes/text and preserve the older files. A
future normal three-episode package uses the default review gate without `--episodes`.

Prompt-only shortening keeps the existing screenplay/image/continuity data unchanged.
Record three compression review passes and the revised production hash separately from
the unchanged screenplay review. Existing over-budget authored work can receive the
latest prompts only when its complete screenplay, character and every non-video plan
field match. Preserve the record ID, image names, media, editor link and all other fields;
customized or different stories must not be matched by episode number/title alone.

For immediate compatibility with the older deployed app, wrap each prepared
history record using `makePackage(item,{})`. The old **기록 → 작업 파일 가져오기**
already accepts these work files without text generation. Label these as new
records, preserve all old footage, and do not press legacy prompt regeneration.
