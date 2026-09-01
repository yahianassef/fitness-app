import { api } from '../api.js';
import { store } from '../store.js';
import { RouterLink, navigate } from '../router.js';

// Everything that is not bodyweight or bands. Mirrors GYM_EQUIPMENT in models.py.
const GYM = ['dumbbells', 'barbells', 'kettlebells', 'machines', 'cables',
  'medicine_ball', 'stability_ball'];

const ICON = {
  dumbbells: '🏋️', barbells: '⚙️', kettlebells: '🔔', machines: '🛠️',
  cables: '🪢', medicine_ball: '⚽', stability_ball: '🟣',
};

const LEVELS = [
  { key: '', label: 'All levels' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

export default {
  components: { RouterLink },
  data() {
    return {
      loading: true,
      error: '',
      equipment: [],       // [{type,label,blurb,exercise_count}]
      byEquipment: {},     // type -> [exercise]
      open: '',            // expanded equipment type
      level: '',
      query: '',
    };
  },
  computed: {
    store: () => store,
    levels: () => LEVELS,

    total() {
      return this.equipment.reduce((n, e) => n + e.exercise_count, 0);
    },
    // Filters apply to the expanded list only; counts on the cards stay absolute
    // so the library never looks like it shrank.
    visible() {
      let list = this.byEquipment[this.open] || [];
      if (this.level) list = list.filter((e) => e.difficulty === this.level);
      const q = this.query.trim().toLowerCase();
      if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
      return list;
    },
    matchesAcrossAll() {
      const q = this.query.trim().toLowerCase();
      if (!q) return [];
      return Object.values(this.byEquipment).flat()
        .filter((e) => e.name.toLowerCase().includes(q))
        .filter((e) => !this.level || e.difficulty === this.level)
        .slice(0, 40);
    },
  },
  async created() {
    try {
      const [equipment, exercises] = await Promise.all([
        api.get('/equipment/'),
        api.get('/exercises/?equipment=' + GYM.join(',')),
      ]);
      this.equipment = equipment.filter((e) => GYM.includes(e.type));
      const grouped = {};
      for (const ex of exercises) {
        (grouped[ex.equipment] = grouped[ex.equipment] || []).push(ex);
      }
      for (const list of Object.values(grouped)) {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      this.byEquipment = grouped;
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    icon(type) { return ICON[type] || '🏋️'; },
    toggle(type) {
      this.open = this.open === type ? '' : type;
      if (this.open) {
        this.$nextTick(() => {
          const el = this.$el.querySelector('.eq-card.open');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    },
    go(slug) { navigate('/exercises/' + slug); },
  },
  template: `
    <div class="page">
      <div v-if="loading" class="spinner"></div>
      <div v-else-if="error" class="empty"><div class="big">🤷</div><p>{{ error }}</p></div>

      <div v-else class="stack">
        <div>
          <h1 style="margin:0">Gym &amp; Equipment</h1>
          <p class="muted" style="margin-top:.3rem">
            {{ total }} exercises across {{ equipment.length }} equipment types.
            For bands and bodyweight, see
            <router-link to="/moves">Bodyweight &amp; Bands</router-link>.
          </p>
        </div>

        <div class="field" style="margin:0">
          <input type="search" v-model="query" placeholder="Search all equipment exercises…"
                 aria-label="Search equipment exercises" />
        </div>

        <div class="segmented" role="group" aria-label="Filter by level">
          <button v-for="l in levels" :key="l.key"
                  :class="{ on: level === l.key }" @click="level = l.key">{{ l.label }}</button>
        </div>

        <!-- A search spans every equipment type; browsing stays grouped. -->
        <div v-if="query.trim()" class="stack" style="gap:.45rem">
          <p class="small muted" style="margin:0">
            {{ matchesAcrossAll.length }} match<span v-if="matchesAcrossAll.length !== 1">es</span>
            for “{{ query.trim() }}”
          </p>
          <div v-if="!matchesAcrossAll.length" class="empty"><div class="big">🔍</div>
            <p>Nothing matched. Try a shorter word.</p></div>
          <router-link v-for="ex in matchesAcrossAll" :key="ex.slug"
                       :to="'/exercises/' + ex.slug" class="ex-block spread" style="color:inherit">
            <span>
              <span style="font-weight:600">{{ ex.name }}</span>
              <span class="small muted"> · {{ ex.equipment_label }}</span>
            </span>
            <span class="lvl-badge" :class="ex.difficulty">{{ ex.difficulty }}</span>
          </router-link>
        </div>

        <div v-else class="stack" style="gap:.55rem">
          <div v-for="eq in equipment" :key="eq.type" class="eq-card"
               :class="{ open: open === eq.type }">
            <button class="eq-head" @click="toggle(eq.type)"
                    :aria-expanded="open === eq.type ? 'true' : 'false'">
              <span class="eq-ico" aria-hidden="true">{{ icon(eq.type) }}</span>
              <span class="eq-body">
                <span class="eq-name">{{ eq.label }}</span>
                <span class="eq-sub">{{ eq.exercise_count }} exercises · {{ eq.blurb }}</span>
              </span>
              <span class="eq-chev" aria-hidden="true">{{ open === eq.type ? '▾' : '▸' }}</span>
            </button>

            <div v-if="open === eq.type" class="eq-list">
              <p v-if="!visible.length" class="small muted" style="padding:.6rem 0">
                No {{ level }} exercises for this equipment yet — try another level.
              </p>
              <router-link v-for="ex in visible" :key="ex.slug"
                           :to="'/exercises/' + ex.slug" class="ex-block spread"
                           style="color:inherit">
                <span>
                  <span style="font-weight:600">{{ ex.name }}</span>
                  <span v-if="ex.summary" class="small muted eq-cue">{{ ex.summary }}</span>
                </span>
                <span class="lvl-badge" :class="ex.difficulty">{{ ex.difficulty }}</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
