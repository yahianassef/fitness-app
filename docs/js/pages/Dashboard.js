import { api } from '../api.js';
import { store } from '../store.js';
import { storageStatus, isInstalled } from '../session.js';
import { RouterLink } from '../router.js';
import ProgressRing from '../components/ProgressRing.js';

export default {
  components: { RouterLink, ProgressRing },
  data() {
    return {
      storage: null, data: null, loading: true, error: '' };
  },
  async created() {
    try {
      this.data = await api.get('/dashboard/');
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
    storageStatus().then((s) => { this.storage = { ...s, installed: isInstalled() }; });
  },
  computed: {
    store: () => store,
    name() { return store.profile?.display_name || 'there'; },
    greeting() {
      const h = new Date().getHours();
      return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    },
    week() { return this.data?.this_week; },
    pct() {
      if (!this.week || !this.week.target) return 0;
      return Math.min(100, Math.round((this.week.completed / this.week.target) * 100));
    },
    encouragement() {
      const c = this.week?.completed ?? 0;
      const t = this.week?.target ?? 3;
      if (c === 0) return 'A fresh week. One session is all it takes to start it right.';
      if (c >= t) return 'You hit your target this week. That’s how comebacks are made. 🎉';
      if (c === t - 1) return 'One more session and the week is a win.';
      return 'Nice work so far — keep the momentum going.';
    },
  },
  methods: {
    fmtDate(d) {
      return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    },
    async setLevel(lvl) {
      if (lvl === store.fitnessLevel) return;
      try {
        const user = await api.patch('/auth/profile/', { fitness_level: lvl });
        store.setUser(user);
        this.data = await api.get('/dashboard/');
        store.flash(`Level set to ${lvl}. Workouts now scale to match.`);
      } catch (e) {
        store.flash(e.message);
      }
    },
  },
  template: `
    <div class="page">
      <div v-if="loading" class="spinner"></div>
      <p v-else-if="error" class="form-error">{{ error }}</p>
      <div v-else class="stack">
        <div>
          <h1>{{ greeting }}, {{ name }}.</h1>
          <p class="muted">Ready when you are. 💪</p>
        </div>

        <div>
          <label class="small muted">Your level — scales every workout</label>
          <div class="segmented" style="margin-top:.3rem">
            <button :class="{ on: store.fitnessLevel==='beginner' }" @click="setLevel('beginner')">Beginner</button>
            <button :class="{ on: store.fitnessLevel==='intermediate' }" @click="setLevel('intermediate')">Intermediate</button>
            <button :class="{ on: store.fitnessLevel==='advanced' }" @click="setLevel('advanced')">Advanced</button>
          </div>
          <p v-if="data.level_defaults" class="small muted" style="margin-top:.35rem">
            {{ data.level_defaults.tagline }} · {{ data.level_defaults.sets[0] }}–{{ data.level_defaults.sets[1] }} sets ·
            {{ data.level_defaults.reps_strength }} reps · {{ data.level_defaults.rest_seconds }}s rest
          </p>
        </div>

        <div class="card">
          <div class="row" style="flex-wrap:nowrap; gap:1.1rem; align-items:center">
            <progress-ring :value="week.completed / (week.target || 1)"
                           :label="week.completed + '/' + week.target" caption="this week" />
            <div style="flex:1; min-width:0">
              <h3 style="margin:0 0 .2rem">This week</h3>
              <p class="small muted" style="margin:0">{{ encouragement }}</p>
              <div v-if="data.streak_days" class="streak-flame" style="margin-top:.5rem">
                <span class="fl">🔥</span> {{ data.streak_days }}-week streak
              </div>
            </div>
          </div>
        </div>

        <div v-if="data.next_day" class="card" style="border-color:var(--accent)">
          <span class="badge intermediate">Next session</span>
          <h3 style="margin:.4rem 0 .2rem">{{ data.next_day.name }}</h3>
          <p class="small muted">{{ data.next_day.focus }}</p>
          <ul class="small muted" style="margin:.5rem 0 .8rem; padding-left:1.1rem">
            <li v-for="s in data.next_day.slots.slice(0,4)" :key="s.id">
              {{ s.exercise.name }} — {{ s.sets }} × {{ s.rep_scheme }}
            </li>
            <li v-if="data.next_day.slots.length > 4">+ {{ data.next_day.slots.length - 4 }} more</li>
          </ul>
          <div class="row">
            <router-link :to="'/programs/' + store.profile.active_program_slug">
              <span class="btn ghost sm">View full day</span>
            </router-link>
            <router-link to="/log"><span class="btn sm">Log this workout</span></router-link>
          </div>
        </div>

        <div v-else class="card">
          <h3>No active program yet</h3>
          <p class="small muted">Pick a plan and your next session will show up here.</p>
          <router-link to="/programs"><span class="btn sm mt">Browse programs</span></router-link>
        </div>

        <div class="grid cols-3">
          <div class="card stat"><div class="n">{{ data.total_workouts }}</div><div class="l">workouts logged</div></div>
          <div class="card stat"><div class="n">{{ data.personal_bests.length }}</div><div class="l">lifts tracked</div></div>
          <div class="card stat"><div class="n">{{ week.completed }}</div><div class="l">this week</div></div>
        </div>

        <div v-if="data.personal_bests.length" class="card">
          <h3>Personal bests</h3>
          <p class="small muted">Estimated one-rep max from your best logged set.</p>
          <table style="width:100%; border-collapse:collapse; margin-top:.5rem">
            <tr v-for="pb in data.personal_bests" :key="pb.exercise"
                style="border-top:1px solid var(--border)">
              <td style="padding:.5rem 0">{{ pb.exercise }}</td>
              <td class="small muted" style="text-align:right">{{ pb.weight }} {{ store.unit }} × {{ pb.reps }}</td>
              <td style="text-align:right; font-weight:700; padding-left:.6rem">
                ~{{ pb.estimated_1rm }} {{ store.unit }}
              </td>
            </tr>
          </table>
        </div>

        <div class="card">
          <div class="spread">
            <h3 style="margin:0">Recent workouts</h3>
            <router-link to="/history" class="small">See all</router-link>
          </div>
          <div v-if="!data.recent_workouts.length" class="small muted mt">
            Nothing logged yet. Your first session is the hardest to start and the best to finish.
          </div>
          <ul v-else style="list-style:none; margin-top:.5rem">
            <li v-for="w in data.recent_workouts" :key="w.id"
                style="border-top:1px solid var(--border); padding:.55rem 0">
              <router-link :to="'/history/' + w.id" class="spread" style="color:inherit">
                <span>{{ w.title || 'Workout' }}</span>
                <span class="small muted">{{ fmtDate(w.performed_on) }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <div v-if="storage" class="card tight">
          <h3 style="margin:0 0 .5rem">Your data</h3>
          <p class="small muted" style="margin:0 0 .6rem">
            Everything you log lives on this device, so the app needs no account server
            and no subscription. You stay signed in until you sign out.
          </p>
          <div class="storage-note">
            <span aria-hidden="true">{{ storage.persisted ? '🔒' : '⚠️' }}</span>
            <span v-if="storage.persisted">
              Storage is <strong>persistent</strong> — your session and workout log survive
              closing the app.
            </span>
            <span v-else-if="!storage.installed">
              Storage is not marked persistent yet. <strong>Add the app to your Home Screen</strong>
              (Share → Add to Home Screen) so iOS keeps your data instead of clearing it after
              about a week unused.
            </span>
            <span v-else>
              Storage is not marked persistent. Your data is saved, but the browser may clear
              it if the device runs very low on space.
            </span>
          </div>
        </div>

        <div class="row" style="justify-content:center">
          <router-link to="/progress"><span class="btn ghost">View progress graphs</span></router-link>
        </div>
      </div>
    </div>
  `,
};
