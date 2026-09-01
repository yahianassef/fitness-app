from .chains import CHAIN_META as _BASE_CHAIN_META
from .exercises import EXERCISES as _BASE_EXERCISES
from .gym import DUMBBELLS as _DUMBBELLS
from .gym_barbell import BARBELLS as _BARBELLS, KETTLEBELLS as _KETTLEBELLS
from .gym_machine import (
    CABLES as _CABLES,
    MACHINES as _MACHINES,
    MEDICINE_BALL as _MED_BALL,
    STABILITY_BALL as _STAB_BALL,
)
from .moves import MOVES as _MOVES
from .programs import PROGRAMS  # noqa: F401
from .videos import GYM_VIDEOS as _GYM_VIDEOS

# Equipment-based library. Each entry carries its pattern/chain metadata inline
# (see gym.E); it is split out into CHAIN_META below so the rest of the app sees
# exactly the same shape as the hand-written bodyweight/bands data.
_GYM_RAW = (_DUMBBELLS + _BARBELLS + _KETTLEBELLS + _MACHINES
            + _CABLES + _MED_BALL + _STAB_BALL)

_EXISTING_SLUGS = {e["slug"] for e in _BASE_EXERCISES} | {e["slug"] for e in _MOVES}

_GYM_EXERCISES = []
_GYM_CHAIN_META = {}
for _e in _GYM_RAW:
    _chain = _e["_chain"]
    # Pattern/chain metadata is adopted even for slugs that already exist, so the
    # older hand-written entries gain progression ladders too.
    _GYM_CHAIN_META[_e["slug"]] = (
        _e["_pattern"],
        _chain[0] if _chain else "",
        _chain[1] if _chain else 0,
        _chain[2] if _chain else "",
        "none",
        _e["_unilateral"],
    )

    # A slug already in the library keeps its original entry: it is referenced by
    # programs and already carries a verified video. Only genuinely new movements
    # are appended.
    if _e["slug"] in _EXISTING_SLUGS:
        continue

    _row = {k: v for k, v in _e.items() if not k.startswith("_")}
    _video = _GYM_VIDEOS.get(_e["slug"])
    if not _video:
        raise RuntimeError(
            f"No verified video for {_e['slug']!r}. Every exercise promises a form "
            f"demo, so run: python tools/find_videos.py sync"
        )
    _row["video_id"] = _video["video_id"]
    _row["video_title"] = _video["video_title"]
    _GYM_EXERCISES.append(_row)

# The full library = the original set + bodyweight/bands moves + the gym library.
EXERCISES = _BASE_EXERCISES + _MOVES + _GYM_EXERCISES
CHAIN_META = {**_BASE_CHAIN_META, **_GYM_CHAIN_META}

_slugs = [e["slug"] for e in EXERCISES]
if len(_slugs) != len(set(_slugs)):
    _dupes = sorted({s for s in _slugs if _slugs.count(s) > 1})
    raise RuntimeError(f"Duplicate exercise slugs: {_dupes}")
