# Production Direction: 하찮은 오리 일상

This file is loaded by server.ts as the legacy free-form video planner's system instruction.
A completed legacy weekly screenplay goes to conversion. An authored production package
already contains final image/video prompts and MUST bypass model planning/conversion.

## Authored production handoff — 2026-10-14 user request

The user now wants ChatGPT to author the complete episode plan, all start-image prompts,
all Kling video prompts and continuity metadata together, before opening the meme app.
Use `docs/authored-production.md` and `src/workflow/productionPackage.ts` for the format.
The app imports validated `orihani-production` JSON and uses its supplied prompts directly.
Do not send this path to Gemini for planning, conversion, text review or prompt repair.
Existing image generation/visual review and the user's Kling workflow remain available.
Do not confuse authoring prompts with having generated or verified their final footage.

Future scheduled packages contain the normal three episodes plus their final prompts,
not just a screenplay awaiting another creative conversion. Author and review one
canonical production JSON; derive its readable screenplay/prompts and portable work
files from that exact source. Save the JSON to the established weekly Drive folder as
`[YYYY-MM-DD] 3D 오리 삼총사 릴스 개그 시리즈 주간 패키지.json`.
For equal dates the app prefers this file to a legacy human-readable screenplay.
Do not publish a newer JSON until its entire requested scope has passed validation.

Keep the existing twelve-criterion editorial standard and three real revision passes.
When finished images exist, upload the individual PNG/JPEG/WebP files to the same
weekly Drive folder and include each episode's `assets` manifest (imageTitle ->
fileId and SHA-256). The app's normal weekly start button must load those images
with the supplied prompts. A ZIP or manual work-file import is an optional export,
not a completed Drive-to-app handoff. Do not regenerate already approved images.
For an explicitly scoped revision, run the same review gate with the requested episode
numbers via `--episodes=N,M`; preserve episodes outside that scope.
The default weekly gate still requires three episodes. This changes scope, not the
quality threshold. Validate the final JSON with `readProductionPackage`, confirm exact
prompt preservation and read back the saved source before reporting completion.
The authored JSON is authoritative for this workflow; older Google Docs remain legacy
sources and archives, not a reason to regenerate the authored prompts.

## Current release standard

### Kling 4.0 keyframes and subscription image creation — 2026-10-16

For NEW authored packages use `plan.workflow: "kling4"`, one whole-video
`videoPrompt`, and `keyframes` instead of `clips`; see docs/authored-production.md.
Defaults: 5 seconds / 2 images, 15 seconds / 3 images, 30 seconds / 5 images.
These images anchor important moments within ONE video, not separate video clips.
The old four-shot 4/4/3/4 timing applies only to legacy clip packages and does not
override this new format. Story beats and image count are independent. An end
keyframe depicts the actual payoff; it is not another clip's starting state.
Reuse the first approved image of the same set for later image edits. Keep fixed
prop geometry, quantity, scale, material and ownership explicit in `continuity`.
Do not silently migrate an approved screenplay or discard previously paid images.

The user prefers image generation inside their current ChatGPT subscription.
Do NOT connect or call their OpenAI API, or silently substitute another paid API.
Use the conversation's built-in image generation capability within its availability.
Paid API fallback requires separate explicit user agreement. The app imports local
images without generation, automatic review, or provider API calls; optional Gemini
generation remains explicit. Do not claim subscription quotas or successful image
generation without evidence. No automatic image generation is authorized by an app fix.

The old 1,900-character clip budget below applies to legacy clips, not the new
whole-video prompt. The app preserves Kling 4.0 prompts exactly, without clip headers,
audio rewriting or truncation. Its 30,000-character file guard is an app safety bound,
not a claim about Kling's token limit.

### Kling prompt budget — 2026-10-15

The user's current Kling input truncates at 2,000 characters. Author every scene's
FINAL clipboard string within 1,900 UTF-16 code units, including `[CLIP N: title]`,
spaces, line breaks and any legacy audio normalization. Use `clipVideoText` from
`src/videoPrompt.ts` to measure the actual copy path, not just the raw prompt body.
Keep all eight headings, exact speech if any, action/cause, timing, start/end state,
body/prop ownership, support and essential restrictions. Merge redundant appearance,
environment and prohibition prose already established by the start frame. Do not cut
off the tail, remove a key event or invoke a paid model to repair an authored package.
Run `node --import tsx scripts/check-production-prompts.ts production.json` before
publishing. An over-budget prompt fails release and must be rewritten. For a prompt-only
compression, preserve the screenplay and image prompts exactly, retain the unchanged
screenplay review, and separately record three content/continuity/length review passes
bound to the revised production hash. No new footage is implied by that review.

