# Complete production packages

The creator writes the screenplay, initial stills and video direction together. The
app imports the approved strings without a Gemini planning/conversion/review call.
Actual still-image generation and visual review continue through the existing image
workflow. Kling remains the user's video-generation step.

## App flow

1. The weekly picker reads the newest file from the existing Drive folder. For the
   same date, an authored `.json` takes priority over the legacy text/Google Doc.
2. Select an episode and press **이 제작안으로 시작**. This validates and creates a
   separate local work record, then opens the existing image/prompt workspace.
3. Generate stills in scene order, inspect them against the written starting states,
   and use each still with its corresponding Kling prompt. Check actual end frames
   before proceeding across a cut. A prompt validation pass is not a footage pass.
4. Reopening/exporting the work preserves prompts and the source screenplay. The
   legacy prompt-regeneration button is hidden for authored records.

Manual `.json` file import and paste work in the same picker. Legacy `.md`/`.txt`
scripts keep their existing conversion route. An invalid newest package raises an
error; it never silently loads an older script or pays a model to repair the data.

## Contract

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
