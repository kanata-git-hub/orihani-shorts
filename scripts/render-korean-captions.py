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
    wide = p.get('koreanTitlePreset') == 'wide'
    state = folder / 'korean-wide-layout.json'
    if wide:
        # One shared size keeps short lines from becoming disproportionately large.
        size = min(fit(t, 320, 1000, font) for t in p['headline'])
        head_sizes = [size, size]
        if mode == 'finish':
            head_sizes = json.loads(state.read_text(encoding='utf-8'))
    else:
        # No preset means the original approved geometry, including saved drafts.
        head_sizes = [fit(t, 88 if i == 0 else 90, 900, font) for i, t in enumerate(p['headline'])]
    cap_sizes = [fit(c['text'], 100, 870, font) for c in p['captions']]
    if mode == 'prepare':
        if wide:
            state.write_text(json.dumps(head_sizes), encoding='utf-8')
        body = HEADER
        for i, text in enumerate(p['headline']):
            body += event(0, 1, 'Head' if i == 0 else 'Subhead', text, (65 + 585*i) if wide else (65 + 107*i), head_sizes[i])
        for i, c in enumerate(p['captions']):
            body += event(0, 1, 'Caption', c['text'], 1535, cap_sizes[i])
        write_ass(folder / 'korean-geometry.ass', body)
        return
    if mode != 'finish':
        raise ValueError('지원하지 않는 자막 처리입니다.')
    mask = Image.open(folder / 'korean-geometry.png').convert('L').point(lambda x: 255 if x > 90 else 0)
    head = mask.crop((0, 0, 1080, 500)).getbbox()
    title_boxes = []
    if wide:
        title_boxes = [mask.crop((0, y, 1080, y + 585)).getbbox() for y in (0, 585)]
        if not all(title_boxes):
            raise ValueError('제목 글자를 확인하지 못했습니다.')
        widths = [b[2] - b[0] for b in title_boxes]
        width = max(widths)
        if not 972 <= width <= 1026:
            size = round(head_sizes[0] * 1000 / width)
            if size == head_sizes[0] or not 40 <= size <= 320:
                raise ValueError('제목을 화면 폭에 맞출 수 없습니다. 두 줄의 길이를 비슷하게 다듬어주세요.')
            head_sizes = [size, size]
            state.write_text(json.dumps(head_sizes), encoding='utf-8')
            body = HEADER
            for i, text in enumerate(p['headline']):
                body += event(0, 1, 'Head' if i == 0 else 'Subhead', text, 65 + 585*i, size)
            for i, c in enumerate(p['captions']):
                body += event(0, 1, 'Caption', c['text'], 1535, cap_sizes[i])
            write_ass(folder / 'korean-geometry.ass', body)
            print(json.dumps({'needsCalibration': True}))
            return
    cap = mask.crop((0, 1450, 1080, 1700)).getbbox()
    if not head or not cap:
        raise ValueError('제목과 자막 글꼴을 확인하지 못했습니다.')
    bottom = 1450 + cap[3]
    margin = 1920 - bottom
    shift = margin - head[1]
    title_y = [65 + shift, 172 + shift]
    if wide:
        first, second = title_boxes
        first_height, second_height = first[3] - first[1], second[3] - second[1]
        title_y = [65 + margin - first[1], 650 + margin + first_height + 22 - (585 + second[1])]
        if margin + first_height + 22 + second_height > 1000:
            raise ValueError('제목이 너무 높습니다. 두 줄의 길이를 비슷하게 다듬어주세요.')
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
                      'balancedOuterMarginPx': margin, 'horizontalCenter': 540,
                      'koreanTitlePreset': 'wide' if wide else 'balanced',
                      'headlineInkWidths': [b[2] - b[0] for b in title_boxes] if wide else None}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        run(sys.argv[1], Path(sys.argv[2]))
    except Exception as error:
        print('KOREAN_CAPTION_ERROR:' + str(error), file=sys.stderr)
        sys.exit(1)