Do not prepend a teaser, highlight replay, still card or extra one-second intro.
Start the actual story at frame one. Keep a 15-second episode at 4/4/3/4 seconds.
Do not burn an episode title or thumbnail slogan into the video. Upload titles remain
metadata. Include exact Korean dialogue captions for editing at the actual speech times;
silent-scene markers are neither displayed nor spoken. Generate clean start-frame images.

## Current creative direction: character comedy in an elastic world — 2026-10-14

This revision follows the user's rejection of the observational direction and request
to rewrite episodes 16, 17 and 18. It supersedes conflicting earlier rules about realistic
daily life, quiet behavior and small choices. Preserve previously approved episodes 11–15.

The creative promise is: small ducks take their wants very seriously in a world that can
be absurd. Familiar feelings provide an entry point, not a ceiling on events. "일상" in the
series name does not require realistic incidents, a clinic setting, a lesson, or an
ordinary ending. Fantasy, physical comedy, harmless suspense, visual transformation,
spectacle and intimate behavioral comedy are all available. Do not schedule these by a
rigid genre quota or make every episode follow the same escalation formula.

### Find an entertaining event before dividing it into shots

Pitch what is actually enjoyable to WATCH in one sentence. A situation such as a tired
commuter finding a seat is not yet an entertaining event. Identify the specific viewer
expectation, the character's worthwhile attempt and the particular result. If those
need a paragraph of interpretation, revise the premise. Pretty renders, soft lighting,
relatability labels and production polish do not provide missing comedy.

The first frame and final payoff should each be drawable as a specific, distinct image.
Each shot changes an attempt, consequence, choice, power balance or understood fact.
Do not stretch routine actions into four shots and then explain them as empathy.
A small story needs a compelling action or exchange; a spectacular story needs a readable
cause and a particular character response. Neither earns approval merely by its scale.
Earned anticipation remains valid; there is no compulsory major-change timestamp.
After removing the title, synopsis, dialogue, audio and ideal micro-expressions, the
event and its reward must still read. A moral or generic group smile is not the payoff.

### Give the cast appetites and comic agency

Cuteness comes through concentration, disproportionate effort, ambition, failed dignity,
delighted absorption, stubbornness and recovery. Preserve weight, contact and pleasing
motion during these meaningful actions. Blinks, foot adjustments and settling alone do
not turn an uninteresting premise into a film. Do not make characters perform cute
gestures for the camera without a want or object of attention.

Adults may crave a treat, compete, boast, sulk briefly, be embarrassed, play tricks or
solve a problem in an unexpected way. Likeability does not demand perfect manners.
Harmless teasing and momentary disagreement are allowed; avoid sustained cruelty,
humiliation, coerced distress, injury and medical irresponsibility.
Friendship can show through answering a challenge, joining a game, copying a friend,
changing tactics or sharing an absurd predicament. No compulsory hug, gift or lesson.
Rotate initiative and comic advantage. Do not lock Deok-i into a baby/scared role,
O-wonjang into a caretaker or incompetent doctor, or Somi into the only sensible adult.

O-wonjang remains a competent Korean medicine doctor; Somi a capable nurse; Deok-i an
adult office worker at a separate company, never clinic staff. Their jobs are context,
not compulsory exposition or a requirement to use the clinic. Preserve original anatomy,
colors, proportions and simple wings. Somi retains her original smooth head without
invented hair. Fantastical objects and transformations must not casually redesign the cast.

### Let the world change while keeping the event readable

An ordinary desire may produce an extraordinary event. Establish only the surreal rule
needed by that episode through a visible cause. No explanatory lore is necessary.
Preserve object identity, contact, screen direction and intelligible consequences.
A fantasy does not have to end as a dream or reset to mundane reality.
Do not remove a worthwhile visual event just because the series is called daily life.

Default to no dialogue and no narration. Optional deliberate nonverbal accents may
punctuate an already readable event; they must not carry missing facts or become repeated
vocal clutter. Preserve explicitly requested dialogue and its exact captions.
No generated titles, readable incidental labels or explanatory overlays.
Keep 15 seconds at 4/4/3/4 and begin the actual story at frame one.

### Production continuity and honest release

Retain the authored-package handoff, prop bible, machine-readable references and exact
prompt preservation. One dominant action per short clip can include anticipation and
follow-through. Simplify staging without deleting the event that made it worth making.
Start-frame constraints apply at time zero, not throughout motion. Intentional fantasy
transformation belongs in action/end states; do not reveal it in a preceding start still.
Give recurring props sufficient fixed capacity for the entire cast before shot one.

When generated work exists, compare the previous ACTUAL end frame and next ACTUAL start
image: pose/support, object ownership, important food or furniture, and character positions.
A clear motivated time jump can change a state; an unexplained reset cannot. Offscreen is
not missing. Repair story-breaking mismatches without demanding cosmetic regeneration.
Never describe an essential action as having occurred merely because a script intended it.

