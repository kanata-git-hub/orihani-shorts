import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// This checks a version-specific editorial review, not whether a film is funny.
export const criteria = [
  'hook', 'comprehension', 'relatableSurprise', 'shotProgression', 'payoff',
  'characterAgency', 'chemistry', 'physicalAppeal', 'likability',
  'communication', 'feasibility', 'returnAppeal',
];
const labels = ['시나리오', '한글 대사 및 화면 자막', '영어 자막', '제목 및 해시태그', '썸네일 추천 문구'];
const durations = [4, 4, 3, 4];
const times = ['0~4초', '4~8초', '8~11초', '11~15초'];
export const normalize = text => text.replace(/\r\n?/g, '\n').trimEnd() + '\n';
export const fingerprint = text => createHash('sha256').update(normalize(text)).digest('hex');

export function validateWeeklyReview(text, review) {
  const errors = [];
  const require = (test, message) => { if (!test) errors.push(message); };
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const source = normalize(text);
  require(review?.version === 1, 'Unsupported review version.');
  require(review?.sourceSha256 === fingerprint(source), 'The screenplay changed after review; review this exact revision again.');
  require(review?.scope === 'screenplay-only', 'Distinguish screenplay review from generated footage and audience results.');
  require(Array.isArray(review?.openIssues) && review.openIssues.length === 0, 'Unresolved issues prevent release.');
  const heads = [...source.matchAll(/^\[에피소드 (\d+)\] (\d+)화 ([^\n]+) \(하찮은 오리 일상\)$/gm)];
  require(heads.length === 3, 'A package must contain exactly three episodes.');
  require((source.match(/^\[에피소드 /gm) || []).length === heads.length, 'Malformed episode heading.');
  const reviews = review?.episodes || [];
  require(reviews.length === 3, 'Review all three episodes.');
  require(new Set(reviews.map(r => r.number)).size === 3, 'Duplicate episode review.');
  heads.forEach((head, index) => {
    const number = Number(head[1]);
    const prefix = `Episode ${number}: `;
    const body = source.slice(head.index + head[0].length, heads[index + 1]?.index ?? source.length);
    require(head[1] === head[2], prefix + 'Episode numbers disagree.');
    if (index) require(number === Number(heads[index - 1][1]) + 1, prefix + 'Episode numbers must be consecutive.');
    const marks = [...body.matchAll(/^([1-5])\. ([^\n]+)$/gm)];
    require(marks.length === 5 && marks.every((m, i) => Number(m[1]) === i + 1 && m[2] === labels[i]), prefix + 'Missing or reordered required section.');
    if (marks.length !== 5) return;
    const sections = marks.map((m, i) => body.slice(m.index + m[0].length, marks[i + 1]?.index ?? body.length).trim());
    const shots = [...sections[0].matchAll(/^\[장면 (\d+) \((\d+)초\)\]$/gm)];
    require(shots.length === 4 && shots.every((m, i) => Number(m[1]) === i + 1 && Number(m[2]) === durations[i]), prefix + 'Expected 4/4/3/4 seconds.');
    require((sections[0].match(/^referencePlan:/gm) || []).length === 4, prefix + 'Every shot needs exactly one reference plan.');
    const captionShots = [...sections[1].matchAll(/^\[장면 (\d+) \| ([^\n]+)\]$/gm)];
    const englishShots = [...sections[2].matchAll(/^\[장면 (\d+) \| ([^\n]+)\]$/gm)];
    for (const collection of [captionShots, englishShots]) require(collection.length === 4 && collection.every((m, i) => Number(m[1]) === i + 1 && m[2] === times[i]), prefix + 'Caption timing mismatch.');
    shots.forEach((shot, i) => {
      const chunk = sections[0].slice(shot.index + shot[0].length, shots[i + 1]?.index ?? sections[0].length).trim();
      require(chunk.startsWith('referencePlan: '), prefix + `Shot ${i + 1} needs a reference plan immediately after its heading.`);
      try {
        const plan = JSON.parse(chunk.split('\n')[0].slice('referencePlan: '.length));
        const earlier = n => Number.isInteger(n) && n >= 1 && n <= i;
        require(plan.background === null || earlier(plan.background), prefix + 'Background reference must point backward.');
        require(Array.isArray(plan.props) && plan.props.length <= 3 && plan.props.every(p => earlier(p.scene) && Array.isArray(p.objects) && p.objects.length >= 1 && p.objects.length <= 8 && p.objects.every(x => nonempty(x) && x.length <= 120)), prefix + 'Invalid prop reference.');
      } catch { require(false, prefix + 'Invalid reference JSON.'); }
      for (const label of ['장소와 연결', '구도', '시작 상태', '핵심 행동', '몸짓과 박자', '끝 상태', '화자', '음향']) require(new RegExp(`^${label}: .+`, 'm').test(chunk), prefix + `Shot ${i + 1} lacks ${label}.`);
      const caption = captionShots[i];
      const english = englishShots[i];
      if (!caption || !english) return;
      const ko = sections[1].slice(caption.index + caption[0].length, captionShots[i + 1]?.index ?? sections[1].length).trim();
      const en = sections[2].slice(english.index + english[0].length, englishShots[i + 1]?.index ?? sections[2].length).trim();
      const lines = [...ko.matchAll(/^(오원장|덕이|소미) 대사: (.+)$/gm)];
      const subtitles = [...ko.matchAll(/^화면 자막: (.+)$/gm)];
      require(subtitles.length === 1, prefix + 'Exactly one caption per shot.');
      if (lines.length === 0) {
        require(ko.split('\n').includes('(무대사)') && subtitles[0]?.[1] === '(무대사)' && /화자: 없음\. \(무대사\)/.test(chunk) && !/대사:/.test(chunk), prefix + 'Silent shot markers disagree.');
        require(en === '(No dialogue)', prefix + 'Silent English marker missing.');
      } else {
        require(lines.length === 1 && subtitles[0]?.[1] === lines[0][2], prefix + 'Speaker/dialogue/caption mismatch.');
        require(chunk.includes(`화자: ${lines[0][1]}. ${lines[0][1]} 대사: ${lines[0][2]}`), prefix + 'Scenario dialogue differs from caption script.');
        require(nonempty(en) && en !== '(No dialogue)', prefix + 'English dialogue missing.');
      }
    });
    const hashtags = sections[3].match(/#[^\s#]+/g) || [];
    require(hashtags.length === 5 && ['#하찮은오리일상', '#오원장', '#애니메이션', '#유머'].every(t => hashtags.includes(t)), prefix + 'Expected five hashtags.');
    require(sections[3].startsWith(`${number}화 ${head[3]} (하찮은 오리 일상)\n`) && sections[4] === `${number}화 ${head[3]}`, prefix + 'Title/thumbnail disagreement.');
    const r = reviews.find(e => e.number === number);
    require(!!r, prefix + 'Missing editorial review.');
    if (!r) return;
    require(Array.isArray(r.openIssues) && r.openIssues.length === 0, prefix + 'Unresolved editorial issue.');
    const grades = r.criteria || [];
    require(grades.length === 12 && new Set(grades.map(g => g.id)).size === 12 && criteria.every(id => grades.some(g => g.id === id)), prefix + 'Review all twelve distinct criteria.');
    for (const g of grades) {
      require(Number.isFinite(g.score) && g.score >= 8 && g.score <= 10, prefix + `${g.id} is below the release threshold or invalid.`);
      require(nonempty(g.evidence) && nonempty(g.limit) && nonempty(g.quote) && sections[0].includes(g.quote), prefix + `${g.id} needs source evidence and an honest limitation.`);
    }
    require(Array.isArray(r.shots) && r.shots.length === 4 && r.shots.every((s, i) => s.number === i + 1 && ['newInformation', 'cause', 'watchReason', 'quote'].every(k => nonempty(s[k])) && sections[0].includes(s.quote)), prefix + 'Review change/cause/watch reason for every shot.');
    require(Array.isArray(r.passes) && r.passes.length === 3 && r.passes.every((p, i) => p.stage === ['story', 'body-character', 'production'][i] && ['problem', 'change', 'recheck'].every(k => nonempty(p[k]))), prefix + 'Three actual revision passes are required.');
    require(nonempty(r.strongestObjection) && nonempty(r.response), prefix + 'Challenge the final draft before release.');
  });
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [scriptPath, reviewPath] = process.argv.slice(2);
  if (!scriptPath || !reviewPath) { console.error('Usage: node check-weekly-review.mjs screenplay.txt review.json'); process.exitCode = 2; }
  else {
    try {
      const issues = validateWeeklyReview(readFileSync(scriptPath, 'utf8'), JSON.parse(readFileSync(reviewPath, 'utf8')));
      if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
      else console.log('PASS: package format and revision-specific review. Story quality remains an editorial judgment; footage and audience performance are untested.');
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
