"""Convert rendered PNGs into high-resolution JPG companions.

Usage: python tools/showcase/png-to-jpg.py <png-dir> [out-dir]
Defaults: out-dir = docs/showcase. Long edge is capped at 2560 px; JPG is a
raster format, the SVG in docs/showcase stays the editable vector source.
"""
from PIL import Image
import os, glob, sys

src = sys.argv[1] if len(sys.argv) > 1 else '.showcase-renders'
dst = sys.argv[2] if len(sys.argv) > 2 else 'docs/showcase'
os.makedirs(dst, exist_ok=True)
MAXW = 2560
rows = []
for png in sorted(glob.glob(os.path.join(src, '*.png'))):
    name = os.path.splitext(os.path.basename(png))[0]
    im = Image.open(png).convert('RGB')
    w, h = im.size
    if w > MAXW:
        im = im.resize((MAXW, round(h * MAXW / w)), Image.LANCZOS)
    out = os.path.join(dst, name + '.jpg')
    im.save(out, 'JPEG', quality=90, subsampling=0, optimize=True, progressive=True)
    rows.append((name, im.size, round(os.path.getsize(out) / 1024)))
for row in rows:
    print(row)
print('total KB', sum(r[2] for r in rows))
