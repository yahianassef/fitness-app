import { api } from '../api.js';
import { store } from '../store.js';
import { RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  data() {
    return {
      all: [],
      loading: true,
      scope: 'bodyweight_bands',          // bodyweight_bands | all
      level: store.fitnessLevel || 'all', // beginner | intermediate | advanced | all
    };
  },
  async created() {
    this.all = await api.get('/programs/');
    this.loading = false;
  },
  computed: {
    activeSlug() { return store.profile?.active_program_slug; },
    programs() {
      return this.all
        .filter((p) => this.scope === 'all' || p.equipment_profile === 'bodyweight_bands')
        .filter((p) => this.level === 'all' || p.level === this.level)
        .sort((a, b) =>
          ['beginner', 'intermediate', 'advanced'].indexOf(a.level)
          - ['beginner', 'intermediate', 'advanced'].indexOf(b.level));
    },
  },
  template: `
    <div class="page">
      <h1>Programs</h1>
      <p class="muted small" style="margin-top:.1rem">Progressive plans — they start easy on purpose
      and build week to week.</p>

      <div class="segmented mt">
        <button :class="{ on: level==='beginner' }" @click="level='beginner'">Beginner</button>
        <button :class="{ on: level==='intermediate' }" @click="level='intermediate'">Intermediate</button>
        <button :class="{ on: level==='advanced' }" @click="level='advanced'">Advanced</button>
        <button :class="{ on: level==='all' }" @click="level='all'">All</button>
      </div>
      <div class="segmented" style="margin-top:.5rem">
        <button :class="{ on: scope==='bodyweight_bands' }" @click="scope='bodyweight_bands'">Bodyweight &amp; Bands</button>
        <button :class="{ on: scope==='all' }" @click="scope='all'">Every program</button>
      </div>

      <div v-if="loading" class="spinner"></div>
      <div v-else-if="!programs.length" class="empty">
        <div class="big">🗺️</div><p>No programs match that filter.</p>
      </div>
      <div v-else class="stack mt">
        <router-link v-for="p in programs" :key="p.slug" :to="'/programs/' + p.slug"
                     class="card card-link">
          <div class="spread" style="align-items:flex-start">
            <h3 style="margin:0">{{ p.name }}</h3>
            <span v-if="activeSlug === p.slug" class="lvl-badge beginner">Your plan</span>
            <span v-else class="lvl-badge" :class="p.level">{{ p.level }}</span>
          </div>
          <p class="small muted" style="margin:.2rem 0 .5rem">{{ p.subtitle }}</p>
          <p class="small">{{ p.description }}</p>
          <div class="pill-row mt">
            <span class="chip">{{ p.weeks }} weeks</span>
            <span class="chip">{{ p.days_per_week }} days/week</span>
            <span class="chip" v-for="eq in p.equipment_used" :key="eq">{{ eq }}</span>
          </div>
        </router-link>
      </div>
    </div>
  `,
};
