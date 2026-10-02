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
