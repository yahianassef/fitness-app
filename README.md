# 💪 Fitness Comeback

A full-stack web app for getting back in shape with **just bodyweight and resistance
bands** — no gym required. Pick your level (Beginner / Intermediate / Advanced) and get
a complete program with a form video for every exercise, progression ladders that scale
as you get stronger, and simple progress tracking.

Runs entirely on your machine in development mode — **no build step, no deployment, no
app-store anything.** Works the same in a desktop browser and in mobile Safari on iOS
(mobile-first responsive design, installable PWA, bottom tab bar, large tap targets).

### The redesign at a glance

- **Three fitness levels.** `Profile.fitness_level` scales the sets, reps, rest, tempo
  and RIR everywhere, and picks which rung of each progression chain a workout uses.
  Change it any time from the Home tab; per-exercise progress is tracked separately.
- **Dedicated "Moves" tab (Bodyweight & Bands).** Route `/moves`. Filter by equipment
  (bodyweight / bands), browse **89 exercises** (125 in the full library) organised into
  14 movement patterns and progression ladders (wall push-up → … → one-arm-style archer
  push-up), or tap a **quick-start card** to drop a full session into your log in 2 taps.
- **Motivational UI.** Gradient accent, animated progress ring, streak flame, page
  transitions, tactile button press, and a confetti + haptic **celebration** when a
  workout is saved.
- **Three bodyweight/bands programs** — `Foundation` (beginner, 4 wk), `Build`
  (intermediate, 6 wk), `Peak` (advanced, 6 wk). The old mixed-equipment programs are
  still there under "Every program".
- **Progression chains on every exercise page** — one-tap regression / progression and
  the named scaling lever ("harder because the lever is *lever length*").

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | **Python / Django 5 + Django REST Framework** | REST API, token auth, ORM + migrations, admin site |
| Database | **SQLite** (Django default) | Zero setup. The ORM/queries are standard — point `DATABASES` at PostgreSQL and it works unchanged. |
| Frontend | **Vue 3** (vendored, no build) | ES-module SPA loaded via an import map. `vue.esm-browser.prod.js` is committed under `web/static/web/vendor/`, so it runs fully offline. |
| Charts | Hand-rolled inline SVG | No chart library. |
| Video | YouTube embeds via `youtube-nocookie.com` | Click-to-load, so nothing contacts YouTube until the user presses play. |
| Auth | DRF `TokenAuthentication` | Email + password signup/login. No OAuth. |

> **Why Django + Vue and not Node/React?** This machine has no Node.js installed, and the
> brief explicitly allows *“Node.js/Express **or** Python/Django”* and *“React **or**
> Vue.js.”* Django + a vendored Vue SPA gives a true one-command local run (`python
> manage.py runserver`) with no toolchain to install.

---

## Quick start

Requires **Python 3.10+** (developed on 3.12). From this folder:

### Windows (PowerShell)
```powershell
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python manage.py migrate
venv\Scripts\python manage.py seed --demo-user
venv\Scripts\python manage.py runserver
```

### macOS / Linux
```bash
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python manage.py migrate
venv/bin/python manage.py seed --demo-user
venv/bin/python manage.py runserver
```

Then open **http://127.0.0.1:8000/**.

> To use it from a phone as well, swap the last command for **`python serve.py`** — same
> app, but reachable over your Wi-Fi with a QR code. See *“Open it on your iPhone”* below.

- **Try it instantly:** on the sign-in page click **“Try the demo account”**
  (`demo@fitnesscomeback.app` / `comeback123`) — it comes preloaded with an active
  program and ~5 weeks of sample workouts so the dashboard and progress graphs have data.
- Or click **“Start my comeback”** to create your own account and go through onboarding.

---

## 📱 Open it on your iPhone (Safari)

Your iPhone and computer just need to be on the **same Wi-Fi**.

1. Start the app with the phone-friendly launcher instead of `runserver`:
   ```bash
   python serve.py
   ```
   It binds to your network and prints your address plus a **QR code** right in the
   terminal.

2. On the computer, open **http://127.0.0.1:8000/connect** (or click **“📱 Phone”** in
   the top bar). That page shows a big QR code and step-by-step instructions.

3. On the iPhone, open the **Camera** app, point it at the QR code, and tap the banner —
   Safari opens the app. (Or just type the `http://<computer-ip>:8000/` address shown on
   the connect page into Safari.)

4. **Make it feel like a real app:** in Safari tap **Share → Add to Home Screen**. It
   then launches full-screen with its own “Comeback” icon. (The app shows a one-time
   hint for this on iOS.)

> Plain `python manage.py runserver` only listens on the computer itself. Use
> `python serve.py` (or `python manage.py runserver 0.0.0.0:8000`) so the phone can reach
> it. If your OS firewall prompts on first run, allow Python on private networks.

---

## What’s inside

### 1. Equipment library — `/equipment`
Seven categories: dumbbells, barbells, kettlebells, bodyweight, resistance bands,
machines, cables. Each opens a filtered list of every exercise for that equipment.

### 2. Exercise database — `/exercises`  (**53 exercises**)
Every exercise has: name, target muscle groups (primary + secondary), difficulty
(beginner / intermediate / advanced), an embedded 30–60s **demo video**, numbered
written instructions, form tips, and common mistakes.
Filter by **equipment**, **target muscle**, **difficulty**, and free-text **search**.

### 3. Beginner-focused programs — `/programs`  (**3 programs**)
| Program | Length | Days/wk | Equipment |
|---|---|---|---|
| **Foundation Reset** | 4 weeks | 3 | machines, dumbbells, bodyweight, bands |
| **Full Body Basics** | 6 weeks | 3 | barbell + dumbbell compounds |
| **Comeback Strength** | 6 weeks | 4 | upper/lower split, mixed equipment |

