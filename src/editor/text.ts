// Shared by import, editing and ASS rendering. Bump when the rendered text policy changes.
export const TEXT_POLICY_VERSION = 1;

// These ranges are present in the bundled Kyobo Handwriting 2024 font's cmap.
// Keep ordinary language and punctuation, not emoji or decorative glyphs.
const letters = /[A-Za-z0-9가-힣ㄱ-ㆎぁ-んァ-ヶΑ-ΡΣ-Ωα-ρσ-ωЁА-яё]/u;
const punctuation = new Set(Array.from(' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~·…‘’“”—–₩€¥£¢°℃℉±×÷‰「」『』【】〈〉《》'));
const replacements: Record<string, string> = { '→': '->', '←': '<-', '↔': '<->', '≤': '<=', '≥': '>=', '≠': '!=', '−': '-', '。': '.', '、': ',', '〜': '~', '～': '~' };

export function cleanVideoText(value: string): string {
  let text = value.normalize('NFC').replace(/\r\n?/g, '\n');
  // Preserve the number in a keycap (1️⃣), but remove the enclosing mark.
  text = text.replace(/([0-9#*])\uFE0F?\u20E3/g, '$1')
    .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[→←↔≤≥≠−。、〜～]/g, c => replacements[c])
    .replace(/\p{Extended_Pictographic}(?:[\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]|\u200D\p{Extended_Pictographic})*/gu, ' ')
    .replace(/\p{Regional_Indicator}{1,2}/gu, ' ')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\u20E3\u{E0000}-\u{E007F}\u{1F3FB}-\u{1F3FF}]/gu, '');
  return Array.from(text, c => c === '\n' ? c : /\s/u.test(c) ? ' ' : letters.test(c) || punctuation.has(c) ? c : ' ')
    .join('').split('\n').map(line => line.replace(/ +/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
