// Local, offline-first replacement for the Django REST API.
//
// The app used to talk to /api/* over the network. On GitHub Pages there is no
// server, so every endpoint is answered here: the exercise library and programs
// come from a baked JSON bundle, and everything personal (profile, workouts)
// lives in this browser via localStorage.
//
// The exported surface is identical to the old fetch wrapper, so no page
// component needed changing.

const TOKEN_KEY = 'fc_token';
const PROFILE_KEY = 'fc_profile';
const WORKOUTS_KEY = 'fc_workouts';
const SEQ_KEY = 'fc_seq';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
export function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// --- storage helpers --------------------------------------------------------
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    throw new ApiError('This device is out of storage, so that could not be saved.', 507, null);
  }
}
function nextId() {
  const n = (read(SEQ_KEY, 0) || 0) + 1;
  write(SEQ_KEY, n);
  return n;
}

// --- baked data -------------------------------------------------------------
let dataPromise = null;
function data() {
  if (!dataPromise) {
    const url = new URL('data/app-data.json', document.baseURI).href;
    dataPromise = fetch(url).then((r) => {
      if (!r.ok) throw new ApiError('Could not load the exercise library.', r.status, null);
      return r.json();
    }).then(hydrate);
  }
  return dataPromise;
}

// Program slots ship as a slug and are rejoined here, once, against the
// exercises map. Embedding the full object per slot more than doubled the
// bundle for no benefit.
function hydrate(d) {
  const bySlug = Object.fromEntries(d.exercises.map((e) => [e.slug, e]));
  d.exerciseBySlug = bySlug;
  for (const p of d.programs) {
    for (const day of p.days) {
      for (const slot of day.slots) {
        if (slot.exercise_slug && !slot.exercise) slot.exercise = bySlug[slot.exercise_slug];
      }
    }
  }
  return d;
}

// --- profile ----------------------------------------------------------------
const BLANK_PROFILE = {
  display_name: '', goal: 'general', experience: 'returning',
  fitness_level: 'beginner', months_off: 6, days_per_week: 3, unit: 'lb',
  onboarded: false, active_program_slug: null, active_program_name: null,
};

function currentProfile() { return read(PROFILE_KEY, null); }

async function userPayload() {
  const p = currentProfile();
  if (!p) throw new ApiError('Not signed in.', 401, null);
  const profile = { ...BLANK_PROFILE, ...p };
  if (profile.active_program_slug && !profile.active_program_name) {
    const d = await data();
    const prog = d.programs.find((x) => x.slug === profile.active_program_slug);
    profile.active_program_name = prog ? prog.name : null;
  }
  return { id: 1, username: profile.email || 'me', email: profile.email || '', profile };
}