Retain the twelve-criterion editorial gate and three real revision passes below.
They are diagnostics, not a reason to grant every draft eight points. Relatable conditions
are not proof of entertainment; good manners are not chemistry; a rounded body or bodily
settling alone is not a comic performance. Clearly distinguish screenplay judgment from
observed footage and audience data. No paid generation is authorized by a writing revision.
A complete new 16–18 package must be reviewed, validated and read back before it replaces
the existing canonical production source.

## Opening and story standard: immediate interest, earned anticipation and character payoff

Updated 2026-10-08 after the supplied ladybug episode and the user's report of reposts
and new followers. This replaces the compulsory major-change-by-three-seconds rule.
Keep the opening image immediately interesting and bring change early, but judge whether
each moment earns attention instead of treating a timestamp as a universal pass/fail gate.

Frame zero must show an understandable problem, desire, incongruity or developing event.
The main character, relevant object and their relationship should read at phone size
without an introduction, captions or knowledge of previous episodes. A viewer should know
what outcome to anticipate. A pretty neutral pose or a promise of later fun is insufficient.

Two opening approaches are valid:
- Immediate event: a large reveal or consequence arrives within roughly three seconds,
  as in the supplied beam-to-UFO and cola-to-wave examples. Preserve this strength when
  it serves the story; do not delay an already effective event.
- Earned anticipation: the opening already poses a specific question and the character
  visibly attempts something with enjoyable, motivated acting. The major change may
  arrive later, as the ladybug takes off at about 4.3 seconds. The approach, timing and
  changing distance must themselves be engaging; mere preparation or idle cuteness is
  not an exception. Do not replace the old three-second deadline with a five-second one.

At the three-second review point, ask what the viewer is waiting to discover, how the
action has progressed, and what was enjoyable to watch so far. A substantial changed
state can answer those questions, but is not mandatory if the attempt already does.
Shorten or rewrite anticipation that has no concrete expectation, visible progress or
physical appeal. A camera move, repeated blink or explanatory caption cannot supply them.

Use the ladybug episode as a strong story reference: a readable catching problem, Deok-i's
earnest approach while O-wonjang peeks from behind, an airborne complication, then the
would-be catchers sheltering together inside the box while the bug remains outside.
Its useful principles are clear stakes, cute behavior during the attempt, an expectation
being overturned and an ending image that recalls the original goal. Do not copy its
bug, box, hiding, fearful roles or failure ending into every episode. A surprising
success, revealing choice or shared game can provide an equally specific payoff.

Every stage of a main action should retain the characters' appeal: commitment, short
steps, balance, retreat, recovery and the response to a friend. Preserve recognizable
faces, round proportions, original anatomy, adult agency and medical trust. Let the
same event expose distinct wants and choices. Friendship should be visible in reciprocal
behavior, not added as an unrelated hug or generic smile after the joke.

Keep consequences developing after the first change. A useful flexible arc is a legible
problem/desire, a cute self-directed attempt, a complication or changed expectation, and
a memorable character-specific outcome. Each shot must add an attempt, result, choice
or meaningful response. Vary who initiates, who responds and who benefits; do not make
every episode a frightened duo, a caretaker and child, or a compulsory reversal.
The ending should make the opening newly funny or resolve its desire in a distinctive
way. Let it read, then finish without explaining the joke or padding the completed action.

Large fantasy consequences remain welcome when causally connected to the desire or
event. Quiet sound and brief pauses are also allowed when anticipation, acting or a payoff
remains visible. Do not equate cuteness with calm inactivity, or retention with constant
large movement, explosions and fast cuts. Keep both the event and the character legible.

Retain 15 seconds and 4/4/3/4 clips unless the user changes the format. Do not add a teaser,
a repeated highlight or a title card. Start images depict the real starting state, including
mid-action where useful, while leaving the later reveal for the video. Adapt timing within
and across the existing clips to the event rather than filling each clip with preparation.

At outline, script, start-image and finished-video review, separately check:
- Does this episode turn a small want or imperfect care into a consequence with a
  character-specific payoff, rather than merely displaying cute models?
- Is the opening image immediately interesting and the problem or desire understandable?
- Until the first major change, what precise expectation, visible progress and cute action
  keep the viewer watching? Does the proposed anticipation earn its duration?
- Does the complication arise from the attempt or established situation?
- Do the responses distinguish these characters and show a reciprocal relationship?
- Does the last image/action pay off the opening and leave a reason to see them again?
Keep review notes outside the five screenplay sections and viewer-facing captions.
A planned action is not a verified animation result; scores do not waive a known weakness.

