"""Seed content for the pre-built comeback programs.

Each program defines its training days once (as a list of exercise "slots").
`weekly_progression` holds a short coaching note for every week so the plan
stays progressive without overwhelming someone in their first month back.
Exercise references are slugs from ``exercises.py``.
"""

PROGRAMS = [
    {
        "slug": "foundation-reset",
        "name": "Foundation Reset",
        "subtitle": "4 weeks · 3 days/week · machines, dumbbells & bodyweight",
        "level": "beginner",
        "weeks": 4,
        "days_per_week": 3,
        "focus": "Rebuild the movement patterns and the gym habit",
        "order_index": 1,
        "equipment_used": ["machines", "dumbbells", "bodyweight", "bands"],
        "description": (
            "Your first month back. Everything here is guided or low-skill so you "
            "can focus on showing up, moving well, and leaving the gym feeling "
            "better than when you walked in — never wrecked. Three full-body days "
            "with a rest day between each. If life happens and you only get two "
            "in, that still counts."
        ),
        "weekly_progression": [
            "Week 1 — Movement week. Keep 2-3 reps in the tank on every set. "
            "Pick weights that feel almost too easy; you're re-teaching the patterns.",
            "Week 2 — Add a little. Nudge weights up ~5% where last week felt smooth. "
            "Same reps, same easy finish.",
            "Week 3 — Add one set to the two main lifts of each day. Push the last "
            "set to a comfortable ~2 reps in reserve.",
            "Week 4 — Hold the weights, tighten the form, and enjoy that it feels "
            "lighter. Next stop: Full Body Basics.",
        ],
        "days": [
            {
                "day_index": 1,
                "name": "Day A · Full Body",
                "focus": "Squat pattern, horizontal push & pull",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up. Do these before every session."},
                    {"exercise": "dumbbell-goblet-squat", "sets": 3, "rep_scheme": "8-10",
                     "rest_seconds": 90, "coach_note": "Main lift. Chest tall, sit between your knees."},
                    {"exercise": "chest-press-machine", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 75},
                    {"exercise": "seated-row-machine", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 75, "coach_note": "Squeeze the shoulder blades, pause each rep."},
                    {"exercise": "glute-bridge", "sets": 2, "rep_scheme": "12-15",
                     "rest_seconds": 45},
                    {"exercise": "plank", "sets": 3, "rep_scheme": "20-40 sec",
                     "rest_seconds": 45, "coach_note": "Stop the set when your hips start to sag."},
                ],
            },
            {
                "day_index": 2,
                "name": "Day B · Full Body",
                "focus": "Hinge pattern, vertical push & pull",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "kettlebell-deadlift", "sets": 3, "rep_scheme": "8-10",
                     "rest_seconds": 90, "coach_note": "Main lift. Push the hips back, flat back, bell close."},
                    {"exercise": "shoulder-press-machine", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 75},
                    {"exercise": "lat-pulldown", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 75, "coach_note": "Pull to the collarbone, arms fully straight at the top."},
                    {"exercise": "leg-press", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 90},
                    {"exercise": "dead-bug", "sets": 3, "rep_scheme": "8 / side",
                     "rest_seconds": 45},
                ],
            },
            {
                "day_index": 3,
                "name": "Day C · Full Body",
                "focus": "Single-leg, arms & core",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "bodyweight-squat", "sets": 3, "rep_scheme": "12-15",
                     "rest_seconds": 60, "coach_note": "Slow and controlled. Add a light goblet load in week 3 if easy."},
                    {"exercise": "incline-push-up", "sets": 3, "rep_scheme": "8-12",
                     "rest_seconds": 60, "coach_note": "Lower the hand height as you get stronger."},
                    {"exercise": "one-arm-dumbbell-row", "sets": 3, "rep_scheme": "10-12 / side",
                     "rest_seconds": 60},
                    {"exercise": "dumbbell-bicep-curl", "sets": 2, "rep_scheme": "12-15",
                     "rest_seconds": 45},
                    {"exercise": "cable-tricep-pushdown", "sets": 2, "rep_scheme": "12-15",
                     "rest_seconds": 45},
                    {"exercise": "side-plank", "sets": 2, "rep_scheme": "15-30 sec / side",
                     "rest_seconds": 30},
                ],
            },
        ],
    },
    {
        "slug": "full-body-basics",
        "name": "Full Body Basics",
        "subtitle": "6 weeks · 3 days/week · barbell & dumbbell compounds",
        "level": "beginner",
        "weeks": 6,
        "days_per_week": 3,
        "focus": "Learn the big lifts and add weight every week",
        "order_index": 2,
        "equipment_used": ["barbells", "dumbbells", "cables", "bodyweight"],
        "description": (
            "Once the patterns feel natural, this is where strength comes back. "
            "Three full-body days built around the squat, hinge, press and row. "
            "You'll do the same lifts each week and add a small amount of weight — "
            "that steady, boring progress is exactly what works. Start lighter "
            "than your ego wants."
        ),
        "weekly_progression": [
            "Week 1 — Find your working weights. Every set should end with 3 reps "
            "left in you. Film your top set of the squat and hinge.",
            "Week 2 — Add ~2.5-5 kg (5-10 lb) to the big lifts, or 1-2 reps to the "
            "accessories.",
            "Week 3 — Add weight again where form held. If a lift stalled, repeat "
            "last week's number.",
            "Week 4 — Lighter 'deload' feel: drop the main lifts to ~80% and focus "
            "on crisp technique. You've earned the easy week.",
            "Week 5 — Back to adding weight. You should now be past your Week 1 "
            "numbers on everything.",
            "Week 6 — Push for a strong (but clean) top set on each main lift, then "
            "reassess. Comeback Strength is waiting.",
        ],
        "days": [
            {
                "day_index": 1,
                "name": "Day 1 · Squat focus",
                "focus": "Back squat + upper body",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "barbell-back-squat", "sets": 3, "rep_scheme": "5-8",
                     "rest_seconds": 150, "coach_note": "Main lift. Empty bar for a set or two first."},
                    {"exercise": "barbell-bench-press", "sets": 3, "rep_scheme": "6-8",
                     "rest_seconds": 150, "coach_note": "Use a rack with safeties or a spotter."},
                    {"exercise": "one-arm-dumbbell-row", "sets": 3, "rep_scheme": "8-12 / side",
                     "rest_seconds": 90},
                    {"exercise": "plank", "sets": 3, "rep_scheme": "30-45 sec",
                     "rest_seconds": 45},
                ],
            },
            {
                "day_index": 2,
                "name": "Day 2 · Hinge focus",
                "focus": "Deadlift + pressing",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "barbell-romanian-deadlift", "sets": 3, "rep_scheme": "6-10",
                     "rest_seconds": 150, "coach_note": "Main lift. Hips back, bar on the legs, flat back."},
                    {"exercise": "barbell-overhead-press", "sets": 3, "rep_scheme": "6-8",
                     "rest_seconds": 120},
                    {"exercise": "lat-pulldown", "sets": 3, "rep_scheme": "8-12",
                     "rest_seconds": 90},
                    {"exercise": "dumbbell-walking-lunge", "sets": 2, "rep_scheme": "10 / side",
                     "rest_seconds": 90},
                    {"exercise": "dead-bug", "sets": 3, "rep_scheme": "8 / side",
                     "rest_seconds": 45},
                ],
            },
            {
                "day_index": 3,
                "name": "Day 3 · Mixed",
                "focus": "Front squat + volume",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "dumbbell-goblet-squat", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 90, "coach_note": "Swap in the barbell front squat once it feels comfortable."},
                    {"exercise": "dumbbell-bench-press", "sets": 3, "rep_scheme": "8-12",
                     "rest_seconds": 90},
                    {"exercise": "seated-cable-row", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 90},
                    {"exercise": "dumbbell-lateral-raise", "sets": 3, "rep_scheme": "12-15",
                     "rest_seconds": 45},
                    {"exercise": "dumbbell-hammer-curl", "sets": 2, "rep_scheme": "10-12",
                     "rest_seconds": 45},
                    {"exercise": "cable-tricep-pushdown", "sets": 2, "rep_scheme": "12-15",
                     "rest_seconds": 45},
                ],
            },
        ],
    },
    {
        "slug": "comeback-strength",
        "name": "Comeback Strength",
        "subtitle": "6 weeks · 4 days/week · upper / lower split",
        "level": "intermediate",
        "weeks": 6,
        "days_per_week": 4,
        "focus": "More volume, split across four focused days",
        "order_index": 3,
        "equipment_used": ["barbells", "dumbbells", "kettlebells", "cables", "machines"],
        "description": (
            "For when three days feels too few and the big lifts feel like old "
            "friends again. Two upper and two lower days let you train each area "
            "twice a week with enough volume to actually build muscle, while "
            "keeping any single session under an hour. Best started after a full "
            "run through Full Body Basics."
        ),
        "weekly_progression": [
            "Week 1 — Re-establish working weights across all four days. Leave 2-3 "
            "reps in reserve everywhere.",
            "Week 2 — Add weight or reps to the primary lift on each day.",
            "Week 3 — Add a set to one accessory per day. Primary lifts: small "
            "weight bump.",
            "Week 4 — Deload. Cut sets roughly in half and keep weights moderate.",
            "Week 5 — Ramp back up, aiming to beat your Week 3 top sets.",
            "Week 6 — Peak week: one hard top set per primary lift, then take a "
            "few easy days and reassess your goals.",
        ],
        "days": [
            {
                "day_index": 1,
                "name": "Day 1 · Lower (Squat)",
                "focus": "Quads & glutes",
                "slots": [
                    {"exercise": "band-lateral-walk", "sets": 2, "rep_scheme": "10 / side",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "barbell-back-squat", "sets": 4, "rep_scheme": "5-8",
                     "rest_seconds": 180, "coach_note": "Primary lift."},
                    {"exercise": "barbell-hip-thrust", "sets": 3, "rep_scheme": "8-12",
                     "rest_seconds": 120},
                    {"exercise": "leg-press", "sets": 3, "rep_scheme": "10-15",
                     "rest_seconds": 90},
                    {"exercise": "seated-leg-curl", "sets": 3, "rep_scheme": "10-15",
                     "rest_seconds": 75},
                    {"exercise": "side-plank", "sets": 3, "rep_scheme": "20-40 sec / side",
                     "rest_seconds": 30},
                ],
            },
            {
                "day_index": 2,
                "name": "Day 2 · Upper (Push)",
                "focus": "Chest, shoulders & triceps",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "barbell-bench-press", "sets": 4, "rep_scheme": "5-8",
                     "rest_seconds": 180, "coach_note": "Primary lift."},
                    {"exercise": "dumbbell-shoulder-press", "sets": 3, "rep_scheme": "8-12",
                     "rest_seconds": 120},
                    {"exercise": "cable-chest-fly", "sets": 3, "rep_scheme": "12-15",
                     "rest_seconds": 60},
                    {"exercise": "dumbbell-lateral-raise", "sets": 3, "rep_scheme": "12-20",
                     "rest_seconds": 45},
                    {"exercise": "cable-tricep-pushdown", "sets": 3, "rep_scheme": "12-15",
                     "rest_seconds": 45},
                ],
            },
            {
                "day_index": 3,
                "name": "Day 3 · Lower (Hinge)",
                "focus": "Hamstrings, glutes & power",
                "slots": [
                    {"exercise": "band-lateral-walk", "sets": 2, "rep_scheme": "10 / side",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "barbell-deadlift", "sets": 3, "rep_scheme": "3-6",
                     "rest_seconds": 210, "coach_note": "Primary lift. Reset every rep; quality over quantity."},
                    {"exercise": "kettlebell-swing", "sets": 4, "rep_scheme": "12-15",
                     "rest_seconds": 75, "coach_note": "Explosive hip snap."},
                    {"exercise": "dumbbell-walking-lunge", "sets": 3, "rep_scheme": "10 / side",
                     "rest_seconds": 90},
                    {"exercise": "leg-extension", "sets": 3, "rep_scheme": "12-15",
                     "rest_seconds": 60},
                    {"exercise": "dead-bug", "sets": 3, "rep_scheme": "10 / side",
                     "rest_seconds": 45},
                ],
            },
            {
                "day_index": 4,
                "name": "Day 4 · Upper (Pull)",
                "focus": "Back & biceps",
                "slots": [
                    {"exercise": "band-face-pull", "sets": 2, "rep_scheme": "15",
                     "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "barbell-bent-over-row", "sets": 4, "rep_scheme": "6-10",
                     "rest_seconds": 150, "coach_note": "Primary lift. Fixed torso angle."},
                    {"exercise": "lat-pulldown", "sets": 3, "rep_scheme": "8-12",
                     "rest_seconds": 90},
                    {"exercise": "seated-cable-row", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 90},
                    {"exercise": "cable-face-pull", "sets": 3, "rep_scheme": "15-20",
                     "rest_seconds": 45},
                    {"exercise": "dumbbell-bicep-curl", "sets": 3, "rep_scheme": "10-12",
                     "rest_seconds": 45},
                ],
            },
        ],
    },
    # ================================================================== #
    #  BODYWEIGHT & BANDS — one program per fitness level
    # ================================================================== #
    {
        "slug": "foundation-bwb",
        "name": "Foundation",
        "subtitle": "4 weeks · 3 days/week · bodyweight & bands only",
        "level": "beginner",
        "weeks": 4,
        "days_per_week": 3,
        "focus": "Learn the six patterns, build the habit",
        "order_index": 10,
        "equipment_used": ["bodyweight", "bands"],
        "equipment_profile": "bodyweight_bands",
        "description": (
            "Your first month with nothing but a mat, a wall and a set of bands. "
            "Three full-body days, one exercise per movement pattern, every set "
            "stopping well short of failure. Week 1 should feel almost too easy — "
            "that's the point. Miss a day and the plan still works."
        ),
        "weekly_progression": [
            "Week 1 — Movement week. Keep 3–4 reps in the tank. Pick the easiest "
            "chain step you can do cleanly.",
            "Week 2 — Add 2–3 reps per set where last week felt smooth.",
            "Week 3 — Add one set to the first two moves of each day.",
            "Week 4 — Hold everything steady, sharpen the form, then move up a "
            "step on any chain that feels easy. Next: Build.",
        ],
        "days": [
            {
                "day_index": 1, "name": "Day A · Full Body", "focus": "Push, pull, squat",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15", "rest_seconds": 30,
                     "coach_note": "Warm-up — do these before every session."},
                    {"exercise": "incline-push-up", "sets": 3, "rep_scheme": "10-15", "rest_seconds": 75,
                     "coach_note": "Lower your hand height as you get stronger."},
                    {"exercise": "band-bent-over-row", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 75},
                    {"exercise": "bodyweight-squat", "sets": 3, "rep_scheme": "10-15", "rest_seconds": 75},
                    {"exercise": "glute-bridge", "sets": 2, "rep_scheme": "12-15", "rest_seconds": 45},
                    {"exercise": "dead-bug", "sets": 3, "rep_scheme": "8 / side", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 2, "name": "Day B · Full Body", "focus": "Hinge, overhead, core",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15", "rest_seconds": 30,
                     "coach_note": "Warm-up."},
                    {"exercise": "band-good-morning", "sets": 3, "rep_scheme": "10-15", "rest_seconds": 75,
                     "coach_note": "Hips back, flat back, soft knees."},
                    {"exercise": "band-overhead-press", "sets": 3, "rep_scheme": "10-15", "rest_seconds": 75},
                    {"exercise": "band-lat-pulldown", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 75},
                    {"exercise": "reverse-lunge", "sets": 2, "rep_scheme": "8 / side", "rest_seconds": 60},
                    {"exercise": "plank", "sets": 3, "rep_scheme": "20-40 sec", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 3, "name": "Day C · Full Body", "focus": "Single-leg, arms, core",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15", "rest_seconds": 30,
                     "coach_note": "Warm-up."},
                    {"exercise": "knee-push-up", "sets": 3, "rep_scheme": "8-12", "rest_seconds": 60},
                    {"exercise": "superman", "sets": 3, "rep_scheme": "10-12", "rest_seconds": 45},
                    {"exercise": "split-squat", "sets": 3, "rep_scheme": "8-10 / side", "rest_seconds": 60},
                    {"exercise": "band-bicep-curl", "sets": 2, "rep_scheme": "12-15", "rest_seconds": 45},
                    {"exercise": "side-plank", "sets": 2, "rep_scheme": "15-30 sec / side", "rest_seconds": 30},
                ],
            },
        ],
    },
    {
        "slug": "build-bwb",
        "name": "Build",
        "subtitle": "6 weeks · 4 days/week · upper / lower · bodyweight & bands",
        "level": "intermediate",
        "weeks": 6,
        "days_per_week": 4,
        "focus": "Add muscle and work capacity",
        "order_index": 11,
        "equipment_used": ["bodyweight", "bands"],
        "equipment_profile": "bodyweight_bands",
        "description": (
            "Four focused days — two upper, two lower — with enough volume and "
            "intensity variety to actually build muscle from bands and bodyweight. "
            "Antagonist supersets keep sessions under 45 minutes. Week 4 is lighter "
            "on purpose. Falls back to 3 full-body days if that's all your week allows."
        ),
        "weekly_progression": [
            "Week 1 — Find your working chain steps. Every set ends with 2–3 reps left.",
            "Week 2 — Add reps toward the top of each range, or a heavier band.",
            "Week 3 — Add a set to one accessory per day; step up a chain rung where you own the range.",
            "Week 4 — Deload: drop one set from every exercise, keep the reps easy.",
            "Week 5 — Back to progressing; you should beat your Week 3 numbers.",
            "Week 6 — Push a strong-but-clean top set on each first exercise, then reassess. Next: Peak.",
        ],
        "days": [
            {
                "day_index": 1, "name": "Upper A · Push focus", "focus": "Chest, shoulders, triceps",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 2, "rep_scheme": "15", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "push-up", "sets": 4, "rep_scheme": "8-12", "rest_seconds": 90,
                     "coach_note": "Tempo 3-1-1. Elevate the feet when 12 is easy."},
                    {"exercise": "band-bent-over-row", "sets": 4, "rep_scheme": "10-12", "rest_seconds": 60,
                     "coach_note": "Superset with the push-up above."},
                    {"exercise": "pike-push-up", "sets": 3, "rep_scheme": "8-12", "rest_seconds": 75},
                    {"exercise": "band-lat-pulldown", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 60},
                    {"exercise": "band-bicep-curl", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 45},
                    {"exercise": "band-pallof-press", "sets": 3, "rep_scheme": "10 / side", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 2, "name": "Lower A · Squat focus", "focus": "Quads, glutes",
                "slots": [
                    {"exercise": "band-lateral-walk", "sets": 2, "rep_scheme": "10 / side", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "bulgarian-split-squat", "sets": 4, "rep_scheme": "8-12 / side", "rest_seconds": 90},
                    {"exercise": "band-pull-through", "sets": 4, "rep_scheme": "12-15", "rest_seconds": 75},
                    {"exercise": "reverse-lunge", "sets": 3, "rep_scheme": "10 / side", "rest_seconds": 60},
                    {"exercise": "single-leg-rdl", "sets": 3, "rep_scheme": "8-10 / side", "rest_seconds": 60},
                    {"exercise": "single-leg-calf-raise", "sets": 3, "rep_scheme": "12-20 / side", "rest_seconds": 45},
                    {"exercise": "hollow-body-hold", "sets": 3, "rep_scheme": "20-40 sec", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 3, "name": "Upper B · Pull focus", "focus": "Back, rear delts, biceps",
                "slots": [
                    {"exercise": "band-face-pull", "sets": 2, "rep_scheme": "15", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "band-bent-over-row", "sets": 4, "rep_scheme": "10-12", "rest_seconds": 90,
                     "coach_note": "Single-arm, heavier band. Slow eccentric."},
                    {"exercise": "decline-push-up", "sets": 4, "rep_scheme": "8-12", "rest_seconds": 75},
                    {"exercise": "band-straight-arm-pulldown", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 60},
                    {"exercise": "band-overhead-press", "sets": 3, "rep_scheme": "8-12", "rest_seconds": 60},
                    {"exercise": "superman", "sets": 3, "rep_scheme": "10-12", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 4, "name": "Lower B · Hinge focus", "focus": "Hamstrings, glutes, power",
                "slots": [
                    {"exercise": "band-lateral-walk", "sets": 2, "rep_scheme": "10 / side", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "band-good-morning", "sets": 4, "rep_scheme": "10-15", "rest_seconds": 90},
                    {"exercise": "skater-hops", "sets": 4, "rep_scheme": "8 / side", "rest_seconds": 60,
                     "coach_note": "Land soft and balanced before the next hop."},
                    {"exercise": "cossack-squat", "sets": 3, "rep_scheme": "8 / side", "rest_seconds": 60},
                    {"exercise": "glute-bridge", "sets": 3, "rep_scheme": "15-20", "rest_seconds": 45,
                     "coach_note": "Single-leg once bodyweight is easy."},
                    {"exercise": "side-plank", "sets": 3, "rep_scheme": "20-40 sec / side", "rest_seconds": 30},
                ],
            },
        ],
    },
    {
        "slug": "peak-bwb",
        "name": "Peak",
        "subtitle": "6 weeks · 4 days/week · max strength & skill · bodyweight & bands",
        "level": "advanced",
        "weeks": 6,
        "days_per_week": 4,
        "focus": "Hard leverage variants, unilateral strength, power",
        "order_index": 12,
        "equipment_used": ["bodyweight", "bands"],
        "equipment_profile": "bodyweight_bands",
        "description": (
            "For when full push-ups and split squats are easy. Intensity now comes "
            "from leverage, single-limb work and speed — pistols, archer push-ups, "
            "deficit and decline work, band-resisted power. Low reps on the hard "
            "stuff, a lighter fourth week, then reassess. Best after a full run of Build."
        ),
        "weekly_progression": [
            "Week 1 — Re-establish working steps across all four days. Leave 2–3 reps in reserve.",
            "Week 2 — Add reps or a harder chain step on the first exercise of each day.",
            "Week 3 — Add a set to one accessory per day; peak the primary lifts.",
            "Week 4 — Deload: half the sets, moderate effort.",
            "Week 5 — Ramp back to beat Week 3.",
            "Week 6 — One hard top set per primary lift, then take a few easy days.",
        ],
        "days": [
            {
                "day_index": 1, "name": "Push · Strength", "focus": "Chest, shoulders, triceps",
                "slots": [
                    {"exercise": "band-pull-apart", "sets": 3, "rep_scheme": "15", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "archer-push-up", "sets": 5, "rep_scheme": "4-6 / side", "rest_seconds": 150,
                     "coach_note": "Primary. Cluster the reps if needed."},
                    {"exercise": "deficit-push-up", "sets": 4, "rep_scheme": "6-10", "rest_seconds": 120,
                     "coach_note": "3-second eccentric."},
                    {"exercise": "pike-push-up", "sets": 4, "rep_scheme": "5-8", "rest_seconds": 120,
                     "coach_note": "Feet elevated / deficit."},
                    {"exercise": "band-overhead-press", "sets": 3, "rep_scheme": "8-10", "rest_seconds": 75,
                     "coach_note": "Doubled band."},
                    {"exercise": "band-chest-press", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 60},
                ],
            },
            {
                "day_index": 2, "name": "Legs · Squat & Power", "focus": "Quads, glutes, power",
                "slots": [
                    {"exercise": "band-lateral-walk", "sets": 3, "rep_scheme": "12 / side", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "pistol-squat", "sets": 5, "rep_scheme": "3-5 / side", "rest_seconds": 180,
                     "coach_note": "Primary. Slow eccentric to a box if you don't own the full rep."},
                    {"exercise": "skater-hops", "sets": 5, "rep_scheme": "5 / side", "rest_seconds": 90,
                     "coach_note": "Max distance, soft landing."},
                    {"exercise": "bulgarian-split-squat", "sets": 4, "rep_scheme": "6-10 / side", "rest_seconds": 90},
                    {"exercise": "single-leg-rdl", "sets": 4, "rep_scheme": "8-10 / side", "rest_seconds": 75},
                    {"exercise": "single-leg-calf-raise", "sets": 4, "rep_scheme": "12-15 / side", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 3, "name": "Pull · Strength", "focus": "Back, rear delts, biceps",
                "slots": [
                    {"exercise": "band-face-pull", "sets": 3, "rep_scheme": "15", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "band-bent-over-row", "sets": 5, "rep_scheme": "5-8 / side", "rest_seconds": 150,
                     "coach_note": "Primary. Heaviest band, single-arm, pause each rep."},
                    {"exercise": "band-lat-pulldown", "sets": 4, "rep_scheme": "8-12 / side", "rest_seconds": 90,
                     "coach_note": "Single-arm."},
                    {"exercise": "band-straight-arm-pulldown", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 60},
                    {"exercise": "superman", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 45},
                    {"exercise": "band-bicep-curl", "sets": 3, "rep_scheme": "10-12", "rest_seconds": 45},
                ],
            },
            {
                "day_index": 4, "name": "Legs · Hinge & Core", "focus": "Hamstrings, glutes, core",
                "slots": [
                    {"exercise": "band-lateral-walk", "sets": 3, "rep_scheme": "12 / side", "rest_seconds": 30, "coach_note": "Warm-up."},
                    {"exercise": "band-pull-through", "sets": 5, "rep_scheme": "10-12", "rest_seconds": 120,
                     "coach_note": "Primary. Heaviest band, explosive hips."},
                    {"exercise": "cossack-squat", "sets": 4, "rep_scheme": "8-10 / side", "rest_seconds": 75},
                    {"exercise": "band-good-morning", "sets": 3, "rep_scheme": "12-15", "rest_seconds": 60},
                    {"exercise": "hollow-body-hold", "sets": 4, "rep_scheme": "30-60 sec", "rest_seconds": 45},
                    {"exercise": "band-pallof-press", "sets": 3, "rep_scheme": "10-12 / side", "rest_seconds": 45},
                ],
            },
        ],
    },
]
