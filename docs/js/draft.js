// A working "current workout" the user is building, kept in localStorage so it
// survives navigation and refreshes until they save or clear it.
import { reactive, watch } from 'vue';

const KEY = 'fc_workout_draft';

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function blank() {
  return {
    performed_on: todayISO(),
    title: '',
    notes: '',
    perceived_effort: null,
    program_slug: null,
    program_day: null,
    items: [], // [{ slug, name, rep_scheme, coach_note, sets: [{ reps, weight }] }]
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return blank();
}

export const draft = reactive(load());

watch(draft, (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ }
}, { deep: true });

export function newSet(prev) {
  return { reps: prev?.reps ?? null, weight: prev?.weight ?? null };
}

export function addExercise(ex, { sets = 3, rep_scheme = '', coach_note = '' } = {}) {
  if (draft.items.some((i) => i.slug === ex.slug)) return false;
  draft.items.push({
    slug: ex.slug,
    name: ex.name,
    rep_scheme,
    coach_note,
    sets: Array.from({ length: Math.max(1, sets) }, () => newSet()),
  });
  return true;
}

export function removeExercise(slug) {
  const i = draft.items.findIndex((x) => x.slug === slug);
  if (i > -1) draft.items.splice(i, 1);
}

export function loadFromProgramDay(program, day) {
  const fresh = blank();
  fresh.program_slug = program.slug;
  fresh.program_day = day.id;
  fresh.title = day.name;
  fresh.items = day.slots.map((s) => ({
    slug: s.exercise.slug,
    name: s.exercise.name,
    rep_scheme: s.rep_scheme,
    coach_note: s.coach_note || '',
    sets: Array.from({ length: Math.max(1, s.sets) }, () => newSet()),
  }));
  Object.assign(draft, fresh);
}

export function clearDraft() {
  Object.assign(draft, blank());
}

export function toPayload() {
  const entries = [];
  draft.items.forEach((item) => {
    item.sets.forEach((s, idx) => {
      const reps = s.reps === '' || s.reps == null ? null : Number(s.reps);
      const weight = s.weight === '' || s.weight == null ? null : Number(s.weight);
      if (reps == null && weight == null) return; // skip fully-empty sets
      entries.push({
        exercise_slug: item.slug,
        set_number: idx + 1,
        reps,
        weight,
      });
    });
  });
  return {
    performed_on: draft.performed_on,
    title: draft.title,
    notes: draft.notes,
    perceived_effort: draft.perceived_effort || null,
    program_slug: draft.program_slug,
    program_day: draft.program_day,
    set_entries: entries,
  };
}
