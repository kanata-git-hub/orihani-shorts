// Weekly captions already contain hashtags; free-form plans may supply them separately.
// Keep prose (including inline hashtags) intact and collect standalone tag lines once.
export function prepareSocialCaption(caption: unknown, hashtags: unknown = []) {
  const source = typeof caption === 'string' ? caption.replace(/\\n/g, '\n') : '';
  const tagPattern = /#[\p{L}\p{M}\p{N}_]+/gu;
  const collected: string[] = [];
  const body = source.split(/\r?\n/).filter(line => {
    const tags = line.match(tagPattern);
    if (!tags || line.replace(tagPattern, '').trim()) return true;
    collected.push(...tags.map(tag => tag.slice(1)));
    return false;
  }).join('\n').trim();
  if (Array.isArray(hashtags)) {
    for (const tag of hashtags) {
      if (typeof tag !== 'string') continue;
      const value = tag.trim().replace(/^#+/, '');
      if (/^[\p{L}\p{M}\p{N}_]+$/u.test(value)) collected.push(value);
    }
  }
  const key = (tag: string) => tag.normalize('NFC').toLowerCase();
  // A hashtag used in the sentence does not need repeating in the tag list.
  const seen = new Set(Array.from(body.matchAll(/(?:^|\s)#([\p{L}\p{M}\p{N}_]+)/gu), match => key(match[1])));
  const tags = collected.filter(tag => {
    const id = key(tag);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const text = [body, tags.map(tag => `#${tag}`).join(' ')].filter(Boolean).join('\n\n');
  return { body, hashtags: tags, text };
}

const cleanTitle = (value: unknown) => typeof value === 'string'
  ? value.trim().replace(/^\[에피소드\s*\d+\]\s*/, '') : '';
const titleKey = (value: string) => cleanTitle(value)
  .replace(/\s*\(하찮은 오리 일상\)\s*$/, '')
  .replace(/^(?:번외\s*\d+|\[번외\])\s*/, '번외 ')
  .replace(/\s+/g, ' ').normalize('NFC');

// Every preview and copy button uses the same title/body/tag composition.
// Prefer the plan's prose; older records can fall back to their linked screenplay.
export function prepareReelsCaption(
  overview: { title?: unknown; instagramCaption?: unknown; hashtags?: unknown },
  episode?: { title?: unknown; caption?: unknown } | null,
) {
  const title = cleanTitle(overview.title) || cleanTitle(episode?.title);
  const source = typeof overview.instagramCaption === 'string' && overview.instagramCaption.trim()
    ? overview.instagramCaption : episode?.caption;
  const caption = prepareSocialCaption(source, overview.hashtags);
  let prose = caption.body;
  if (title) {
    const lines = prose.split('\n');
    // Only consume a standalone leading title, never a sentence mentioning it.
    while (lines.length && titleKey(lines[0]) === titleKey(title)) {
      lines.shift();
      while (lines.length && !lines[0].trim()) lines.shift();
    }
    prose = lines.join('\n').trim();
  }
  const body = [title, prose].filter(Boolean).join('\n\n');
  return { ...prepareSocialCaption(body, caption.hashtags), title };
}
