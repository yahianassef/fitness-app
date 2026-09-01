"""Bodyweight & Bands section metadata, keyed by exercise slug.

Single source of truth for movement pattern, progression-chain position, the
scaling lever that unlocks each step, and whether an anchor is needed. Applied
on top of the base exercise content at seed time.

Fields: (pattern, chain_key, chain_order, scaling_lever, needs_anchor, unilateral)
chain_key "" means the exercise stands alone in its pattern (no ladder).
"""

# fmt: off
CHAIN_META = {
    # ================= HORIZONTAL PUSH =================
    "wall-push-up":        ("horizontal_push", "push-up", 1, "body_angle",      "none", False),
    "incline-push-up":     ("horizontal_push", "push-up", 2, "body_angle",      "none", False),
    "knee-push-up":        ("horizontal_push", "push-up", 3, "lever_length",    "none", False),
    "push-up":             ("horizontal_push", "push-up", 4, "lever_length",    "none", False),
    "decline-push-up":     ("horizontal_push", "push-up", 5, "body_angle",      "none", False),
    "deficit-push-up":     ("horizontal_push", "push-up", 6, "range_of_motion", "none", False),
    "archer-push-up":      ("horizontal_push", "push-up", 7, "unilateral",      "none", True),
    "band-floor-press":    ("horizontal_push", "band-press", 1, "band_tension", "none", False),
    "band-chest-press":    ("horizontal_push", "band-press", 2, "band_tension", "door", False),
    "wide-push-up":        ("horizontal_push", "", 0, "body_angle", "none", False),
    "diamond-push-up":     ("horizontal_push", "", 0, "lever_length", "none", False),
    "spiderman-push-up":   ("horizontal_push", "", 0, "base_of_support", "none", False),
    "clap-push-up":        ("horizontal_push", "", 0, "power", "none", False),

    # ================= HORIZONTAL PULL =================
    "band-seated-row":     ("horizontal_pull", "row", 1, "band_tension", "underfoot", False),
    "band-bent-over-row":  ("horizontal_pull", "row", 2, "band_tension", "underfoot", True),
    "superman":            ("horizontal_pull", "", 0, "lever_length", "none", False),
    "band-reverse-fly":    ("horizontal_pull", "", 0, "band_tension", "none", False),
    "band-face-pull":      ("horizontal_pull", "", 0, "band_tension", "door", False),
    "seated-cable-row":    ("horizontal_pull", "", 0, "", "none", False),

    # ================= VERTICAL PUSH =================
    "band-overhead-press":  ("vertical_push", "overhead", 1, "band_tension", "underfoot", False),
    "pike-push-up":         ("vertical_push", "overhead", 2, "body_angle",   "none", False),
    "wall-walk":            ("vertical_push", "overhead", 3, "lever_length", "none", False),
    "band-arnold-press":    ("vertical_push", "", 0, "band_tension", "underfoot", False),
    "band-lateral-raise":   ("vertical_push", "", 0, "band_tension", "underfoot", False),
    "band-upright-row":     ("vertical_push", "", 0, "band_tension", "underfoot", False),

    # ================= VERTICAL PULL =================
    "band-pull-apart":            ("vertical_pull", "pulldown", 1, "band_tension", "none", False),
    "band-lat-pulldown":          ("vertical_pull", "pulldown", 2, "band_tension", "door", False),
    "band-straight-arm-pulldown": ("vertical_pull", "pulldown", 3, "lever_length", "door", False),
    "band-pullover":              ("vertical_pull", "", 0, "band_tension", "none", False),

    # ================= SQUAT =================
    "bodyweight-squat":       ("squat", "squat", 1, "range_of_motion", "none", False),
    "split-squat":            ("squat", "squat", 2, "base_of_support", "none", True),
    "bulgarian-split-squat":  ("squat", "squat", 3, "base_of_support", "none", True),
    "box-pistol-squat":       ("squat", "squat", 4, "base_of_support", "none", True),
    "pistol-squat":           ("squat", "squat", 5, "unilateral",      "none", True),
    "shrimp-squat":           ("squat", "squat", 6, "unilateral",      "none", True),
    "band-squat":             ("squat", "band-squat", 1, "band_tension", "underfoot", False),
    "prisoner-squat":         ("squat", "", 0, "lever_length", "none", False),
    "sumo-squat":             ("squat", "", 0, "range_of_motion", "none", False),
    "jump-squat":             ("squat", "", 0, "power", "none", False),
    "wall-sit":               ("squat", "", 0, "tempo", "none", False),

    # ================= LUNGE / SPLIT =================
    "reverse-lunge":            ("lunge", "lunge", 1, "base_of_support", "none", True),
    "forward-lunge":            ("lunge", "lunge", 2, "base_of_support", "none", True),
    "bodyweight-walking-lunge": ("lunge", "lunge", 3, "base_of_support", "none", True),
    "jumping-lunge":            ("lunge", "lunge", 4, "power", "none", True),
    "lateral-lunge":            ("lunge", "", 0, "base_of_support", "none", True),
    "curtsy-lunge":             ("lunge", "", 0, "base_of_support", "none", True),
    "cossack-squat":            ("lunge", "", 0, "range_of_motion", "none", True),
    "step-up":                  ("lunge", "", 0, "base_of_support", "none", True),

    # ================= HINGE =================
    "glute-bridge":            ("hinge", "hinge", 1, "base_of_support", "none", False),
    "single-leg-glute-bridge": ("hinge", "hinge", 2, "unilateral", "none", True),
    "band-good-morning":       ("hinge", "hinge", 3, "band_tension", "underfoot", False),
    "band-pull-through":       ("hinge", "hinge", 4, "band_tension", "door", False),
    "b-stance-rdl":            ("hinge", "hinge", 5, "base_of_support", "none", True),
    "single-leg-rdl":          ("hinge", "hinge", 6, "unilateral", "none", True),
    "frog-pump":               ("hinge", "", 0, "range_of_motion", "none", False),
    "band-hip-thrust":         ("hinge", "", 0, "band_tension", "none", False),
    "band-donkey-kick":        ("hinge", "", 0, "band_tension", "none", True),

    # ================= CORE: ANTI-EXTENSION =================
    "dead-bug":           ("core_anti_extension", "anti-extension", 1, "base_of_support", "none", False),
    "plank":              ("core_anti_extension", "anti-extension", 2, "lever_length", "none", False),
    "hollow-body-hold":   ("core_anti_extension", "anti-extension", 3, "lever_length", "none", False),
    "hollow-rock":        ("core_anti_extension", "anti-extension", 4, "range_of_motion", "none", False),
    "reverse-crunch":     ("core_anti_extension", "leg-raise", 1, "range_of_motion", "none", False),
    "lying-leg-raise":    ("core_anti_extension", "leg-raise", 2, "lever_length", "none", False),
    "v-up":               ("core_anti_extension", "leg-raise", 3, "range_of_motion", "none", False),

    # ================= CORE: ANTI-ROTATION =================
    "bird-dog":            ("core_anti_rotation", "anti-rotation", 1, "base_of_support", "none", False),
    "plank-shoulder-taps": ("core_anti_rotation", "anti-rotation", 2, "base_of_support", "none", False),
    "band-pallof-press":   ("core_anti_rotation", "anti-rotation", 3, "band_tension", "door", False),

    # ================= CORE: ROTATION =================
    "bicycle-crunch":     ("core_rotation", "rotation", 1, "range_of_motion", "none", False),
    "russian-twist":      ("core_rotation", "rotation", 2, "lever_length", "none", False),

    # ================= CORE: ANTI-LATERAL =================
    "side-plank":         ("core_anti_lateral", "anti-lateral", 1, "lever_length", "none", True),
    "copenhagen-plank":   ("core_anti_lateral", "anti-lateral", 2, "lever_length", "none", True),

    # ================= CALVES =================
    "standing-calf-raise":   ("calves", "calf-raise", 1, "range_of_motion", "none", False),
    "single-leg-calf-raise": ("calves", "calf-raise", 2, "unilateral", "none", True),

    # ================= CONDITIONING =================
    "jumping-jacks":      ("conditioning", "", 0, "", "none", False),
    "high-knees":         ("conditioning", "", 0, "", "none", False),
    "mountain-climbers":  ("conditioning", "", 0, "", "none", False),
    "bear-crawl":         ("conditioning", "", 0, "", "none", False),
    "inchworm-walkout":   ("conditioning", "", 0, "", "none", False),
    "burpee":             ("conditioning", "", 0, "", "none", False),
    "tuck-jump":          ("conditioning", "", 0, "power", "none", False),
    "skater-hops":        ("conditioning", "", 0, "power", "none", True),

    # ================= MOBILITY & WARM-UP =================
    "cat-cow":                 ("mobility", "", 0, "", "none", False),
    "worlds-greatest-stretch": ("mobility", "", 0, "", "none", True),
    "downward-dog":            ("mobility", "", 0, "", "none", False),
    "deep-squat-hold":         ("mobility", "", 0, "", "none", False),
    "thoracic-open-book":      ("mobility", "", 0, "", "none", True),

    # ================= ACCESSORY BANDS (arms) =================
    "band-bicep-curl":               ("other", "", 0, "band_tension", "underfoot", False),
    "band-overhead-tricep-extension": ("other", "", 0, "band_tension", "underfoot", False),
    "band-tricep-kickback":          ("other", "", 0, "band_tension", "underfoot", False),
    "band-lateral-walk":             ("other", "", 0, "band_tension", "none", False),
}
# fmt: on
