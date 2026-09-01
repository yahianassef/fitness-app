"""Source a real, embeddable YouTube form-demo video for each gym exercise.

Every exercise in this app promises a form video, so a made-up video id is worse
than no exercise at all. This searches YouTube, keeps only results whose title
plausibly matches the exercise, and verifies each candidate is actually playable
in an embed before accepting it.

    python tools/find_videos.py probe    # feasibility check on a few names
    python tools/find_videos.py sync     # fill api/seed_data/videos.json
    python tools/find_videos.py verify   # re-check every stored id still works
"""
import concurrent.futures
import importlib.util
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "api" / "seed_data"
VIDEOS_JSON = SEED / "videos.json"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

STOP = {"the", "a", "with", "and", "to", "on", "in", "up", "of", "for"}

# Titles we do not want fronting a coaching app. Note the profanity stems carry
# no trailing \b: "F*cking" has to match on "f*ck", and a trailing boundary there
# would never fire because the next character is a word character.
BAD = re.compile(
    r"(\bshorts?\b|\bcompilation\b|\breaction\b|\bprank\b|\bworst\b"
    r"|f\*+ck|fuck|sh\*t|\bshit|\bdamn\b|\bcrap\b)",
    re.I)


def _get(url, timeout=25):
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "ignore")


def search(query, limit=14):
    """Return [(video_id, title)] from a YouTube results page, in rank order."""
    url = ("https://www.youtube.com/results?search_query="
           + urllib.parse.quote(query) + "&sp=EgIQAQ%253D%253D")  # videos only
    html = _get(url)
    out, seen = [], set()
    for m in re.finditer(
            r'"videoId":"([\w-]{11})".{0,400}?"title":\{"runs":\[\{"text":"(.*?)"\}',
            html):
        vid, title = m.group(1), m.group(2)
        if vid in seen:
            continue
        seen.add(vid)
        try:
            title = title.encode().decode("unicode_escape")
        except Exception:
            pass
        out.append((vid, title))
        if len(out) >= limit:
            break
    return out


def embeddable(vid):
    """True only if the video exists AND its owner allows embedding."""
    try:
        html = _get(f"https://www.youtube.com/watch?v={vid}")
    except Exception:
        return False
    m = re.search(r'"playableInEmbed":(true|false)', html)
    return bool(m and m.group(1) == "true")


def title_matches(name, title):
    """Most significant words of the exercise name must appear in the title."""
    t = title.lower()
    words = [w for w in re.split(r"[^a-z0-9]+", name.lower()) if w and w not in STOP]
    if not words:
        return False
    hits = sum(1 for w in words if w in t)
    return hits >= max(1, len(words) - 1)


def pick(name):
    """Best embeddable video for this exercise, or None."""
    for query in (f"{name} exercise proper form technique",
                  f"how to {name} form",
                  name):
        try:
            results = search(query)
        except Exception:
            continue
        for vid, title in results:
            if not title_matches(name, title) or BAD.search(title):
                continue
            if embeddable(vid):
                return {"video_id": vid, "video_title": title.strip()[:110]}
    return None


def run(names, workers=5):
    found, missing = {}, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        for name, res in zip(names, ex.map(pick, names)):
            if res:
                found[name] = res
            else:
                missing.append(name)
    return found, missing


def _load_seed_module(path, helper=None):
    """Load a seed module without importing the package (whose __init__ refuses
    to import until every video exists — precisely what this script fixes)."""
    src = path.read_text(encoding="utf-8").replace("from .gym import E", "")
    ns = {} if helper is None else {"E": helper}
    exec(compile(src, str(path), "exec"), ns)
    return ns


def gym_rows():
    gym = _load_seed_module(SEED / "gym.py")
    rows = list(gym["DUMBBELLS"])
    for fname in ("gym_barbell.py", "gym_machine.py"):
        ns = _load_seed_module(SEED / fname, helper=gym["E"])
        for key in ("BARBELLS", "KETTLEBELLS", "MACHINES", "CABLES",
                    "MEDICINE_BALL", "STABILITY_BALL"):
            if key in ns:
                rows.extend(ns[key])
    return rows


def load_videos():
    if VIDEOS_JSON.exists():
        return json.loads(VIDEOS_JSON.read_text(encoding="utf-8"))
    return {}


def save_videos(data):
    VIDEOS_JSON.write_text(
        json.dumps(data, indent=1, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8")


def sync():
    rows = gym_rows()
    have = load_videos()
    todo = [(e["slug"], e["name"]) for e in rows if e["slug"] not in have]
    print(f"{len(rows)} gym exercises | {len(have)} already sourced | {len(todo)} to find")
    if not todo:
        return
    found, _ = run([n for _, n in todo])
    for slug, name in todo:
        if name in found:
            have[slug] = found[name]
    save_videos(have)
    missing = [s for s, _ in todo if s not in have]
    print(f"stored {len(have)}/{len(rows)}")
    if missing:
        print("STILL MISSING:", ", ".join(missing))


def verify():
    have = load_videos()
    items = sorted(have.items())
    print(f"re-checking {len(items)} stored videos...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        results = list(ex.map(lambda kv: (kv[0], embeddable(kv[1]["video_id"])), items))
    bad = [s for s, ok in results if not ok]
    print(f"{len(results) - len(bad)}/{len(results)} still playable in an embed")
    if bad:
        print("BROKEN:", ", ".join(bad))
        sys.exit(1)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "sync"
    if cmd == "sync":
        sync()
    elif cmd == "verify":
        verify()
    elif cmd == "probe":
        names = ["Barbell Back Squat", "Cable Face Pull", "Wall Ball"]
        found, missing = run(names)
        for n in names:
            r = found.get(n)
            print(f"{'OK ' if r else 'MISS'} {n:26} {r['video_id'] if r else '-'}")
