import { api } from '../api.js';
import { route, navigate } from '../router.js';
import ExerciseCard from '../components/ExerciseCard.js';

const EQUIP = [
  ['dumbbells', 'Dumbbells'], ['barbells', 'Barbells'], ['kettlebells', 'Kettlebells'],
  ['bodyweight', 'Bodyweight'], ['bands', 'Bands'], ['machines', 'Machines'], ['cables', 'Cables'],
];
const DIFF = [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']];

export default {
  components: { ExerciseCard },
  data() {
    return {
      exercises: [],
      muscles: [],
      loading: true,
      equip: EQUIP,
      diff: DIFF,
      filters: {
        equipment: route.query.equipment || '',
        difficulty: route.query.difficulty || '',
        muscle: route.query.muscle || '',
        q: route.query.q || '',
      },
      _debounce: null,
    };
  },
  async created() {
    this.muscles = await api.get('/muscles/');
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(this.filters)) if (v) p.set(k, v);
      this.exercises = await api.get('/exercises/?' + p.toString());
      this.loading = false;
      const qs = p.toString();
      navigate('/exercises' + (qs ? '?' + qs : ''), { replace: true });
    },
    setEquip(v) {
      this.filters.equipment = this.filters.equipment === v ? '' : v;
      this.load();
    },
    setDiff(v) {
      this.filters.difficulty = this.filters.difficulty === v ? '' : v;
      this.load();
    },
    onSearch() {
      clearTimeout(this._debounce);
      this._debounce = setTimeout(() => this.load(), 250);
    },
    clearAll() {
      this.filters = { equipment: '', difficulty: '', muscle: '', q: '' };
      this.load();
    },
  },
  computed: {
    activeCount() {
      return Object.values(this.filters).filter(Boolean).length;
    },
  },
  template: `
    <div class="page">
      <h1>Exercises</h1>
      <p class="muted">{{ exercises.length }} shown. Tap any exercise for the demo video,
      step-by-step form, and the mistakes to watch for.</p>

      <div class="card stack" style="gap:.7rem">
        <input type="search" v-model="filters.q" @input="onSearch"
               placeholder="Search by name (e.g. squat, row, curl)" />
        <div>
          <label class="small muted">Equipment</label>
          <div class="pill-row">
            <span v-for="[v,l] in equip" :key="v" class="chip"
                  :class="{ on: filters.equipment === v }" @click="setEquip(v)">{{ l }}</span>
          </div>
        </div>
        <div>
          <label class="small muted">Difficulty</label>
          <div class="pill-row">
            <span v-for="[v,l] in diff" :key="v" class="chip"
                  :class="{ on: filters.difficulty === v }" @click="setDiff(v)">{{ l }}</span>
          </div>
        </div>
        <div>
          <label class="small muted" for="mus">Target muscle</label>
          <select id="mus" v-model="filters.muscle" @change="load">
            <option value="">Any muscle</option>
            <option v-for="m in muscles" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button v-if="activeCount" class="btn ghost sm" @click="clearAll">Clear filters ({{ activeCount }})</button>
      </div>

      <div v-if="loading" class="spinner"></div>
      <div v-else-if="!exercises.length" class="empty">
        <div class="big">🔍</div>
        <p>No exercises match those filters.</p>
        <button class="btn soft sm" @click="clearAll">Reset</button>
      </div>
      <div v-else class="stack mt">
        <exercise-card v-for="ex in exercises" :key="ex.slug" :ex="ex" />
      </div>
    </div>
  `,
};
