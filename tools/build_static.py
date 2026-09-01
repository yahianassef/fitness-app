"""Assemble the static GitHub Pages build into docs/.

Copies the SPA out of web/static/web, overlays the offline replacements from
tools/static_src (a localStorage-backed api.js and a base-path-aware router),
and writes the page shell, manifest, service worker and SPA fallback.

Run tools/export_static.py first (or just run this — it calls it).
"""
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "web" / "static" / "web"
OVERLAY = ROOT / "tools" / "static_src"
DOCS = ROOT / "docs"

# GitHub Pages project sites live at /<repo>/. Kept in one place: the shell
# publishes it as window.__FC_BASE__ and the router/manifest read it from there.
BASE = "/fitness-app"

INDEX = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#e8632a" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#17140f" media="(prefers-color-scheme: dark)" />
  <meta name="description" content="A calm, encouraging way back into the gym after time off." />
  <title>Fitness Comeback</title>

  <base href="{base}/" />

  <!-- iOS "Add to Home Screen" — makes it open full-screen like an installed app -->
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Comeback" />
  <link rel="apple-touch-icon" href="{base}/icons/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="{base}/icons/icon-192.png" />
  <link rel="manifest" href="{base}/site.webmanifest" />

  <link rel="preconnect" href="https://www.youtube-nocookie.com" />
  <link rel="stylesheet" href="{base}/css/styles.css" />
  <script>window.__FC_BASE__ = "{base}";</script>
  <script type="importmap">
  {{
    "imports": {{
      "vue": "{base}/vendor/vue.esm-browser.prod.js"
    }}
  }}
  </script>
</head>
<body>
  <div id="app">
    <div class="boot">Loading your comeback…</div>
  </div>
  <script type="module" src="{base}/js/main.js"></script>
  <script>
    if ('serviceWorker' in navigator) {{
      window.addEventListener('load', function () {{
        navigator.serviceWorker.register('{base}/sw.js').catch(function () {{}});
      }});
    }}
  </script>
