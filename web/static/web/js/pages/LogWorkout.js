import { api } from '../api.js';
import { store } from '../store.js';
import { navigate, RouterLink } from '../router.js';
import {
  draft, addExercise, removeExercise, newSet, clearDraft, toPayload, loadFromProgramDay,
} from '../draft.js';

export default {
  components: { RouterLink },
  data() {
    return {
      allExercises: [],
      pickerOpen: false,
      pickerQuery: '',
      saving: false,
      error: '',
      loadingDay: false,
    };
  },
  async created() {
    this.allExercises = await api.get('/exercises/');
  },
  computed: {
    store: () => store,
    draft: () => draft,
    hasContent() {
      return draft.items.length > 0;
    },
    pickerResults() {
      const q = this.pickerQuery.trim().toLowerCase();
      const chosen = new Set(draft.items.map((i) => i.slug));
      return this.allExercises
        .filter((e) => !chosen.has(e.slug))
        .filter((e) => !q || e.name.toLowerCase().includes(q) || e.equipment.includes(q))
        .slice(0, 40);
    },
    activeProgramSlug() {
      return store.profile?.active_program_slug;
    },
  },
  methods: {
    addSet(item) {
      item.sets.push(newSet(item.sets[item.sets.length - 1]));
    },
    dropSet(item, i) {
      if (item.sets.length > 1) item.sets.splice(i, 1);
    },
    pick(ex) {
      addExercise(ex, { sets: 3 });
      this.pickerQuery = '';
      this.pickerOpen = false;
    },
    remove(slug) { removeExercise(slug); },
    reset() {
      if (confirm('Clear this workout and start over?')) clearDraft();
    },
    async loadNextDay() {
      if (!this.activeProgramSlug) { navigate('/programs'); return; }
      this.loadingDay = true;
      try {
        const dash = await api.get('/dashboard/');
        const prog = await api.get(`/programs/${this.activeProgramSlug}/`);
        const day = dash.next_day
          ? prog.days.find((d) => d.id === dash.next_day.id)
          : prog.days[0];
        if (day) {
          loadFromProgramDay(prog, day);
          store.flash(`Loaded ${day.name}`);
        }
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loadingDay = false;
      }
    },
    async save() {
      this.error = '';
      const payload = toPayload();
      if (!payload.set_entries.length) {
        this.error = 'Add at least one set with reps or weight before saving.';
        return;
      }
      this.saving = true;
      try {
        const w = await api.post('/workouts/', payload);
        const exCount = new Set(payload.set_entries.map((s) => s.exercise_slug)).size;
        const setCount = payload.set_entries.length;
        const vol = Math.round(w.total_volume || 0);
        clearDraft();
        let dash = null;
        try { dash = await api.get('/dashboard/'); } catch { /* non-fatal */ }
        const done = dash?.this_week?.completed ?? 0;
        const target = dash?.this_week?.target ?? 3;
        store.celebrate({
          emoji: done >= target ? '🏆' : '💪',
          title: done >= target ? 'Week crushed!' : 'Workout in the books.',
          subtitle: done >= target
            ? `That's ${done} of ${target} sessions this week.`
            : `${done} of ${target} sessions this week — keep the chain going.`,
          stats: [
            { n: exCount, l: 'exercises' },
            { n: setCount, l: 'sets' },
            ...(vol ? [{ n: vol.toLocaleString(), l: store.unit + ' volume' }] : []),
          ],
          cta: 'See my progress',
          to: '/history/' + w.id,
        });
      } catch (e) {
        this.error = e.message;
        this.saving = false;
      }
    },
  },
  template: `
    <div class="page">
      <div class="spread">
        <h1 style="margin:0">Log a workout</h1>
        <button v-if="hasContent" class="btn ghost sm" @click="reset">Clear</button>
      </div>
      <p class="muted">Fill in what you actually did. Blank sets are ignored, so it’s fine to
      log just one set per exercise on a rough day.</p>

      <div class="card stack" style="gap:.8rem">
        <div class="row">
          <div style="flex:1; min-width:140px">
            <label for="d">Date</label>
            <input id="d" type="date" v-model="draft.performed_on" />
          </div>
          <div style="flex:1; min-width:140px">
            <label for="t">Session name</label>
            <input id="t" v-model="draft.title" placeholder="e.g. Day A · Full Body" />
          </div>
        </div>
        <div>
          <label for="rpe">How hard did it feel? {{ draft.perceived_effort ? draft.perceived_effort + ' / 10' : '(optional)' }}</label>
          <input id="rpe" type="range" min="1" max="10" v-model.number="draft.perceived_effort" />
        </div>
      </div>

      <div v-if="!hasContent" class="empty">
        <div class="big">🏋️</div>
        <p>No exercises yet.</p>
        <div class="row" style="justify-content:center">
          <button class="btn sm" @click="pickerOpen = true">Add an exercise</button>
          <button v-if="activeProgramSlug" class="btn ghost sm" @click="loadNextDay" :disabled="loadingDay">
            {{ loadingDay ? 'Loading…' : 'Load my next program day' }}
          </button>
        </div>
      </div>

      <div v-else class="stack mt">
        <div v-for="item in draft.items" :key="item.slug" class="card tight">
          <div class="spread">
            <router-link :to="'/exercises/' + item.slug" style="font-weight:700">{{ item.name }}</router-link>
            <button class="icon-btn" @click="remove(item.slug)" aria-label="Remove exercise">✕</button>
          </div>
          <p v-if="item.rep_scheme || item.coach_note" class="small muted" style="margin:.2rem 0 .5rem">
            <span v-if="item.rep_scheme">Target: {{ item.rep_scheme }}</span>
            <span v-if="item.coach_note"> · {{ item.coach_note }}</span>
          </p>
          <div class="set-grid" style="margin-bottom:.3rem">
            <span class="h">Set</span><span class="h">Reps</span>
            <span class="h">Weight ({{ store.unit }})</span><span></span>
          </div>
          <div v-for="(s, i) in item.sets" :key="i" class="set-grid" style="margin-bottom:.35rem">
            <span class="muted">{{ i + 1 }}</span>
            <input type="number" inputmode="numeric" min="0" v-model="s.reps" placeholder="–" />
            <input type="number" inputmode="decimal" min="0" step="0.5" v-model="s.weight" placeholder="body" />
            <button class="icon-btn" @click="dropSet(item, i)" aria-label="Remove set">−</button>
          </div>
          <button class="btn ghost sm" @click="addSet(item)">+ Add set</button>
        </div>

        <button class="btn soft block" @click="pickerOpen = true">➕ Add another exercise</button>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div v-if="hasContent" class="stack mt">
        <label for="n">Notes (optional)</label>
        <textarea id="n" rows="2" v-model="draft.notes" placeholder="How it went, anything to remember for next time…"></textarea>
        <button class="btn block good" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save workout' }}
        </button>
      </div>

      <!-- exercise picker -->
      <div v-if="pickerOpen" class="card mt" style="position:relative">
        <div class="spread">
          <h3 style="margin:0">Add an exercise</h3>
          <button class="icon-btn" @click="pickerOpen = false">✕</button>
        </div>
        <input class="mt" type="search" v-model="pickerQuery" placeholder="Search 53 exercises…" autofocus />
        <div class="stack mt" style="gap:.4rem; max-height:340px; overflow:auto">
          <button v-for="e in pickerResults" :key="e.slug" class="ex-block" style="text-align:left; cursor:pointer"
                  @click="pick(e)">
            <div class="spread">
              <span style="font-weight:600">{{ e.name }}</span>
              <span class="badge" :class="e.difficulty">{{ e.difficulty }}</span>
            </div>
            <span class="small muted">{{ e.equipment_label }} · {{ (e.primary_muscles || []).join(', ') }}</span>
          </button>
          <p v-if="!pickerResults.length" class="small muted center">Nothing matches “{{ pickerQuery }}”.</p>
        </div>
      </div>
    </div>
  `,
};
