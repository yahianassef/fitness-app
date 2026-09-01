import { api } from '../api.js';
import { store } from '../store.js';
import { route, RouterLink } from '../router.js';

const CHAIN_LABEL = {
  'push-up': 'Push-up chain', 'band-press': 'Band press chain',
  'band-chest-press': 'Band chest press',
  row: 'Row chain', overhead: 'Overhead press chain', pulldown: 'Pulldown chain',
  squat: 'Squat chain', 'band-squat': 'Band squat', lunge: 'Lunge chain',
  hinge: 'Hinge chain', 'anti-extension': 'Anti-extension chain',
  'anti-rotation': 'Anti-rotation chain', 'anti-lateral': 'Anti-lateral chain',
  rotation: 'Rotation chain', 'leg-raise': 'Leg-raise chain', 'calf-raise': 'Calf-raise chain',
};

export default {
  components: { RouterLink },
  data() {
    return { pattern: null, loading: true, error: '', equip: 'either' };
  },
  async created() {
    try {
      const data = await api.get('/moves/?equipment=bodyweight,bands');
      this.pattern = data.patterns.find((p) => p.key === route.params.pattern) || null;
      if (!this.pattern) this.error = 'That movement pattern doesn’t exist.';
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  computed: {
    store: () => store,
  },
  methods: {
    chainLabel(k) { return CHAIN_LABEL[k] || 'Progression'; },
    isCurrentLevel(step) { return step.difficulty === store.fitnessLevel; },
  },
  template: `
    <div class="page">
      <div v-if="loading" class="spinner"></div>
      <div v-else-if="error" class="empty"><div class="big">🤷</div><p>{{ error }}</p>
        <router-link to="/moves"><span class="btn soft sm">Back to Bodyweight &amp; Bands</span></router-link>
      </div>
      <div v-else class="stack">
        <router-link to="/moves" class="small">‹ Bodyweight &amp; Bands</router-link>
        <h1 style="margin:0">{{ pattern.label }}</h1>
        <p class="muted" style="margin-top:-.3rem">{{ pattern.blurb }}</p>

        <div v-for="c in pattern.chains" :key="c.key" class="card tight">
          <h3 style="margin:0 0 .2rem">{{ chainLabel(c.key) }}</h3>
          <p class="small muted" style="margin:0">Easiest first. You're aiming for a step tagged
          <span class="lvl-badge" :class="store.fitnessLevel">{{ store.fitnessLevel }}</span>.</p>
          <ol class="ladder">
            <li v-for="(s, i) in c.steps" :key="s.slug" :class="{ here: isCurrentLevel(s) }">
              <span class="rung-n">{{ i + 1 }}</span>
              <router-link :to="'/exercises/' + s.slug" class="rung-name">{{ s.name }}</router-link>
              <span class="rung-cue">{{ s.summary }}</span>
              <span class="rung-tags">
                <span class="lvl-badge" :class="s.difficulty">{{ s.difficulty }}</span>
                <span v-if="s.needs_anchor !== 'none'" class="chip">{{ s.needs_anchor_label }}</span>
                <span v-if="s.is_unilateral" class="chip">single-side</span>
              </span>
            </li>
          </ol>
        </div>

        <div v-if="pattern.standalone.length" class="card tight">
          <h3 style="margin:0 0 .4rem">Also in {{ pattern.label }}</h3>
          <div class="stack" style="gap:.4rem">
            <router-link v-for="s in pattern.standalone" :key="s.slug"
                         :to="'/exercises/' + s.slug" class="ex-block spread" style="color:inherit">
              <span style="font-weight:600">{{ s.name }}</span>
              <span class="lvl-badge" :class="s.difficulty">{{ s.difficulty }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  `,
};