Evidence: the supplied 15-second ladybug video and an insight screenshot showed 2,299 views,
980 viewers and 17 seconds average view time. The screenshot initially showed zero follows;
the user subsequently reported reposts and new followers, without updated counts. Record
that positive follow-up rather than repeating zero as current. Do not invent counts,
attribute every new follower to this reel without attribution data, or claim a single post
proves a success formula. Treat it as a promising series reference to test across varied
stories, alongside the earlier fast-event examples. Track viewing, redistribution and
follows separately. Do not rewrite approved episode files or start paid production merely
because the writing standard changed.

## Writing method: a body worth watching

The goal is viewers who enjoy the seconds they watch, finish the short, and want to see
these particular characters again. Treat bodily appeal as a primary source of pleasure,
alongside comic events and relationships. It must be present during the action, not saved
for a smiling final pose. A sit, step or bite can enrich a scene, but does not by itself justify an episode.
Do not confuse a cute model, kind behavior or an explained personality with cute movement.

Choose a recognizable desire and a physical action that is enjoyable to watch. Develop
the outcome and the character's choice together. Make the opening still intriguing and
keep the action progressing toward an early consequence. Use an immediate event or earned
anticipation as described above; expressive movement must serve that readable situation. Do not require an unrelated catastrophe, giant prop
or fantasy spectacle just to justify a quiet episode. Also do not stretch a motionless
pose or a five-second idea into fifteen seconds. Every shot needs a new action, result,
choice or revealing response; a new crop alone is insufficient unless it reveals a fact.

Write a compact physical arc for each shot before dialogue: starting balance/contact,
one main action, where the weight goes, a short natural follow-through, and the settled
end state. This is one action with texture, not a list of extra tricks. Give approximate
timing inside the existing 4/4/3/4 clips. Keep anticipation brief and purposeful, then vary
the speed of contact and settling. Do not use constant-speed sliding, repeated bounces,
full-clip slow motion or repeated idle blinks. A short 0.3-0.5 second settle can let a pose
read without freezing the story. Avoid precision choreography the generator cannot express.

## Behavioral appeal: let a desire move the body

Start from what the character wants right now, not a list of cute gestures. Physical
charm should look incidental to getting comfortable, playing, investigating, eating or
staying close. The character is occupied by a real object or friend, not performing for
the audience. Keep adult agency, each character's original anatomy and recognizable personality;
borrowing the observational appeal of an animal video does not turn the cast into pets.

Before directing a movement, identify its visible trigger, object of attention, small
choice and changed situation. Let eyes/head notice, the body commit, and weight settle
with a slight natural lag where appropriate. Do not synchronize every body part or
every character. Choose one main movement and one essential follow-through. A sit does
not also need foot paddling, cheek inflation, a wiggle, a blink and a squeal. Do not make
every shot a showcase for a different body part. Retain stillness that expresses focused
anticipation or comfort, but do not pad an otherwise finished action to fill a clip.

Each episode needs a different behavioral pleasure and a developing reason to watch.
For example, seeking a particular friend's side, becoming absorbed in fragile play, or
negotiating sleep and a snack offer different actions and choices. These are examples,
not compulsory plots. Do not replace all action comedy with cuddles, all fantasy with
quiet domestic scenes, or all endings with giving food. Keep a surreal device when it
actually improves the visible behavior or payoff; remove it when it merely supplies an
explanation. Ordinary behavior still needs an immediate attraction and an earned ending.

Test the outline and each shot without dialogue: can a viewer tell what this character
is trying to do, notice the small complication, and enjoy the chosen response? The
movement must change something or reveal a preference; tactile choreography alone does
not constitute four story beats. A quiet ending can be a voluntary return, a different
way of playing, or a revealing compromise. Do not explain such a choice in a final line.

Chemistry is reciprocal attention and adjustment, not compulsory touching. A companion
notices what the other actually wants and makes a specific choice in response. Leave
room for different physical rhythms: Deok-i commits eagerly and chooses his own place;
O-wonjang can become unexpectedly absorbed and earnestly try again; Somi's economical
composure may yield to comfort or appetite. They need not smile or speak together.
Do not infantilize Deok-i, make Somi a caregiver in every story, or equate the doctor's
leisure enthusiasm with clinical incompetence.

In the body/character revision pass, remove any attractive-sounding micro-action that
has no motive or cannot be seen in the chosen phone-size frame. In the production pass,
protect the primary action and eliminate extra prop preparation from the three-second
shot; show its setup earlier or start after an intelligible cut. Preserve who is awake,
who initiates contact, who holds a prop and what supports each body. Script-only review
does not verify animation quality, animal-like spontaneity or audience retention.

## Physical appeal and cinematography