</body>
</html>
"""

MANIFEST = """{{
  "name": "Fitness Comeback",
  "short_name": "Comeback",
  "description": "A calm, encouraging way back into the gym after time off.",
  "start_url": "{base}/",
  "scope": "{base}/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#fbf7f2",
  "theme_color": "#e8632a",
  "icons": [
    {{ "src": "{base}/icons/icon-192.png", "sizes": "192x192", "type": "image/png" }},
    {{ "src": "{base}/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }},
    {{ "src": "{base}/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }}
  ]
}}
"""

SW = """// Offline cache. Bumping CACHE evicts the previous version on activate.
const CACHE = 'fitness-comeback-{version}';
const BASE = '{base}';
const ASSETS = {assets};

self.addEventListener('install', (e) => {{
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
}});

self.addEventListener('activate', (e) => {{
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
}});

self.addEventListener('fetch', (e) => {{
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigations: serve the cached shell so deep links work offline.
  if (e.request.mode === 'navigate') {{
    e.respondWith(
      fetch(e.request).catch(() => caches.match(BASE + '/index.html')),
    );
    return;
  }}

  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {{
      if (res.ok) {{
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }}
      return res;
    }})),
  );
}});
"""


def patch_main(path):
    """Drop the "Phone" header button.

    It linked to the Django /connect page, which showed a QR code for reaching a
    laptop-hosted server over the LAN. On Pages there is no such server, and the
    app itself is the thing you install on the phone, so the button is obsolete.
    """
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r"^\s*h\('a',\s*\{\s*href:\s*'/connect'.*?\),\n", re.MULTILINE | re.DOTALL,
    )
    patched, n = pattern.subn("", text, count=1)
    if n != 1:
        raise SystemExit(
            "build: could not remove the /connect header link from main.js "
            "(markup changed?) — it would 404 on Pages, so failing loudly."
        )
    path.write_text(patched, encoding="utf-8")


def patch_login(path):
    """Drop the "Try the demo account" button.

    It signed in as a seeded server account. Profiles are per-device now, so the
    button could only ever fail; creating a real profile is instant instead.
    """
    text = path.read_text(encoding="utf-8")
    button = re.compile(
        r"\n\s*<button type=\"button\" class=\"btn ghost block\"[^>]*@click=\"useDemo\">"
        r".*?</button>",
        re.DOTALL,
    )
    patched, n = button.subn("", text, count=1)
    if n != 1:
        raise SystemExit("build: could not remove the demo-account button from Login.js")
    handler = re.compile(r"\n\s*useDemo\(\)\s*\{.*?\n\s*\},", re.DOTALL)
    patched, n = handler.subn("", patched, count=1)
    if n != 1:
        raise SystemExit("build: could not remove the useDemo() handler from Login.js")
    path.write_text(patched, encoding="utf-8")


def build():
    subprocess.run([sys.executable, str(ROOT / "tools" / "export_static.py")], check=True)

    data_file = DOCS / "data" / "app-data.json"
    keep = data_file.read_bytes()

    if DOCS.exists():
        shutil.rmtree(DOCS)
    DOCS.mkdir(parents=True)

    for sub in ("css", "js", "vendor", "icons"):
        shutil.copytree(SRC / sub, DOCS / sub)

    # Overlay the offline replacements.
    for f in OVERLAY.glob("*.js"):
        shutil.copy2(f, DOCS / "js" / f.name)

    patch_main(DOCS / "js" / "main.js")
    patch_login(DOCS / "js" / "pages" / "Login.js")

    (DOCS / "data").mkdir(parents=True, exist_ok=True)
    data_file.write_bytes(keep)

    (DOCS / "index.html").write_text(INDEX.format(base=BASE), encoding="utf-8")
    # GitHub Pages serves 404.html for unknown paths; the SPA router takes over.
    (DOCS / "404.html").write_text(INDEX.format(base=BASE), encoding="utf-8")
    (DOCS / "site.webmanifest").write_text(MANIFEST.format(base=BASE), encoding="utf-8")
    # Stop Pages running the output through Jekyll (which drops _-prefixed files).
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")

    assets = [f"{BASE}/", f"{BASE}/index.html", f"{BASE}/css/styles.css",
              f"{BASE}/site.webmanifest", f"{BASE}/data/app-data.json",
              f"{BASE}/vendor/vue.esm-browser.prod.js"]
    for js in sorted((DOCS / "js").rglob("*.js")):
        assets.append(f"{BASE}/js/{js.relative_to(DOCS / 'js').as_posix()}")
    for icon in sorted((DOCS / "icons").glob("*.png")):
        assets.append(f"{BASE}/icons/{icon.name}")

    version = str(abs(hash(tuple(assets))) % 10**8)
    (DOCS / "sw.js").write_text(
        SW.format(version=version, base=BASE,
                  assets="[\n  " + ",\n  ".join(f"'{a}'" for a in assets) + ",\n]"),
        encoding="utf-8",
    )

    # Nothing in the build may still point at the old Django /static/ or /api/ paths.
    bad = []
    for f in DOCS.rglob("*"):
        if f.suffix not in {".js", ".html", ".webmanifest"} or not f.is_file():
            continue
        text = f.read_text(encoding="utf-8", errors="ignore")
        for pat in (r"/static/web/", r"fetch\(\s*[`'\"]/api"):
            if re.search(pat, text):
                bad.append(f"{f.relative_to(DOCS)}: {pat}")
    if bad:
        raise SystemExit("Stale server paths in build:\n  " + "\n  ".join(bad))

    files = sum(1 for f in DOCS.rglob("*") if f.is_file())
    size = sum(f.stat().st_size for f in DOCS.rglob("*") if f.is_file())
    print(f"built docs/  {files} files, {size/1024:.0f} KB, base={BASE}")


if __name__ == "__main__":
    build()
