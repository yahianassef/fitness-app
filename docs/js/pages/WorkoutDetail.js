import { api } from '../api.js';
import { store } from '../store.js';
import { route, navigate, RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  data() { return { w: null, loading: true, error: '', deleting: false }; },
  async created() {
    try {
      this.w = await api.get(`/workouts/${route.params.id}/`);
    } catch (e) {
      this.error = e.status === 404 ? 'That workout wasn’t found.' : e.message;
    } finally {
      this.loading = false;
    }
  },
  computed: {
    store: () => store,
    grouped() {
      const g = {};
      for (const s of this.w.set_entries) {
        (g[s.exercise_name] ||= { slug: s.exercise_slug, sets: [] }).sets.push(s);
      }
      return Object.entries(g);
    },
    dateLabel() {
      return new Date(this.w.performed_on + 'T00:00:00')
        .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    },
  },
  methods: {
    async remove() {
      if (!confirm('Delete this workout? This can’t be undone.')) return;
      this.deleting = true;
      try {
        await api.del(`/workouts/${this.w.id}/`);
        store.flash('Workout deleted.');
        navigate('/history', { replace: true });
      } catch (e) {
        this.error = e.message;
        this.deleting = false;
      }
    },
  },
  template: `
    <div class="page">
      <div v-if="loading" class="spinner"></div>
      <div v-else-if="error" class="empty"><div class="big">🤷</div><p>{{ error }}</p>
        <router-link to="/history"><span class="btn soft sm">Back to history</span></router-link>
      </div>
      <div v-else class="stack">
        <router-link to="/history" class="small">‹ History</router-link>
        <h1 style="margin:0">{{ w.title || 'Workout' }}</h1>
        <p class="muted" style="margin-top:-.3rem">{{ dateLabel }}</p>

        <div class="row">
          <span v-if="w.program_name" class="chip">{{ w.program_name }}</span>
          <span v-if="w.perceived_effort" class="chip">Effort {{ w.perceived_effort }}/10</span>
          <span v-if="w.total_volume" class="chip">{{ Math.round(w.total_volume).toLocaleString() }} {{ store.unit }} total</span>
        </div>

        <div v-for="[name, info] in grouped" :key="name" class="card tight">
          <router-link :to="'/exercises/' + info.slug" style="font-weight:700">{{ name }}</router-link>
          <table style="width:100%; border-collapse:collapse; margin-top:.4rem">
            <tr class="small muted">
              <th style="text-align:left; font-weight:600; padding:.2rem 0">Set</th>
              <th style="text-align:left; font-weight:600">Reps</th>
              <th style="text-align:left; font-weight:600">Weight</th>
              <th style="text-align:right; font-weight:600">Est. 1RM</th>
            </tr>
            <tr v-for="s in info.sets" :key="s.id" style="border-top:1px solid var(--border)">
              <td style="padding:.35rem 0">{{ s.set_number }}</td>
              <td>{{ s.reps ?? '–' }}</td>
              <td>{{ s.weight != null ? s.weight + ' ' + store.unit : 'bodyweight' }}</td>
              <td style="text-align:right">{{ s.estimated_1rm ? '~' + s.estimated_1rm : '–' }}</td>
            </tr>
          </table>
        </div>

        <div v-if="w.notes" class="card">
          <h3>Notes</h3>
          <p class="small" style="white-space:pre-wrap">{{ w.notes }}</p>
        </div>

        <button class="btn ghost" :disabled="deleting" @click="remove">Delete workout</button>
      </div>
    </div>
  `,
};