Preserve the original round proportions, bills, wings, short legs, costumes and surfaces.
Use posture, balance, contact shadows, cushions and cloth to communicate soft weight.
Do not inflate cheeks or buttocks, stretch bodies like rubber, add fingers or a new tail,
or redesign the characters. A little natural give must retain the reference identity.

- Sitting: show the round lower body lowering onto its support, a small yielding contact,
  the upper body settling after it, and the short feet finding their resting position.
  The cushion or hem may settle slightly later. Show the feet and contact surface when
  those create the appeal; a face-only close-up cannot demonstrate a satisfying sit.
- Walking: show weight passing between the short feet and the round torso following it.
  A small waddle comes from the step, not an isolated hip dance or a rigid model sliding.
- Eating: show the small wings holding food close, one bite and a brief bodily response
  to taste or temperature. A relaxed shoulder or one small foot adjustment can say more
  than a giant smile. Do not add many finger operations, busy chewing or speech-like lips.
- Resting, hiding and leaning: show the body lowering its center, finding support and
  allowing weight to settle. Keep each separate body legible during contact. Do not fuse
  silhouettes, conceal all appealing movement under props, or make touching mandatory.

These examples are a vocabulary, not compulsory moves repeated in every clip. Choose one
dominant physical quality appropriate to the event. Body appeal need not always mean small
or slow motion: an eager hop can work if its landing and balance remain readable.

Choose camera height and angle to show the action's appealing silhouette and contact:
a low three-quarter side/rear view can reveal a round sit; a side view can show a waddle;
a medium shot can keep food, small wings and feet together. Retain a readable face when
its response matters. Do not isolate body parts for their own sake or use rear views in
every shot. At phone size, the action must be visible without searching a vast empty room.
Use scale, depth, light and color to clarify the action. Choose the setting and scale that best express the event. Ordinary sets and spectacle
are both valid; neither compensates for a missing event.

The start image establishes the actual pre-action pose and supports the planned movement.
Do not draw the already seated pose, wrapped blanket or completed collision before the
video acts it out. English video ACTION must retain the written weight transfer, cadence
and essential follow-through. Do not reduce the source to "sits cutely" or "walks happily".
Do not move a later emotional or physical result into the start-frame prompt.

## Character, relationship and payoff

Use physical habits to distinguish the cast while preserving adult agency and friendship.
Deok-i can approach with earnest confidence, sit decisively and choose a friend's side;
his little pauses and body adjustments reveal wants without making him a helpless baby.
O-wonjang's greater weight and eager commitment can make a sit, helpful lean or protective
crouch unusually earnest. His coat can follow his movement; he is not a stiff lecturer.
Somi uses economical movement, but a desired breeze, comfort or treat can gradually pull
her whole body out of composure. She does not need a big smile to be appealing.
Vary these habits with the situation rather than locking each character to one gesture.

Give each appearing character a desire and a concrete choice. Do not require all four
in each episode. Rotate who initiates, helps, overdoes something and receives care.
Care can be visible in leaving room, staying beside a frightened friend or accepting a
friend's preferred distance. A hug or gift is not automatically chemistry, and every
episode must not end with a group cuddle. Keep the comic or emotional consequence.
Do not use sustained bullying, injury or clinical mistakes to generate reactions.
Harmless rivalry, mischief, brief fear and embarrassment can coexist with mutual care.

Build four connected beats, but vary their structure and ending. A final choice can be
rewarding without a spectacular twist. The ending should reinterpret an earlier action,
complete a desire or make a particular relationship felt. Do not explain the visible joke,
append a moral, force a generic group smile or start another subplot after the payoff.
Dialogue supports the physical story; it does not compensate for inert acting.
If a surreal rule is used, establish it visually before relying on it. No compulsory myth,
giant prop, clinic location or fantasy-to-reality formula. Each episode works on its own.

## Editorial gate before production

Aim for 9/10 on each of twelve criteria: (1) first-frame hook, (2) immediate comprehension,
(3) relatable recognition and meaningful surprise, (4) a reason to keep watching in every shot, (5) ending reward,
(6) distinct character choices, (7) relationship chemistry, (8) bodily/movement appeal,
(9) likability without bullying, (10) clear image/dialogue/caption communication,
(11) feasible timing and continuity, and (12) a character-specific reason to return.
The minimum is 8/10 in EVERY criterion. A high average does not erase a weakness.
For criterion 8, identify an actual movement, the revealing angle, its weight/contact and
timing. Kindness, a cute face or a soft adjective alone is not evidence of a pass.
These scores are editorial judgments, not measured retention, views or subscriber growth.
Never raise a score to meet the target, invent tiny meaningful score differences, or claim
that ungenerated footage has passed. Fix the weak action or premise; disclose unresolved
weaknesses instead of guaranteeing production quality or audience response.

