import { api } from '../api.js';
import { store } from '../store.js';
import { RouterLink } from '../router.js';
import { LineChart, BarChart } from '../components/Charts.js';

export default {
  components: { LineChart, BarChart, RouterLink },
  data() {
    return { data: null, loading: true, error: '', selected: null };
  },
  async created() {
    try {
      this.data = await api.get('/progress/');
      const withHistory = this.data.tracked_exercises.find((t) => t.points.length >= 2);
      this.selected = (withHistory || this.data.tracked_exercises[0])?.exercise || null;
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  computed: {
    store: () => store,
    hasData() {
      return this.data && this.data.volume_by_date.length > 0;
    },
    weeklyBars() {
      return this.data.weekly_workouts.map((w) => ({
        x: w.week.split('-W')[1], y: w.count,
      }));
    },
    volumepoints() {
      return this.data.volume_by_date.map((v) => ({
        x: new Date(v.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        y: v.volume,
      }));
    },
    selectedExercise() {
      return this.data.tracked_exercises.find((t) => t.exercise === this.selected);
    },
    exercisePoints() {
      if (!this.selectedExercise) return [];
      return this.selectedExercise.points.map((p) => ({
        x: new Date(p.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        y: p.estimated_1rm,
      }));
    },
    trend() {
      const p = this.exercisePoints;
      if (p.length < 2) return null;
      const diff = p[p.length - 1].y - p[0].y;
      return { diff: Math.round(diff * 10) / 10, up: diff >= 0 };
    },
    target() {
      return store.profile?.days_per_week || 3;
    },
  },
  template: `
    <div class="page">
      <h1>Your progress</h1>
      <div v-if="loading" class="spinner"></div>
      <p v-else-if="error" class="form-error">{{ error }}</p>

      <div v-else-if="!hasData" class="empty">
        <div class="big">📈</div>
        <p>Your graphs appear once you’ve logged a workout or two. Consistency is the first
        thing that improves — and the most important.</p>
        <router-link to="/log"><span class="btn soft sm">Log a workout</span></router-link>
      </div>

      <div v-else class="stack mt">
        <div class="card">
          <h3>Workouts per week</h3>
          <p class="small muted">Dashed line is your goal of {{ target }}/week. Last 12 weeks.</p>
          <bar-chart :bars="weeklyBars" :target="target" />
        </div>

        <div class="card">
          <h3>Total volume per session</h3>
          <p class="small muted">Reps × weight, added up. A steady climb means you’re doing more work.</p>
          <line-chart :points="volumepoints" :unit="store.unit" />
        </div>

        <div v-if="data.tracked_exercises.length" class="card">
          <div class="spread">
            <h3 style="margin:0">Estimated strength by lift</h3>
          </div>
          <select class="mt" v-model="selected">
            <option v-for="t in data.tracked_exercises" :key="t.exercise" :value="t.exercise">
              {{ t.exercise }} ({{ t.points.length }} session{{ t.points.length === 1 ? '' : 's' }})
            </option>
          </select>
          <p v-if="trend" class="callout" :class="{ calm: trend.up }" style="margin-top:.7rem">
            {{ trend.up ? '▲' : '▼' }} {{ trend.up ? '+' : '' }}{{ trend.diff }} {{ store.unit }}
            estimated 1RM since you started tracking this.
          </p>
          <line-chart v-if="exercisePoints.length >= 2" :points="exercisePoints" :unit="store.unit" />
          <p v-else class="small muted mt">Log this lift at least twice to see a trend line.</p>
        </div>

        <p class="small muted center">
          Estimated 1RM uses the Epley formula from your best set each session — a guide, not a max-out cue.
        </p>
      </div>
    </div>
  `,
};