// --- date helpers (ISO weeks, matching the old Python behaviour) -------------
const DAY = 86400000;
function today() { return new Date().toISOString().slice(0, 10); }
function parseDate(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function isoWeek(dt) {
  const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / DAY + 1) / 7);
  return [d.getUTCFullYear(), week];
}
function weekKey(dt) { return isoWeek(dt).join('-'); }
function mondayOf(dt) {
  const d = new Date(dt.getTime());
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

// --- workouts ---------------------------------------------------------------
function estimated1rm(reps, weight) {
  if (!weight || !reps) return null;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

async function hydrateWorkout(w) {
  const d = await data();
  const bySlug = d.exerciseBySlug;   // built once in hydrate(), not per workout
  const prog = w.program_slug ? d.programs.find((p) => p.slug === w.program_slug) : null;
  let dayName = null;
  if (prog && w.program_day != null) {
    const day = prog.days.find((x) => String(x.id) === String(w.program_day));
    dayName = day ? day.name : null;
  }
  const sets = (w.set_entries || []).map((s) => ({
    ...s,
    exercise_name: bySlug[s.exercise_slug] ? bySlug[s.exercise_slug].name : s.exercise_slug,
    estimated_1rm: estimated1rm(s.reps, s.weight),
  }));
  const total = sets.reduce(
    (a, s) => a + (s.is_warmup ? 0 : (s.reps || 0) * (s.weight || 0)), 0,
  );
  return {
    ...w,
    program_name: prog ? prog.name : null,
    program_day_name: dayName,
    set_entries: sets,
    total_volume: total,
  };
}

function loadWorkouts() {
  const list = read(WORKOUTS_KEY, []);
  list.sort((a, b) => (
    a.performed_on < b.performed_on ? 1
      : a.performed_on > b.performed_on ? -1
        : b.id - a.id
  ));
  return list;
}
function hydrateAll(list) { return Promise.all(list.map(hydrateWorkout)); }

// --- filtering --------------------------------------------------------------
function applyExerciseFilters(list, q) {
  let out = list;
  const eq = q.get('equipment');
  if (eq) {
    const wanted = eq.split(',').map((s) => s.trim()).filter(Boolean);
    out = out.filter((e) => wanted.includes(e.equipment));
  }
  const diff = q.get('difficulty');
  if (diff) out = out.filter((e) => e.difficulty === diff);
  const pattern = q.get('pattern');
  if (pattern) out = out.filter((e) => e.movement_pattern === pattern);
  const anchor = q.get('needs_anchor');
  if (anchor) out = out.filter((e) => e.needs_anchor === anchor);
  const search = q.get('q');
  if (search) {
    const n = search.toLowerCase();
    out = out.filter((e) => e.name.toLowerCase().includes(n));
  }
  const muscle = q.get('muscle');
  if (muscle) {
    const n = muscle.toLowerCase();
    out = out.filter((e) => [...e.primary_muscles, ...e.secondary_muscles]
      .some((m) => m.toLowerCase() === n));
  }
  return [...out].sort((a, b) => (
    (a.chain_key || '').localeCompare(b.chain_key || '')
    || (a.chain_order || 0) - (b.chain_order || 0)
    || a.name.localeCompare(b.name)
  ));
}

// --- endpoint table ---------------------------------------------------------
const routes = [
  ['GET', /^\/auth\/me\/$/, () => userPayload()],

  ['POST', /^\/auth\/signup\/$/, async (m, body) => {
    const email = (body.email || '').toLowerCase().trim();
    if (!body.name) {
      throw new ApiError('Enter your name.', 400, { name: ['This field is required.'] });
    }
    if (!email) {
      throw new ApiError('Enter an email address.', 400, { email: ['This field is required.'] });
    }
    if ((body.password || '').length < 8) {
      throw new ApiError('Password must be at least 8 characters.', 400, {
        password: ['This password is too short. It must contain at least 8 characters.'],
      });
    }
    write(PROFILE_KEY, { ...BLANK_PROFILE, email, display_name: body.name });
    return { token: 'local', user: await userPayload() };
  }],

  ['POST', /^\/auth\/login\/$/, async (m, body) => {
    const email = (body.email || '').toLowerCase().trim();
    const p = currentProfile();
    if (!p) {
      throw new ApiError(
        'No profile saved on this device yet. Tap "Start my comeback" to create one.',
        400, null,
      );
    }
    if (p.email && email && p.email !== email) {
      throw new ApiError(`This device holds the profile for ${p.email}.`, 400, null);
    }
    return { token: 'local', user: await userPayload() };
  }],

  ['PATCH', /^\/auth\/profile\/$/, async (m, body) => {
    const p = currentProfile() || { ...BLANK_PROFILE };
    const next = { ...p, ...body };
    if ('active_program_slug' in body) next.active_program_name = null;
    write(PROFILE_KEY, next);
    return userPayload();
  }],

  ['GET', /^\/equipment\/$/, async () => (await data()).equipment],
  ['GET', /^\/muscles\/$/, async () => (await data()).muscles],
  ['GET', /^\/level-defaults\/$/, async () => (await data()).level_defaults],

  ['GET', /^\/exercises\/$/, async (m, b, q) => applyExerciseFilters((await data()).exercises, q)],

  ['GET', /^\/exercises\/([^/]+)\/$/, async (m) => {
    const ex = (await data()).exercises.find((e) => e.slug === m[1]);
    if (!ex) throw new ApiError('Not found.', 404, null);
    return ex;
  }],

  ['GET', /^\/moves\/$/, async (m, b, q) => {
    const d = await data();
    let list = d.exercises.filter((e) => ['bodyweight', 'bands'].includes(e.equipment));
    const eq = q.get('equipment');
    if (eq) {
      const wanted = eq.split(',').map((s) => s.trim()).filter(Boolean);
      list = list.filter((e) => wanted.includes(e.equipment));
    }
    const level = q.get('level');
    if (level) list = list.filter((e) => e.difficulty === level);
    const anchor = q.get('needs_anchor');
    if (anchor) list = list.filter((e) => e.needs_anchor === anchor);

    const patterns = [];
    for (const [key, label] of d.pattern_choices) {
      if (key === 'other') continue;
      const group = list.filter((e) => e.movement_pattern === key);
      if (!group.length) continue;
      const chains = {};
      const loose = [];
      for (const e of group) {
        if (e.chain_key) {
          if (!chains[e.chain_key]) chains[e.chain_key] = [];
          chains[e.chain_key].push(e);
        } else {
          loose.push(e);
        }
      }
      patterns.push({
        key,
        label,
        blurb: d.pattern_blurbs[key] || '',
        exercise_count: group.length,
        chains: Object.entries(chains).map(([k, items]) => ({
          key: k,
          steps: [...items].sort((a, b) => a.chain_order - b.chain_order),
        })),
        standalone: loose,
      });
    }
    return { patterns, total: list.length };
  }],

  ['GET', /^\/programs\/$/, async (m, b, q) => {
    let list = (await data()).programs;
    const level = q.get('level');
    if (level) list = list.filter((p) => p.level === level);
    const prof = q.get('equipment_profile');
    if (prof) list = list.filter((p) => p.equipment_profile === prof);
    return list.map(({ days, weekly_progression, ...rest }) => rest);
  }],

  ['GET', /^\/programs\/([^/]+)\/$/, async (m) => {
    const p = (await data()).programs.find((x) => x.slug === m[1]);
    if (!p) throw new ApiError('Not found.', 404, null);
    return p;
  }],

  ['POST', /^\/programs\/([^/]+)\/select\/$/, async (m) => {
    const d = await data();
    const prog = d.programs.find((x) => x.slug === m[1]);
    if (!prog) throw new ApiError('Not found.', 404, null);
    const p = currentProfile() || { ...BLANK_PROFILE };
    write(PROFILE_KEY, {
      ...p,
      active_program_slug: prog.slug,
      active_program_name: prog.name,
      onboarded: true,
    });
    return userPayload();
  }],

  ['GET', /^\/workouts\/$/, () => hydrateAll(loadWorkouts())],

  ['POST', /^\/workouts\/$/, async (m, body) => {
    const list = read(WORKOUTS_KEY, []);
    const row = {
      id: nextId(),
      performed_on: body.performed_on || today(),
      program_slug: body.program_slug || null,
      program_day: body.program_day == null ? null : body.program_day,
      title: body.title || '',
      notes: body.notes || '',
      perceived_effort: body.perceived_effort == null ? null : body.perceived_effort,
      created_at: new Date().toISOString(),
      set_entries: (body.set_entries || []).map((s, i) => ({
        id: `${Date.now()}-${i}`,
        exercise_slug: s.exercise_slug,
        set_number: s.set_number,
        reps: s.reps == null ? null : s.reps,
        weight: s.weight == null ? null : s.weight,
        is_warmup: !!s.is_warmup,
        completed: s.completed !== false,
      })),
    };
    list.push(row);
    write(WORKOUTS_KEY, list);
    return hydrateWorkout(row);
  }],

  ['GET', /^\/workouts\/([^/]+)\/$/, async (m) => {
    const w = read(WORKOUTS_KEY, []).find((x) => String(x.id) === m[1]);
    if (!w) throw new ApiError('Not found.', 404, null);
    return hydrateWorkout(w);
  }],

  ['DELETE', /^\/workouts\/([^/]+)\/$/, async (m) => {
    write(WORKOUTS_KEY, read(WORKOUTS_KEY, []).filter((x) => String(x.id) !== m[1]));
    return null;
  }],

  ['GET', /^\/dashboard\/$/, async () => {
    const d = await data();
    const user = await userPayload();
    const profile = user.profile;
    const all = await hydrateAll(loadWorkouts());

    const now = parseDate(today());
    const weekStart = mondayOf(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY);
    const thisWeek = all.filter((w) => {
      const t = parseDate(w.performed_on).getTime();
      return t >= weekStart.getTime() && t < weekEnd.getTime();
    });

    const prog = profile.active_program_slug
      ? d.programs.find((p) => p.slug === profile.active_program_slug)
      : null;
    const target = profile.days_per_week || (prog ? prog.days_per_week : 3);

    let nextDay = null;
    if (prog && prog.days.length) {
      const done = new Set(
        thisWeek.filter((w) => w.program_day != null).map((w) => String(w.program_day)),
      );
      nextDay = prog.days.find((x) => !done.has(String(x.id))) || prog.days[0];
    }

    const best = {};
    for (const w of all) {
      for (const s of w.set_entries) {
        if (s.estimated_1rm == null) continue;
        const cur = best[s.exercise_name];
        if (!cur || s.estimated_1rm > cur.estimated_1rm) {
          best[s.exercise_name] = {
            exercise: s.exercise_name,
            estimated_1rm: s.estimated_1rm,
            weight: s.weight,
            reps: s.reps,
            date: w.performed_on,
          };
        }
      }
    }

    // Consecutive-week streak.
    const weeks = new Set(all.map((w) => weekKey(parseDate(w.performed_on))));
    let streak = 0;
    let cursor = new Date(now.getTime());
    while (weeks.has(weekKey(cursor))) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 7 * DAY);
    }

    return {
      profile,
      level_defaults: d.level_defaults[profile.fitness_level] || d.level_defaults.beginner,
      streak_days: streak,
      this_week: { completed: thisWeek.length, target, workouts: thisWeek },
      next_day: nextDay,
      recent_workouts: all.slice(0, 5),
      total_workouts: all.length,
      personal_bests: Object.values(best)
        .sort((a, b) => b.estimated_1rm - a.estimated_1rm)
        .slice(0, 6),
    };
  }],

  ['GET', /^\/progress\/$/, async () => {
    const user = await userPayload();
    const all = (await hydrateAll(loadWorkouts()))
      .slice()
      .sort((a, b) => (a.performed_on < b.performed_on ? -1 : 1));

    const volumeByDate = [];
    const perExercise = {};
    for (const w of all) {
      let vol = 0;
      const top = {};
      for (const s of w.set_entries) {
        if (s.is_warmup) continue;
        vol += (s.reps || 0) * (s.weight || 0);
        if (s.estimated_1rm == null) continue;
        const k = s.exercise_name;
        if (!top[k] || s.estimated_1rm > top[k].estimated_1rm) {
          top[k] = {
            date: w.performed_on,
            estimated_1rm: s.estimated_1rm,
            top_weight: s.weight,
            reps: s.reps,
          };
        }
      }
      volumeByDate.push({ date: w.performed_on, volume: Math.round(vol * 10) / 10 });
      for (const [name, point] of Object.entries(top)) {
        if (!perExercise[name]) perExercise[name] = [];
        perExercise[name].push(point);
      }
    }

    const counts = {};
    for (const w of all) {
      const k = weekKey(parseDate(w.performed_on));
      counts[k] = (counts[k] || 0) + 1;
    }
    const weekly = [];
    const now = parseDate(today());
    for (let i = 11; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 7 * DAY);
      const [y, wk] = isoWeek(day);
      weekly.push({
        week: `${y}-W${String(wk).padStart(2, '0')}`,
        count: counts[`${y}-${wk}`] || 0,
      });
    }

    const tracked = Object.entries(perExercise)
      .map(([exercise, points]) => ({ exercise, points }))
      .sort((a, b) => b.points.length - a.points.length);

    return {
      volume_by_date: volumeByDate,
      weekly_workouts: weekly,
      tracked_exercises: tracked,
      unit: user.profile.unit,
    };
  }],
];

async function request(method, path, body) {
  const [rawPath, search = ''] = path.split('?');
  const query = new URLSearchParams(search);
  for (const [m, re, handler] of routes) {
    if (m !== method) continue;
    const match = re.exec(rawPath);
    if (match) return handler(match, body || {}, query);
  }
  throw new ApiError(`No local handler for ${method} ${path}`, 404, null);
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  patch: (p, b) => request('PATCH', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),
  del: (p) => request('DELETE', p),
};
