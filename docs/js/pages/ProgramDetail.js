import { api } from '../api.js';
import { store } from '../store.js';
import { route, navigate, RouterLink } from '../router.js';
import { loadFromProgramDay } from '../draft.js';

export default {
  components: { RouterLink },
  data() {
    return { program: null, loading: true, error: '', openDay: null, busy: false };
  },
  async created() {
    try {
      this.program = await api.get(`/programs/${route.params.slug}/`);
      if (this.program.days.length) this.openDay = this.program.days[0].id;
    } catch (e) {
      this.error = e.status === 404 ? 'That program doesn’t exist.' : e.message;
    } finally {
      this.loading = false;
    }
  },
  computed: {
    store: () => store,
    isActive() { return store.profile?.active_program_slug === this.program?.slug; },
  },
  methods: {
    async makeActive() {
      if (!store.isAuthed) { navigate('/signup'); return; }
      this.busy = true;
      try {
        const user = await api.post(`/programs/${this.program.slug}/select/`);
        store.setUser(user);
        store.flash(`${this.program.name} is now your plan 💪`);
      } catch (e) {
        store.flash(e.message);
      } finally {
        this.busy = false;
      }
    },
    logDay(day) {
      if (!store.isAuthed) { navigate('/signup'); return; }
      loadFromProgramDay(this.program, day);
      store.flash('Loaded into your workout log — fill in your numbers');
      navigate('/log');
    },
  },
  template: `
    <div class="page">
      <div v-if="loading" class="spinner"></div>
      <div v-else-if="error" class="empty"><div class="big">🤷</div><p>{{ error }}</p></div>
      <div v-else class="stack">
        <router-link to="/programs" class="small">‹ All programs</router-link>
        <div class="spread" style="align-items:flex-start">
          <h1 style="margin:0">{{ program.name }}</h1>
          <span class="badge" :class="program.level">{{ program.level }}</span>
        </div>
        <p class="muted" style="margin-top:-.3rem">{{ program.subtitle }}</p>
        <p>{{ program.description }}</p>

        <div class="row">
          <span class="chip">{{ program.weeks }} weeks</span>
          <span class="chip">{{ program.days_per_week }} days/week</span>
          <span class="chip">{{ program.focus }}</span>
        </div>

        <button class="btn block" :disabled="busy || isActive" @click="makeActive">
          {{ isActive ? '✓ This is your current plan' : 'Make this my plan' }}
        </button>

        <div class="card">
          <h3>Weekly progression</h3>
          <ol class="detail-list numbered mt">
            <li v-for="(w, i) in program.weekly_progression" :key="i">{{ w }}</li>
          </ol>
        </div>

        <h2>The training days</h2>
        <p class="small muted" style="margin-top:-.5rem">These stay the same each week — the
        progression note above tells you what to nudge up.</p>

        <div v-for="day in program.days" :key="day.id" class="card tight">
          <div class="spread" style="cursor:pointer" @click="openDay = openDay === day.id ? null : day.id">
            <div>
              <strong>{{ day.name }}</strong>
              <div class="small muted">{{ day.focus }}</div>
            </div>
            <span class="muted">{{ openDay === day.id ? '▲' : '▼' }}</span>
          </div>
          <div v-show="openDay === day.id" class="mt">
            <div v-for="s in day.slots" :key="s.id" class="ex-block" style="margin-bottom:.5rem">
              <div class="spread">
                <router-link :to="'/exercises/' + s.exercise.slug" style="font-weight:600">
                  {{ s.exercise.name }}
                </router-link>
                <span class="small muted">{{ s.sets }} × {{ s.rep_scheme }}</span>
              </div>
              <div class="small muted">
                Rest {{ s.rest_seconds }}s
                <span v-if="s.coach_note"> · {{ s.coach_note }}</span>
              </div>
            </div>
            <button class="btn soft sm" @click="logDay(day)">Log this day →</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
