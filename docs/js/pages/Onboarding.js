import { store } from '../store.js';
import { api } from '../api.js';
import { navigate } from '../router.js';

const GOALS = [
  { v: 'general', t: 'Get back into a routine', d: 'Consistency first. Strength and shape follow.' },
  { v: 'strength', t: 'Rebuild strength', d: 'Focus on getting strong on the hard progressions.' },
  { v: 'muscle', t: 'Build muscle', d: 'A bit more volume once the basics feel good.' },
  { v: 'conditioning', t: 'Improve conditioning', d: 'Feel less winded on the stairs again.' },
];

const LEVELS = [
  { v: 'beginner', t: 'Beginner', d: 'New to training, or coming back from a long break. We start with movement quality and easy progressions.' },
  { v: 'intermediate', t: 'Intermediate', d: 'Full push-ups and bodyweight squats feel fine. Time to add muscle and volume.' },
  { v: 'advanced', t: 'Advanced', d: 'Split squats and decline push-ups are easy. Ready for one-arm and single-leg work, and power.' },
];

const LEVEL_PROGRAM = { beginner: 'foundation-bwb', intermediate: 'build-bwb', advanced: 'peak-bwb' };

// Quick self-check: each answer scores 1 (beginner) / 2 (intermediate) / 3 (advanced).
const CHECK = [
  {
    q: 'How many push-ups can you do with good form in one set?',
    a: ['0–5, or from the knees', '6–20 on your toes', '20+ and can do decline / archer'],
  },
  {
    q: 'A full-depth bodyweight squat, 10 slow reps, no support?',
    a: ['Hard, or I need to hold something', 'Comfortable — I can also do split squats', 'Easy — I can do assisted pistols'],
  },
];

