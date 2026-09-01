"""Generate the app icons (pure Python, no Pillow).

    python web/make_icons.py

Writes PNG icons used for the browser tab, the iOS "Add to Home Screen" icon,
and the web app manifest. Re-run only if you want to change the artwork.
"""
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent / "static" / "web" / "icons"

BG = (232, 99, 42, 255)       # --accent orange
BAR = (255, 255, 255, 255)    # white dumbbell


def _png(path, w, h, pixels):
    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data +
                struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw.extend(pixels[y * w * 4:(y + 1) * w * 4])
    data = (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b""))
    path.write_bytes(data)


def _blend(dst, src):
    a = src[3] / 255
    return tuple(round(src[i] * a + dst[i] * (1 - a)) for i in range(3)) + (255,)


def make_icon(size, pad_ratio=0.0):
    px = bytearray(BG * (size * size))

    def put(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4
            cur = (px[i], px[i + 1], px[i + 2], px[i + 3])
            r, g, b, a = _blend(cur, color)
            px[i:i + 4] = bytes((r, g, b, a))

    def rect(cx, cy, hw, hh, radius=0):
        for y in range(int(cy - hh), int(cy + hh)):
            for x in range(int(cx - hw), int(cx + hw)):
                if radius:
                    dx = max(0, abs(x - cx) - (hw - radius))
                    dy = max(0, abs(y - cy) - (hh - radius))
                    if dx * dx + dy * dy > radius * radius:
                        continue
                put(x, y, BAR)

    s = size
    scale = 1 - pad_ratio
    # dumbbell: centre handle + two weight blocks each end
    rect(s * 0.5, s * 0.5, s * 0.30 * scale, s * 0.055 * scale, radius=s * 0.03)
    for sign in (-1, 1):
        rect(s * 0.5 + sign * s * 0.30 * scale, s * 0.5,
             s * 0.055 * scale, s * 0.20 * scale, radius=s * 0.03)
        rect(s * 0.5 + sign * s * 0.40 * scale, s * 0.5,
             s * 0.055 * scale, s * 0.13 * scale, radius=s * 0.03)
    return bytes(px)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    _png(OUT / "icon-512.png", 512, 512, make_icon(512))
    _png(OUT / "icon-192.png", 192, 192, make_icon(192))
    _png(OUT / "maskable-512.png", 512, 512, make_icon(512, pad_ratio=0.30))
    _png(OUT / "apple-touch-icon.png", 180, 180, make_icon(180))
    print(f"wrote 4 icons to {OUT}")


if __name__ == "__main__":
    main()