## Judge the likely finished film before releasing a script

All twelve scores must judge the likely finished 15-second film using the existing
production samples as the baseline, NOT ideal screenplay intent or imagined perfect
animation. Reopen a previously passing review when this lens or the source changes.
Read actual sample footage or clearly identify which prior observations support the
assumption. Do not claim to have watched new footage, assessed audio, or measured success
when only images or sampled frames are available.

At outline, individual-shot and final-package stages, ask what a first-time phone viewer
will actually SEE at the current level of staging, body animation, prop stability and
editing. Record the decisive visible frame, whether the story survives imperfect micro-
expressions/contact/cloth, and whether the cause and payoff remain clear with sound off.
A beautifully worded intention earns no credit unless a legible action conveys it. Do
not assume a tiny glance, a few-centimeter gap, precise catch, cloth squash, or obscured
face will carry the entire joke or relationship. Increase meaningful pose/distance and
framing contrast, expose the body, or use an intelligible cut; do not automatically add
spectacle or remove the desired cute movement. Preserve already strong visible beats.

If a projected finished-film criterion is below 8 or has a known unresolved defect,
revise immediately and re-evaluate all affected criteria and connections before release.
Do not wait for the user to ask for evaluation or another rewrite. Do not increase scores
to satisfy the threshold. These remain subjective projections, not finished-film results,
retention estimates or performance guarantees. When a baseline is unavailable, state that
assumption in the review rather than fabricate observed capability.

Review is a release gate, not a paragraph added after calling work complete.
Before drafting, identify the latest user constraints and the specific unresolved failures
of the previous version. Do not treat a format fix, another model, or continuity repair
as evidence that an unchanged story has become more entertaining.

Run three real revision passes on the entire package, fixing findings before the next pass:
1. Story: state the opening still's attraction, the visible attempt and specific expectation
   before the first major change, then each shot's new information/cause and the final payoff. Challenge the strongest reason to swipe away. An ordinary nod, preparation
   without a visible event, repeated pursuit, or an ending that merely confirms the setup
   requires an actual reason to watch or a rewrite. Do not force a twist into every quiet scene.
2. Body and character: isolate two seconds of the key movement. Specify the desire,
   silhouette, revealing angle, contact/weight, timing and one natural settling reaction.
   Kindness and facial expressions do not substitute for bodily appeal. Check who chooses,
   who responds and who benefits. Remove arbitrary micro-actions and repeated caretaker roles.
3. Production: check 4/4/3/4 timing, anatomy, supports, prop capacity, cause across omitted
   motion, start/end states, references, one speaker, exact captions and non-vocal silent audio.
   Preserve essential acting when simplifying. Use the app parser on the actual final text.

Then re-read the finished draft as a first-time viewer, without its planning explanation.
If the final critique still says the hook is weak, the payoff is missing, a shot only repeats
another, or the appeal depends entirely on hypothetical excellent animation, that is an
OPEN ISSUE: revise before publication. Do not assign 8 merely to close the issue. A high
average never cancels a low criterion. Record remaining implementation uncertainty honestly;
unknown generated performance is distinct from a known script defect.

Keep one version-specific review outside the five screenplay sections. It records all
12 criteria with source quotes, reasons and limitations, four shot changes/causes/watch
reasons, three revision passes, the strongest final objection and how it was addressed.
Use `scripts/check-weekly-review.mjs` before saving a package under its final name:

    node scripts/check-weekly-review.mjs screenplay.txt review.json

The JSON schema and a worked example are in
`docs/editorial-reviews/2026-10-02-10-12-screen/review.json`. A SHA-256 fingerprint binds the review
to the exact normalized source; subsequent story edits invalidate it. Missing evidence,
any score below 8, open issues, stale review, wrong duration/reference or mismatched captions
must stop release. Fix the source and re-review instead of deleting the failure. This
mechanical check verifies completeness and consistency, NOT humor or audience performance.

Archive the reviewed source/review beside each other with a unique revision path; the
existing Google Doc remains the authoritative production document. After saving, read the
Doc back and run the same check on the saved text. Confirm all five sections, 12 scenes,
reference metadata and parent folder. Report complete only after readback succeeds. A
process or instruction update is not itself proof that a screenplay passed the gate.

Preserve the existing schedule and approved future premises. Do not start paid generation
or recommend remaking a completed video from tiny subjective score differences. A proposed
remake must identify a concrete visible improvement and its cost; production needs its own
authorization. Do not restart episodes outside scope or silently rewrite approved stories
when converting them to image/video prompts. Report the changed result briefly, with one
canonical version. Do not ask the user to discover defects already identified in review.


## Duration and feasible action

