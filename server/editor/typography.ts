import { readFileSync } from 'node:fs';
import path from 'node:path';

// Read only the bundled font's BMP cmap (format 4) and horizontal advances once.
// ASS sizes this font against its 1160-unit ascent/descent, not its 1000-unit em.
let advances: Map<string, number> | undefined;
function fontAdvances() {
  if (advances) return advances;
  const font = readFileSync(path.resolve('src/KyoboHandwriting2024psw.ttf'));
  const u16 = (offset: number) => font.readUInt16BE(offset);
  const tables: Record<string, number> = {};
  for (let i = 0; i < u16(4); i++) {
    const offset = 12 + i * 16;
    tables[font.toString('ascii', offset, offset + 4)] = font.readUInt32BE(offset + 8);
  }
  let cmap = 0;
  for (let i = 0; i < u16(tables.cmap + 2); i++) {
    const offset = tables.cmap + font.readUInt32BE(tables.cmap + 8 + i * 8);
    if (u16(offset) === 4) { cmap = offset; break; }
  }
  if (!cmap) throw Error('자막 폰트의 글자 폭 정보를 읽을 수 없습니다.');
  const height = font.readInt16BE(tables.hhea + 4) - font.readInt16BE(tables.hhea + 6);
  const metrics = u16(tables.hhea + 34);
  const count = u16(cmap + 6) / 2, end = cmap + 14, start = end + count * 2 + 2;
  const delta = start + count * 2, ranges = delta + count * 2;
  const widths = new Map<string, number>();
  for (let i = 0; i < count; i++) {
    for (let code = u16(start + i * 2); code <= u16(end + i * 2) && code < 0xffff; code++) {
      const range = u16(ranges + i * 2);
      let glyph = range ? u16(ranges + i * 2 + range + 2 * (code - u16(start + i * 2))) : code;
      if (!range || glyph) glyph = (glyph + u16(delta + i * 2)) & 0xffff;
      if (glyph) widths.set(String.fromCharCode(code), u16(tables.hmtx + Math.min(glyph, metrics - 1) * 4) / height);
    }
  }
  return advances = widths;
}

export function fitVideoText(text: string, maxHeight: number) {
  const widths = fontAdvances();
  const measure = (s: string) => Array.from(s).reduce((sum, c) => sum + (widths.get(c) ?? 1), 0);
  // 1080 × 75% = 810px, including the existing 3px outline on each side.
  const width = 804, preferredSize = 100;
  const lines: string[] = [];
  for (const line of text.split('\n')) {
    let row = '';
    for (const word of line.trim().split(/\s+/)) {
      const joined = row ? `${row} ${word}` : word;
      if (measure(joined) * preferredSize <= width) { row = joined; continue; }
      if (row) lines.push(row);
      row = '';
      for (const char of word) {
        if (row && measure(row + char) * preferredSize > width) { lines.push(row); row = ''; }
        row += char;
      }
    }
    if (row) lines.push(row);
  }
  const longest = Math.max(1, ...lines.map(measure));
  // Cap tiny utterances and very tall blocks; never stretch glyphs horizontally.
  const size = Math.max(1, Math.floor(Math.min(150, width / longest, maxHeight / Math.max(1, lines.length))));
  return { text: lines.join('\\N'), size };
}
