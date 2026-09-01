"""Bake the Django seed data into a static JSON bundle for the GitHub Pages build.

Constants (choice lists, LEVEL_DEFAULTS, blurbs) are read straight out of
models.py / views.py with `ast` so this exporter cannot drift from the backend
and does not need Django installed to run.
"""
import ast
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from api.seed_data import CHAIN_META, EXERCISES, PROGRAMS  # noqa: E402


def consts(path, names):
    """Pull module-level literal assignments out of a source file."""
    tree = ast.parse((ROOT / path).read_text(encoding="utf-8"))
    found = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id in names:
                    found[t.id] = ast.literal_eval(node.value)
    missing = set(names) - set(found)
    if missing:
        raise SystemExit(f"Could not extract {missing} from {path}")
    return found


M = consts("api/models.py", [
    "EQUIPMENT_CHOICES", "DIFFICULTY_CHOICES", "MOVEMENT_PATTERN_CHOICES",
    "SCALING_LEVER_CHOICES", "ANCHOR_CHOICES", "LEVEL_DEFAULTS",
])
V = consts("api/views.py", ["EQUIPMENT_BLURBS", "PATTERN_BLURBS"])

label = {k: dict(v) for k, v in M.items() if k.endswith("CHOICES")}


def video_urls(vid, provider="youtube"):
    if provider == "youtube":
        return (f"https://www.youtube-nocookie.com/embed/{vid}?rel=0&modestbranding=1",
                f"https://www.youtube.com/watch?v={vid}")
    if provider == "vimeo":
        return f"https://player.vimeo.com/video/{vid}", f"https://vimeo.com/{vid}"
    return vid, vid


# ---- exercises -------------------------------------------------------------
exercises = []
for e in EXERCISES:
    meta = CHAIN_META.get(e["slug"])
    pattern, chain_key, chain_order, lever, anchor, unilateral = (
        meta if meta else ("other", "", 0, "", "none", False)
    )
    embed, watch = video_urls(e["video_id"])
    exercises.append({
        "slug": e["slug"],
        "name": e["name"],
        "equipment": e["equipment"],
        "equipment_label": label["EQUIPMENT_CHOICES"].get(e["equipment"], e["equipment"]),
        "difficulty": e["difficulty"],
        "primary_muscles": e.get("primary_muscles", []),
        "secondary_muscles": e.get("secondary_muscles", []),
        "summary": e.get("summary", ""),
        "video_id": e["video_id"],
        "video_provider": "youtube",
        "video_title": e.get("video_title", ""),
        "video_embed_url": embed,
        "video_watch_url": watch,
        "is_compound": e.get("is_compound", False),
        "beginner_friendly": e["difficulty"] == "beginner",
        "instructions": e.get("instructions", []),
        "form_tips": e.get("form_tips", []),
        "common_mistakes": e.get("common_mistakes", []),
        "movement_pattern": pattern,
        "movement_pattern_label": label["MOVEMENT_PATTERN_CHOICES"].get(pattern, ""),
        "chain_key": chain_key,
        "chain_order": chain_order,
        "scaling_lever": lever,
        "scaling_lever_label": label["SCALING_LEVER_CHOICES"].get(lever, ""),
        "needs_anchor": anchor,
        "needs_anchor_label": label["ANCHOR_CHOICES"].get(anchor, ""),
        "is_unilateral": unilateral,
    })

# regression / progression: adjacent chain_order within the same chain_key
by_chain = {}
for ex in exercises:
    if ex["chain_key"]:
        by_chain.setdefault(ex["chain_key"], []).append(ex)
for chain in by_chain.values():
    chain.sort(key=lambda x: x["chain_order"])
    for i, ex in enumerate(chain):
        link = lambda o: {"slug": o["slug"], "name": o["name"], "difficulty": o["difficulty"]}
        ex["regression"] = link(chain[i - 1]) if i > 0 else None
        ex["progression"] = link(chain[i + 1]) if i < len(chain) - 1 else None
for ex in exercises:
    ex.setdefault("regression", None)
    ex.setdefault("progression", None)

by_slug = {e["slug"]: e for e in exercises}

# ---- programs --------------------------------------------------------------
LIST_FIELDS = ["slug", "name", "subtitle", "description", "weeks", "days_per_week",
               "level", "focus", "equipment_used"]
programs = []
for p in PROGRAMS:
    equip = set()
    days = []
    for d in p["days"]:
        slots = []
        for i, s in enumerate(d["slots"]):
            ex = by_slug.get(s["exercise"])
            if not ex:
                raise SystemExit(f"program {p['slug']} references unknown exercise {s['exercise']}")
            equip.add(ex["equipment"])
            # Store only the slug. Embedding the whole exercise object here cost
            # 226 KB of pure duplication in a 420 KB bundle; the client rejoins
            # it against the exercises map at load time.
            slots.append({
                "id": f"{p['slug']}-{d['day_index']}-{i}",
                "order_index": i,
                "sets": s["sets"],
                "rep_scheme": s["rep_scheme"],
                "rest_seconds": s["rest_seconds"],
                "coach_note": s.get("coach_note", ""),
                "exercise_slug": ex["slug"],
            })
        days.append({
            "id": f"{p['slug']}-{d['day_index']}",
            "day_index": d["day_index"],
            "name": d["name"],
            "focus": d.get("focus", ""),
            "slots": slots,
        })
    row = {k: p.get(k) for k in LIST_FIELDS}
    row["equipment_profile"] = (
        "bodyweight_bands" if equip <= {"bodyweight", "bands"} else "all"
    )
    row["day_count"] = len(days)
    row["weekly_progression"] = p.get("weekly_progression", "")
    row["days"] = days
    programs.append(row)

# ---- equipment + muscles ---------------------------------------------------
counts = {}
for e in exercises:
    counts[e["equipment"]] = counts.get(e["equipment"], 0) + 1
equipment = [{"type": k, "label": v, "blurb": V["EQUIPMENT_BLURBS"].get(k, ""),
              "exercise_count": counts.get(k, 0)}
             for k, v in M["EQUIPMENT_CHOICES"]]

muscles = sorted({m for e in exercises
                  for m in (e["primary_muscles"] + e["secondary_muscles"])})

bundle = {
    "exercises": exercises,
    "programs": programs,
    "equipment": equipment,
    "muscles": muscles,
    "level_defaults": M["LEVEL_DEFAULTS"],
    "pattern_choices": M["MOVEMENT_PATTERN_CHOICES"],
    "pattern_blurbs": V["PATTERN_BLURBS"],
}

out = ROOT / "docs" / "data" / "app-data.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(bundle, separators=(",", ":")), encoding="utf-8")
bw = sum(1 for e in exercises if e["equipment"] in ("bodyweight", "bands"))
print(f"exercises: {len(exercises)} ({bw} bodyweight/bands)")
print(f"programs:  {len(programs)}")
print(f"muscles:   {len(muscles)}")
print(f"wrote {out.relative_to(ROOT)}  ({out.stat().st_size/1024:.0f} KB)")