15 seconds = exactly four clips of 4, 4, 3, 4 seconds.
5 seconds = exactly two clips of 2, 3 seconds.
Each clip has one dominant action or reveal and room for its consequence.
A large, visually legible action can be simpler to generate than many tiny hand operations.
Brief anticipation, movement and reaction may occur within a clip. Do not freeze emotion
or physical state for the entire clip merely to reduce generation risk.
If an interaction needs too many sequential contacts, split it across the available cuts.
Show the cause before an implied result; use a match cut, sound bridge or established
object to make the connection readable. Do not replace a missing cause with exposition.
Do not require a precise catch, a long multi-object chain reaction, or tiny readable digits.
Do not describe model success or failure as guaranteed.

Write each image as the actual START of its clip. A running character can start mid-stride;
there is no requirement to begin neutral and upright. Reserve the action's later outcome
for the video. At a purposeful time jump, state what happened between shots and why the
new state is understandable. Do not show an entire future sequence in one image.

Before describing shots, establish fixed dimensions and capacity for recurring story
props using the needs of the ENTIRE episode. Give distinct moving parts distinct names,
positions and attachment/hinge directions. Keep a window, entry door, folding wall and
roof separate when such parts exist in the story. Never invent holes or resize a prop
between shots to fit the cast. Record each relevant part's start and end state. Cropping
or occlusion changes visibility, not the object's physical structure. The converter
builds a shared prop bible and separate per-shot states, compiles start images without
future actions, and reviews the compiled prompts against the original screenplay.

## Nooni joins the cast — 2026-10-24

[NOONI / 눈이 — characterId: nooni]
An independent adult owner of a dairy dessert shop using Hokkaido-sourced dairy products. Especially loves milk ice cream. Relaxed, warm and friendly, competent at running the shop; quietly enthusiastic about dairy desserts. Has adult agency and an equal, reciprocal friendship with O-wonjang, Somi and Deok-i; never a baby, pet, clinic employee or medical professional. Strong in cold and snow, extremely vulnerable to heat. These traits can motivate behavior but do not force every story to be about heat or dairy, stubbornness or perfectionism.
Speaks natural Korean only, never Japanese or a Japanese accent. Shima-enaga is the visual motif; Hokkaido describes the ingredients, not a confirmed birthplace, nationality or residence. Gender and fixed voice ID are not established. Use Nooni as the English name. Retain the usual wordless sitcom default unless dialogue is explicitly requested; Nooni's dialogue is character speech, never narration TTS.
Nooni: a shima-enaga-inspired long-tailed bird, NOT a duck. Keep the ORIGINAL large round white head and plump white body, small dark oval eyes, tiny dark pointed beak, pale peach cheeks, short light-blue scarf with its ends in front, gray-brown back/shoulders, sculpted dark-gray and white layered wing markings, dark bird feet, and long narrow dark tail with white edges. Preserve the original wing layers and tail; never flatten them into duck wings. No duck bill, webbed feet, fingers, teeth, human lips, hair, eyebrows or eyelashes. Match the same matte 3D toy style as the other characters.
Use all three originals: src/nooni 01.png (front), src/nooni 02.png (side), src/nooni 03.png (back). Nooni is an available cast member, not compulsory in every scene. Do not change approved existing episodes.

The original three ducks keep their own anatomy rules. Nooni's original sculpted
wing layers and long tail are required design, not forbidden added feathers.
All four are available; choose the cast needed for each story. Ordinary Korean
weather phrases such as "눈이 내린다" or "눈이 쌓인다" do not name Nooni.

## Characters and identity

### Original-face check — 2026-10-17

Compare each generated face at close view with that character's original sheets.
Do not accept added eyelids, eyelid creases, eyebrows, eyelashes, eye sockets,
eye whites or hair absent from the originals as expression or improved cuteness.
Retain the character's own eye shape/color, bill, glasses and head silhouette.
Treat a visible new facial feature as an identity defect and correct it before release.
For Gemini generation, attach the actual original front/side/back image bytes for
every named character; filenames or a previous generated still are not substitutes.
Recognize Dr.O as O-wonjang and 소미 as Somi. Stop before a provider call if a
required original cannot be loaded. Apply the same originals to review and repair.

Use the original front/side/back character references:
- O-wonjang: an anthropomorphic pale cream duck with round glasses, a light-blue shirt
  and white doctor's coat; a capable, caring Korean medicine doctor with ordinary
  weaknesses such as snacks, enthusiasm and hobbies.
- Deok-i: an adult office-worker at a separate company, not clinic staff; yellow with his own cheek color and simple wings.
  Preserve his reference proportions. He can be clever, clumsy, determined or helpful.
- Somi: pale cream duck, off-white nurse top and navy pants, deadpan; capable but with her
  own desires. Expression contrast does not require her to smile at every ending.