Each program defines its training days once and carries a **week-by-week progression
note** so it ramps gently instead of overwhelming a returner. One tap loads a day
straight into the workout logger.

### 4. Workout tracker — `/log` and `/history`
Log date, exercises, and per-set reps / weight, plus optional session RPE and notes.
Empty sets are ignored, so a rough day can be a single set. Full history, grouped by
month, with per-session volume; open any workout to see every set and its estimated 1RM.

### 5. Dashboard — `/dashboard`
Current program + **next session** (with a one-tap “log this workout”), sessions
completed this week vs. your target, a consecutive-week streak, personal bests
(estimated 1RM), and recent workouts.

### 6. Progress — `/progress`
Inline SVG graphs: workouts per week (vs. goal) for the last 12 weeks, total training
volume per session, and estimated-1RM trend per lift with a start-to-now delta.

### Onboarding — `/onboarding`
Three quick steps (goal → experience & availability → recommended program). The program
recommendation is derived from the answers; picking one also completes onboarding.

---

## Project structure

```
fitness-app/
├── manage.py
├── serve.py                # phone-friendly launcher (LAN bind + terminal QR code)
├── requirements.txt
├── config/                 # Django project (settings, root urls)
├── api/                    # REST API app
│   ├── models.py           # Profile, Exercise, Program/Day/Slot, Workout, SetEntry
│   ├── serializers.py
│   ├── views.py            # function-based DRF views
│   ├── urls.py             # /api/... routes
│   ├── admin.py            # full admin for content editing
│   ├── tests.py            # end-to-end API tests
│   ├── seed_data/
│   │   ├── exercises.py    # the 53-exercise library (edit video IDs here)
│   │   └── programs.py     # the 3 programs
│   └── management/commands/seed.py
└── web/                    # SPA host app
    ├── views.py            # serves the SPA shell + the /connect QR page (LAN IP + QR)
    ├── make_icons.py       # regenerates the app icons (pure Python, no Pillow)
    ├── templates/web/
    │   ├── index.html      # SPA shell + PWA / "Add to Home Screen" meta
    │   └── connect.html    # "open on your phone" page
    └── static/web/
        ├── css/styles.css
        ├── site.webmanifest
        ├── icons/          # generated PNG app icons (incl. apple-touch-icon)
        ├── vendor/vue.esm-browser.prod.js   # committed — no CDN needed
        └── js/
            ├── main.js      # app root + router wiring + guards
            ├── router.js    # ~60-line history router
            ├── api.js       # fetch wrapper (adds token, unwraps errors)
            ├── store.js     # reactive auth state
            ├── draft.js     # the in-progress workout (persisted to localStorage)
            ├── components/  # VideoEmbed, Charts, ExerciseCard
            └── pages/       # one module per screen
```

---

## API reference

Base URL `http://127.0.0.1:8000/api`. Auth: send `Authorization: Token <key>`.
The DRF browsable API is on at each endpoint if you open it in a browser.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/signup/` | – | `{name,email,password}` → `{token,user}` |
| POST | `/auth/login/` | – | `{email,password}` → `{token,user}` |
| GET | `/auth/me/` | ✓ | current user + profile |
| PATCH | `/auth/profile/` | ✓ | update goal / experience / days_per_week / unit … |
| GET | `/equipment/` | – | categories with exercise counts + blurbs |
| GET | `/muscles/` | – | distinct muscle list (for the filter) |
| GET | `/exercises/` | – | `?equipment=&muscle=&difficulty=&q=` |
| GET | `/exercises/<slug>/` | – | full detail incl. video URLs, tips, mistakes |
| GET | `/programs/` | – | program list |
| GET | `/programs/<slug>/` | – | program with days, slots, weekly progression |
| POST | `/programs/<slug>/select/` | ✓ | set active program (also finishes onboarding) |
| GET / POST | `/workouts/` | ✓ | list / create workouts (nested set entries) |
| GET / PUT / PATCH / DELETE | `/workouts/<id>/` | ✓ | single workout |
| GET | `/dashboard/` | ✓ | dashboard payload |
| GET | `/progress/` | ✓ | chart series |

---

## Management commands

```bash
python manage.py seed                # add/update the library + programs (keeps user data)
python manage.py seed --reset        # wipe library + programs first, then reseed
python manage.py seed --demo-user    # also (re)create the demo account with sample logs
python manage.py createsuperuser     # then browse /admin/ to edit content in a UI
python manage.py test                # run the API test suite (6 tests)
```

---

## About the demo videos

Each exercise stores a YouTube `video_id` pointing at a focused “how-to / proper form”
demo from instructional channels (Runna, NASM, Team Evolve, and similar). They’re
embedded through `youtube-nocookie.com` and only load after the user taps play.

To swap a video, edit its `video_id` in
[`api/seed_data/exercises.py`](api/seed_data/exercises.py) and run
`python manage.py seed`. You can also point an exercise at a self-hosted file by setting
`video_provider` to a full URL — see `Exercise.video_embed_url` in
[`api/models.py`](api/models.py).

---

## How this maps to the brief

- **Equipment coverage** — all 7 categories, 53 exercises.
- **Exercise detail** — muscles, difficulty, video, instructions, form tips, mistakes. ✔
- **2–3 progressive comeback programs, 4–6 weeks, mixed equipment.** ✔ (3 programs)
- **Workout tracker with per-set reps/sets/weight + history.** ✔
- **Dashboard: current program, this-week completion, next session, progress graphs.** ✔
- **Search & filter by equipment / muscle / difficulty.** ✔
- **Auth: email + password, no OAuth.** ✔
- **Mobile-first, works in PC browser and mobile Safari; large text & buttons; warm tone.** ✔
- **Runs locally, no deployment.** ✔