export default {
  data() {
    return {
      step: 1,
      totalSteps: 4,
      form: {
        goal: 'general',
        fitness_level: store.profile?.fitness_level || 'beginner',
        months_off: 4,
        days_per_week: 3,
        unit: 'lb',
      },
      showCheck: false,
      checkAnswers: [null, null],
      programs: [],
      chosen: null,
      busy: false,
      error: '',
      goals: GOALS,
      levels: LEVELS,
      check: CHECK,
    };
  },
  async created() {
    const p = store.profile;
    if (p) {
      this.form.goal = p.goal;
      this.form.months_off = p.months_off;
      this.form.days_per_week = p.days_per_week;
      this.form.unit = p.unit;
    }
    const all = await api.get('/programs/?equipment_profile=bodyweight_bands');
    this.programs = all.sort((a, b) =>
      ['beginner', 'intermediate', 'advanced'].indexOf(a.level)
      - ['beginner', 'intermediate', 'advanced'].indexOf(b.level));
    this.recommend();
  },
  computed: {
    checkComplete() { return this.checkAnswers.every((a) => a !== null); },
  },
  methods: {
    recommend() {
      this.chosen = LEVEL_PROGRAM[this.form.fitness_level] || 'foundation-bwb';
    },
    applyCheck() {
      const score = this.checkAnswers.reduce((s, a) => s + (a + 1), 0) / this.checkAnswers.length;
      this.form.fitness_level = score < 1.5 ? 'beginner' : score < 2.5 ? 'intermediate' : 'advanced';
      this.showCheck = false;
      this.recommend();
    },
    next() {
      this.error = '';
      if (this.step === 2) this.recommend();
      if (this.step === 3) this.recommend();
      if (this.step < this.totalSteps) this.step += 1;
      else this.finish();
    },
    back() { if (this.step > 1) this.step -= 1; },
    async finish() {
      this.busy = true;
      this.error = '';
      try {
        await api.patch('/auth/profile/', { ...this.form });
        const user = await api.post(`/programs/${this.chosen}/select/`);
        store.setUser(user);
        store.flash('You’re all set. Let’s go!');
        navigate('/dashboard', { replace: true });
      } catch (e) {
        this.error = e.message;
        this.busy = false;
      }
    },
  },
  template: `
    <div class="page" style="max-width:560px">
      <div class="row small muted" style="justify-content:center; margin:.5rem 0 1rem; gap:.4rem">
        <span :style="{fontWeight: step===1?700:400}">Goal</span> ›
        <span :style="{fontWeight: step===2?700:400}">Level</span> ›
        <span :style="{fontWeight: step===3?700:400}">Schedule</span> ›
        <span :style="{fontWeight: step===4?700:400}">Plan</span>
      </div>

      <div v-if="step === 1" class="stack">
        <h1>What brings you back?</h1>
        <p class="muted">Pick the closest fit. You can change it later.</p>
        <label v-for="g in goals" :key="g.v" class="card card-link"
               :style="{borderColor: form.goal===g.v ? 'var(--accent)' : ''}">
          <input type="radio" name="goal" :value="g.v" v-model="form.goal" style="display:none" />
          <strong>{{ g.t }}</strong>
          <div class="small muted">{{ g.d }}</div>
        </label>
      </div>

      <div v-else-if="step === 2" class="stack">
        <h1>Your fitness level</h1>
        <p class="muted">This scales every workout — the reps, rest, and which version of each
        exercise you get. Each level is a complete program, not a watered-down one.</p>
        <label v-for="l in levels" :key="l.v" class="card card-link"
               :style="{borderColor: form.fitness_level===l.v ? 'var(--accent)' : ''}">
          <input type="radio" name="lvl" :value="l.v" v-model="form.fitness_level"
                 @change="recommend" style="display:none" />
          <strong>{{ l.t }}</strong>
          <div class="small muted">{{ l.d }}</div>
        </label>

        <button v-if="!showCheck" class="btn ghost sm" @click="showCheck = true">
          Not sure? Take the 30-second check
        </button>
        <div v-else class="card">
          <div v-for="(c, ci) in check" :key="ci" class="field">
            <label>{{ c.q }}</label>
            <label v-for="(opt, oi) in c.a" :key="oi" class="row" style="gap:.5rem; margin:.3rem 0">
              <input type="radio" :name="'chk'+ci" :value="oi" v-model.number="checkAnswers[ci]" />
              <span class="small">{{ opt }}</span>
            </label>
          </div>
          <button class="btn sm" :disabled="!checkComplete" @click="applyCheck">Use my result</button>
        </div>
      </div>

      <div v-else-if="step === 3" class="stack">
        <h1>Your schedule</h1>
        <div class="card">
          <div class="field">
            <label for="mo">Roughly how long since you trained regularly? ({{ form.months_off }} months)</label>
            <input id="mo" type="range" min="1" max="24" v-model.number="form.months_off" />
          </div>
          <div class="field">
            <label for="dw">Days per week you can realistically train</label>
            <select id="dw" v-model.number="form.days_per_week">
              <option :value="2">2 days</option>
              <option :value="3">3 days</option>
              <option :value="4">4 days</option>
              <option :value="5">5 days</option>
            </select>
          </div>
          <div class="field" style="margin-bottom:0">
            <label for="un">Preferred weight unit (for band resistance &amp; any added load)</label>
            <select id="un" v-model="form.unit">
              <option value="lb">Pounds (lb)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>
        </div>
      </div>

      <div v-else class="stack">
        <h1>Your starting plan</h1>
        <p class="muted">Bodyweight &amp; bands only — no gym required. Every plan is progressive.
        We suggest the one matching your level; you can pick any.</p>
        <label v-for="p in programs" :key="p.slug" class="card card-link"
               :style="{borderColor: chosen===p.slug ? 'var(--accent)' : ''}">
          <input type="radio" name="prog" :value="p.slug" v-model="chosen" style="display:none" />
          <div class="spread">
            <strong>{{ p.name }}</strong>
            <span class="lvl-badge" :class="p.level">{{ p.level }}</span>
          </div>
          <div class="small muted">{{ p.subtitle }}</div>
          <p class="small" style="margin-top:.4rem">{{ p.description.slice(0, 140) }}…</p>
          <div v-if="chosen===p.slug" class="small" style="color:var(--accent-text); font-weight:600; margin-top:.3rem">
            ✓ Recommended for you
          </div>
        </label>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
      <div class="row mt" style="justify-content:space-between">
        <button class="btn ghost" @click="back" :disabled="step===1 || busy">Back</button>
        <button class="btn" @click="next" :disabled="busy">
          {{ busy ? 'Saving…' : (step === totalSteps ? 'Start training' : 'Continue') }}
        </button>
      </div>
    </div>
  `,
};