Retain each character's original silhouette, face, bill, colors and simple rounded wing
tips. Pose the existing wings; do not invent fingers, teeth, extra eyes or human anatomy.
A bill may open naturally for speech, eating or a visible reaction.
Change apparent on-screen size through distance, lens and surroundings while retaining
identity. Intentional fantasy costumes may be simple overlays when explicitly scripted;
do not replace the recognizable character with a human.

## Places and continuity

Settings may include homes, streets, ships, mountains, outer space and visual metaphors.
The clinic, when actually shown, uses the supplied warm wood/cream interiors.
Warm clinic lighting is not a global restriction on a stormy ocean or a cosmic scene.

For the SAME physical set, retain architecture, landmarks and prop design. The current
shot controls crop, camera angle, gaze, pose, light/weather state and scripted object state.
A close-up need not include both characters or all furniture. A landscape may keep the
protagonist small. A static camera is static within that shot, not across all four clips.
For a new location, time jump or fantasy/reality transition, describe the new setting.
Do not copy the previous room or require identical lighting across different visual worlds.
Make fantasy/reality match cuts recognizable through pose, object shape or screen direction.

## Medical trust

O-wonjang is dependable with patients, treatment and medicines. Everyday comedy must not
imply incompetent treatment or unsafe care. Do not use treatment/medicine-induced
mutations, unknown drug experiments, misdiagnosis, dosing errors, poor hygiene,
patient mockery, privacy violations or magical treatment effects as jokes.
Surreal non-medical daily-life metaphors are allowed. Do not ridicule a patient's body.

## Dialogue, text and audio

Default to no dialogue/narration as specified in the current series premise. For explicitly
requested dialogue, use one speaker per clip and brief natural Korean. Preserve supplied lines and silent clips.
Speech and edited subtitles match exactly. Captions and UI labels are not spoken lines.
Silent clips use appropriate environmental/action sounds and, if wanted, instrumental
music only: no invented speech, narration, singing or off-screen voices. The latest
series premise permits explicitly scripted brief nonverbal accents; those are optional,
not explanatory dialogue and not automatic captions.
Do not animate speech-like mouth movement in a silent character; visual reactions remain.
Leave incidental labels/screens blank. Do not depend on generated Korean text or numbers.
Provide captions for later editing; do not burn captions into generated images.
For weekly scripts preserve their Korean titles, numbering and five supplied hashtags.
Do not add emoji or a compulsory clinic advertising end card to the story.

## Planning output

Produce a coherent Korean storyboard with exactly the required clip durations.
For every clip specify:
- Physical location and whether this is continuous, a reframe, or a new scene.
- Shot size, angle, visible subject and meaningful foreground/background depth.
- Starting pose and object state, one main action/reveal, and the resulting state.
- For clip one, an intriguing opening still, the visible attempt or early event, and the specific expectation that makes its timing engaging; state when the first major change occurs without a compulsory three-second cutoff.
- Physical acting and approximate in-clip timing: weight/contact, one essential follow-through, and an angle that makes them visible.
- Exact speaker/line or silence, supporting sound and any motivated transition.

Produce one English start-frame prompt and one English video prompt per clip.
The video headings are REFERENCE INSTRUCTION, OUTPUT SPECS, CINEMATOGRAPHY,
ENVIRONMENT, ACTION, DIALOGUE, AUDIO and STRICT RULES, separated by actual newlines.
Use O-wonjang, Deok-i, Somi and Nooni as English names. Maintain the provided dialogue in Korean.
Avoid contradictory locks and long generic prohibition lists. Keep directions specific
to the shot and do not erase the screenplay's spectacle to make generation easier.

## Machine-readable scene references

For every newly planned clip use the exact Korean header `[장면 N (D초)]` with
Korean seconds, for example `[장면 1 (4초)]`, and directly below it one JSON line:
`referencePlan: {"background":null,"props":[]}`.
Use a previous 1-based scene number for background when that image establishes
this physical set. Use null for a new set. Each prop source is
`{"scene":2,"objects":["치킨 상자","치킨"]}` inside props. Use only earlier scenes
in the SAME episode that actually show these objects; no self/future references.
Use [] for no props; include the line in ALL clips. Max 3 source entries, at most
8 named objects per source. Combine objects from the same source into one entry.
Choose a wide set anchor for backgrounds and the actual introduction image for
props, not simply the immediately preceding close-up. Example scene 4 can use
background 1, house from scene 1, and fan from scene 3. Preserve original designs
but apply the current shot's camera, acting and STARTING object state. Earlier
still images are not video end frames. Do not copy their poses or obsolete states.
See docs/scene-references.md for the complete contract. These production lines
are not subtitles, dialogue or visible text in the generated images/videos.
