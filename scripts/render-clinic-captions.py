"""Render the approved clinic captions without a model or network request."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
FONT = Path(__file__).resolve().parents[1] / "public" / "fonts" / "Cafe24Ssurround.ttf"
FILL = (255, 249, 239, 255)
BORDER = (60, 25, 6, 255)


def draw_caption(canvas, text, top, maxwidth, maxsize):
    # top is the glyph-ink edge, not the font baseline. Keep the approved
    # dyspepsia/fatigue placement, fitting, outline and shadow unchanged.
    size = maxsize
    while True:
        font = ImageFont.truetype(str(FONT), size)
        box = font.getbbox(text)
        if box[2] - box[0] <= maxwidth or size < 60:
            break
        size -= 1
    if box[2] - box[0] > maxwidth:
        raise ValueError("자막이 한 줄에 들어가지 않습니다. 문구를 줄이거나 자막을 나눠주세요.")
    stroke = 12 if text == "오리한의원" else max(9, round(size * 0.08))
    x = (W - (box[2] - box[0])) / 2 - box[0]
    y = top - box[1]
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text(
        (x, y + 5), text, font=font, fill=(35, 16, 4, 120),
        stroke_width=stroke, stroke_fill=(35, 16, 4, 120),
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(4)))
    draw = ImageDraw.Draw(canvas)
    draw.text((x, y), text, font=font, fill=FILL, stroke_width=stroke, stroke_fill=BORDER)
    draw.text((x, y), text, font=font, fill=FILL, stroke_width=0, stroke_fill=FILL)
    return {"fontSize": size, "filledTop": top, "outline": stroke}


def main():
    if len(sys.argv) != 3:
        raise ValueError("자막 렌더링 요청 형식을 확인해주세요.")
    request_path, output_dir = Path(sys.argv[1]), Path(sys.argv[2])
    payload = json.loads(request_path.read_text(encoding="utf-8"))
    captions = payload.get("captions")
    if not isinstance(captions, list) or len(captions) > 30:
        raise ValueError("자막은 30개까지 가능합니다.")
    if not FONT.is_file():
        raise ValueError("서버에 한의원 자막 글꼴이 없습니다.")
    output_dir.mkdir(parents=True, exist_ok=True)
    result = []
    for index, text in enumerate(captions):
        if not isinstance(text, str) or not text.strip() or len(text) > 160 or any(c in text for c in "\r\n\t"):
            raise ValueError("한의원 자막은 줄바꿈 없이 한 줄씩 입력해주세요.")
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        style = draw_caption(canvas, text, 93, 948, 150)
        filename = f"clinic-caption-{index}.png"
        canvas.save(output_dir / filename)
        result.append({"file": filename, **style})
    brand = None
    if payload.get("brand") is True:
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        style = draw_caption(canvas, "오리한의원", 1746, 750, 130)
        filename = "clinic-brand.png"
        canvas.save(output_dir / filename)
        brand = {"file": filename, **style}
    print(json.dumps({"captions": result, "brand": brand}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError) as error:
        print("CLINIC_CAPTION_ERROR:" + str(error), file=sys.stderr)
        sys.exit(1)
