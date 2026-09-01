import { api } from '../api.js';
import { store } from '../store.js';
import { navigate, RouterLink } from '../router.js';
import { clearDraft, addExercise, draft } from '../draft.js';

const PATTERN_ICON = {
  horizontal_push: '💥', horizontal_pull: '🚣', vertical_push: '🙆', vertical_pull: '🧗',
  squat: '🦵', hinge: '🍑', lunge: '🚶', core_anti_extension: '🧱',
  core_anti_rotation: '🌀', core_anti_lateral: '📐', calves: '🦶', conditioning: '⚡',
};

// Curated quick-start sessions — slug lists, resolved to the user's level for sets/reps.
const QUICK = [
  { key: 'full', name: 'Full Body', mins: 25, slugs: ['incline-push-up', 'band-bent-over-row', 'bodyweight-squat', 'glute-bridge', 'pike-push-up', 'plank'] },
  { key: 'upper', name: 'Upper Body', mins: 30, slugs: ['push-up', 'band-bent-over-row', 'band-overhead-press', 'band-lat-pulldown', 'band-bicep-curl', 'superman'] },
  { key: 'lower', name: 'Lower Body', mins: 30, slugs: ['bodyweight-squat', 'band-pull-through', 'reverse-lunge', 'single-leg-rdl', 'single-leg-calf-raise', 'wall-sit'] },
  { key: 'core', name: 'Core', mins: 12, slugs: ['dead-bug', 'plank', 'side-plank', 'bird-dog', 'hollow-body-hold'] },
  { key: 'bands', name: 'Bands Only', mins: 25, slugs: ['band-chest-press', 'band-bent-over-row', 'band-overhead-press', 'band-lat-pulldown', 'band-pull-through', 'band-pallof-press'] },
  { key: 'cond', name: 'Conditioning', mins: 15, slugs: ['mountain-climbers', 'burpee', 'skater-hops', 'band-lateral-walk'] },
];

export default {
  components: { RouterLink },
  data() {
    return {
      overview: null,
      byslug: {},
      defaults: null,
      loading: true,
      error: '',
      equip: 'either',        // either | bodyweight | bands
      level: store.fitnessLevel || 'beginner',
      quick: QUICK,
    };
  },
  async created() {
    try {
      this.defaults = await api.get('/level-defaults/');
      await this.load();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  computed: {
    store: () => store,
    equipParam() {
      return this.equip === 'bodyweight' ? 'bodyweight'
        : this.equip === 'bands' ? 'bands' : 'bodyweight,bands';
    },
  },
  methods: {
    async load() {
      // Browse shows every step of every chain; `level` only drives the quick-start cards.
      const p = new URLSearchParams({ equipment: this.equipParam });
      this.overview = await api.get('/moves/?' + p.toString());
      const map = {};
      for (const pat of this.overview.patterns) {
        for (const c of pat.chains) for (const s of c.steps) map[s.slug] = s;
        for (const s of pat.standalone) map[s.slug] = s;
      }
      this.byslug = map;
    },
    setEquip(v) { this.equip = v; this.load(); },
    setLevel(v) { this.level = v; },
    icon(key) { return PATTERN_ICON[key] || '•'; },
    startQuick(card) {
      if (!store.isAuthed) { navigate('/signup'); return; }
      const d = this.defaults[this.level] || this.defaults.beginner;
      const sets = Array.isArray(d.sets) ? d.sets[d.sets.length - 1] : 3;
      clearDraft();
      draft.title = `${card.name} · ${d.label}`;
      // We need exercise objects; fall back to a light fetch if not in the map.
      let added = 0;
      for (const slug of card.slugs) {
        const ex = this.byslug[slug];
        if (ex) { addExercise(ex, { sets, rep_scheme: d.reps_strength }); added += 1; }
      }
      if (!added) { store.flash('Could not build that workout — try the pattern browser.'); return; }
      store.flash(`${card.name} loaded — ${added} exercises`);
      navigate('/log');
    },
  },
  template: `
    <div class="page">
      <div class="stack" style="gap:.9rem">
        <div>
          <h1 style="margin-bottom:.2rem">Bodyweight &amp; Bands</h1>
          <p class="muted small" style="margin:0">Everything you can train with a mat, a wall and a set of bands.</p>
        </div>

        <div class="segmented">
          <button :class="{ on: equip==='either' }" @click="setEquip('either')">All</button>
          <button :class="{ on: equip==='bodyweight' }" @click="setEquip('bodyweight')">Bodyweight</button>
          <button :class="{ on: equip==='bands' }" @click="setEquip('bands')">Bands</button>
        </div>
        <div>
          <label class="small muted">Quick-workout level</label>
          <div class="segmented" style="margin-top:.25rem">
            <button :class="{ on: level==='beginner' }" @click="setLevel('beginner')">Beginner</button>
            <button :class="{ on: level==='intermediate' }" @click="setLevel('intermediate')">Intermediate</button>
            <button :class="{ on: level==='advanced' }" @click="setLevel('advanced')">Advanced</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="spinner"></div>
      <p v-else-if="error" class="form-error">{{ error }}</p>

      <template v-else>
        <h3 class="mt">Start a workout</h3>
        <p class="small muted" style="margin:.1rem 0 .5rem">Tap a card — it loads into your log at the {{ level }} level, ready to fill in.</p>
        <div class="qs-scroll">
          <button v-for="c in quick" :key="c.key" class="qs-card" @click="startQuick(c)">
            <span class="qs-name">{{ c.name }}</span>
            <span class="small muted">{{ c.slugs.length }} exercises</span>
            <span class="qs-meta">≈ {{ c.mins }} min · tap to start</span>
          </button>
        </div>

        <h3 class="mt-2">Browse by movement pattern</h3>
        <p class="small muted" style="margin:.1rem 0 .6rem">
          {{ overview.total }} exercises shown. Each pattern is a ladder from easiest to hardest.
        </p>
        <div class="stack" style="gap:.5rem">
          <router-link v-for="pat in overview.patterns" :key="pat.key"
                       :to="'/moves/' + pat.key" class="pattern-row">
            <span class="pr-ico">{{ icon(pat.key) }}</span>
            <span class="pr-body">
              <span class="pr-name">{{ pat.label }}</span>
              <span class="pr-sub">{{ pat.exercise_count }} exercises · {{ pat.blurb }}</span>
            </span>
            <span class="pr-chev">›</span>
          </router-link>
        </div>

        <div class="callout calm mt-2">
          Got a barbell or machines too? <router-link to="/equipment">Browse the full equipment library ›</router-link>
        </div>
      </template>
    </div>
  `,
};
