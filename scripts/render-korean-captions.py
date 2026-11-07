"""Local ASS preparation for the approved full-frame Korean caption preset.

Two passes let the caller run FFmpeg with its existing timeout/abort controls.
The measured visible ink (not CSS or font ascent) determines the balanced margin.
"""
from pathlib import Path
import json
import sys
from PIL import Image, ImageFont

HEADER = r'''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Head,카페24 써라운드,88,&H00EFF9FF,&H00EFF9FF,&H0006193C,&H90000000,-1,0,0,0,100,100,0,0,1,4,2,8,60,60,0,1
Style: Subhead,카페24 써라운드,90,&H006AD9FF,&H006AD9FF,&H0006193C,&H90000000,-1,0,0,0,100,100,0,0,1,4,2,8,60,60,0,1
Style: Caption,카페24 써라운드,100,&H00EFF9FF,&H00EFF9FF,&H0006193C,&H90000000,-1,0,0,0,100,100,0,0,1,7,2,8,72,72,0,1
Style: Brand,카페24 써라운드,38,&H00B5B7B9,&H00B5B7B9,&H0006193C,&H90000000,-1,0,0,0,100,100,0,0,1,2,0,8,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''


def stamp(t):
    n = round(t * 100)
    return f'{n//360000}:{n//6000%60:02d}:{n//100%60:02d}.{n%100:02d}'


def literal(text):
    # User text is never ASS markup, commands or additional lines.
    return ' '.join(text.replace('\\', '＼').replace('{', '｛').replace('}', '｝').split())


def event(start, end, style, text, y, size):
    return (f'Dialogue: 1,{stamp(start)},{stamp(end)},{style},,0,0,0,,'
            f'{{\\an8\\pos(540,{y})\\fs{size}}}{literal(text)}\n')


def fit(text, base, width, font):
    for size in range(base, 39, -1):
        if ImageFont.truetype(str(font), size).getlength(literal(text)) <= width:
            return size
    raise ValueError('문구가 너무 깁니다. 한 줄을 짧게 나눠주세요.')


def write_ass(path, text):
    path.write_text(text, encoding='utf-8-sig')


def run(mode, folder):
    p = json.loads((folder / 'korean-request.json').read_text(encoding='utf-8'))
    font = folder / 'fonts' / 'Cafe24Ssurround.ttf'
    head_sizes = [fit(t, 88 if i == 0 else 90, 900, font) for i, t in enumerate(p['headline'])]
    cap_sizes = [fit(c['text'], 100, 870, font) for c in p['captions']]
    if mode == 'prepare':
        body = HEADER
        for i, text in enumerate(p['headline']):
            body += event(0, 1, 'Head' if i == 0 else 'Subhead', text, 65 + 107*i, head_sizes[i])
        for i, c in enumerate(p['captions']):
            body += event(0, 1, 'Caption', c['text'], 1535, cap_sizes[i])
        write_ass(folder / 'korean-geometry.ass', body)
        return
    if mode != 'finish':
        raise ValueError('지원하지 않는 자막 처리입니다.')
    mask = Image.open(folder / 'korean-geometry.png').convert('L').point(lambda x: 255 if x > 90 else 0)
    head = mask.crop((0, 0, 1080, 500)).getbbox()
    cap = mask.crop((0, 1450, 1080, 1700)).getbbox()
    if not head or not cap:
        raise ValueError('제목과 자막 글꼴을 확인하지 못했습니다.')
    bottom = 1450 + cap[3]
    margin = 1920 - bottom
    shift = margin - head[1]
    title_y = [65 + shift, 172 + shift]
    static = ''
    preview = HEADER
    for i, text in enumerate(p['headline']):
        style = 'Head' if i == 0 else 'Subhead'
        static += event(0, p['duration'], style, text, title_y[i], head_sizes[i])
        preview += event(0, 1, style, text, title_y[i], head_sizes[i])
    static += event(0, p['duration'], 'Brand', '오리한의원', 1746, 38)
    preview += event(0, 1, 'Brand', '오리한의원', 1746, 38)
    final = HEADER + static
    for i, c in enumerate(p['captions']):
        final += event(c['start'], c['end'], 'Caption', c['text'], 1535, cap_sizes[i])
        preview += event(i + 1, i + 2, 'Caption', c['text'], 1535, cap_sizes[i])
    write_ass(folder / 'korean-captions.ass', final)
    write_ass(folder / 'korean-preview.ass', preview)
    print(json.dumps({'titleY': title_y, 'headlineFontSizes': head_sizes, 'captionFontSizes': cap_sizes,
                      'titleTopInkY': margin, 'maximumCaptionBottomInkY': bottom,
                      'balancedOuterMarginPx': margin, 'horizontalCenter': 540}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        run(sys.argv[1], Path(sys.argv[2]))
    except Exception as error:
        print('KOREAN_CAPTION_ERROR:' + str(error), file=sys.stderr)
        sys.exit(1)
