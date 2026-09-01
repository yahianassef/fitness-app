import { api } from '../api.js';
import { store } from '../store.js';
import { RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  data() { return { workouts: [], loading: true }; },
  async created() {
    this.workouts = await api.get('/workouts/');
    this.loading = false;
  },
  computed: {
    store: () => store,
    byMonth() {
      const groups = {};
      for (const w of this.workouts) {
        const key = new Date(w.performed_on + 'T00:00:00')
          .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        (groups[key] ||= []).push(w);
      }
      return Object.entries(groups);
    },
  },
  methods: {
    day(d) {
      return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    },
    exCount(w) {
      return new Set(w.set_entries.map((s) => s.exercise_slug)).size;
    },
  },
  template: `
    <div class="page">
      <div class="spread">
        <h1 style="margin:0">Workout history</h1>
        <router-link to="/log"><span class="btn sm">＋ New</span></router-link>
      </div>

      <div v-if="loading" class="spinner"></div>
      <div v-else-if="!workouts.length" class="empty">
        <div class="big">📖</div>
        <p>No workouts logged yet. Once you save one, it’ll show up here — and so will your progress.</p>
        <router-link to="/log"><span class="btn soft sm">Log your first workout</span></router-link>
      </div>
      <div v-else class="stack mt">
        <div v-for="[month, list] in byMonth" :key="month">
          <h3 class="muted" style="margin-bottom:.5rem">{{ month }}</h3>
          <div class="stack" style="gap:.5rem">
            <router-link v-for="w in list" :key="w.id" :to="'/history/' + w.id" class="card tight card-link">
              <div class="spread">
                <div>
                  <strong>{{ w.title || 'Workout' }}</strong>
                  <div class="small muted">
                    {{ exCount(w) }} exercises · {{ w.set_entries.length }} sets
                    <span v-if="w.total_volume"> · {{ Math.round(w.total_volume).toLocaleString() }} {{ store.unit }} volume</span>
                  </div>
                </div>
                <span class="small muted">{{ day(w.performed_on) }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  `,
};
