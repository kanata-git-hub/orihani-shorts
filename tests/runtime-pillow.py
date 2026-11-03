"""Exercise the production caption interpreter without network, pip, or test dependencies."""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import PIL
from PIL import Image, features

ROOT = Path("/app")
expected = re.search(r"^Pillow==([\w.]+)", (ROOT / "docker/pillow-source.txt").read_text(), re.M)[1]
assert PIL.__version__ == expected, (PIL.__version__, expected)
assert features.check("freetype2") and features.check("zlib")
package = Path(PIL.__file__).parent
assert not (package.parent / "pillow.libs").exists(), "Unexpected bundled native libraries"
for extension in package.glob("*.so"):
    linked = subprocess.check_output(["ldd", extension], text=True)
    assert "not found" not in linked, linked
    for lib in re.findall(r"=> (/[^\s]+)", linked):
        subprocess.run(["dpkg-query", "-S", str(Path(lib).resolve())], check=True, stdout=subprocess.DEVNULL)

with tempfile.TemporaryDirectory() as tmp:
    request = Path(tmp, "request.json")
    request.write_text(json.dumps({"captions": ["한글 자막 점검"], "brand": True}))
    subprocess.run([sys.executable, ROOT / "scripts/render-clinic-captions.py", request, tmp], check=True)
    for name in ["clinic-caption-0.png", "clinic-brand.png"]:
        with Image.open(Path(tmp, name)) as image:
            assert image.size == (1080, 1920) and image.mode == "RGBA" and image.getbbox()
