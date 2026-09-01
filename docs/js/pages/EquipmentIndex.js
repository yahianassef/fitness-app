import { api } from '../api.js';
import { RouterLink } from '../router.js';

const ICONS = {
  dumbbells: '🏋️', barbells: '🏋️‍♂️', kettlebells: '🔔', bodyweight: '🤸',
  bands: '🎗️', machines: '⚙️', cables: '🧵',
};

export default {
  components: { RouterLink },
  data() { return { items: [], loading: true }; },
  async created() {
    this.items = await api.get('/equipment/');
    this.loading = false;
  },
  methods: { icon(t) { return ICONS[t] || '•'; } },
  template: `
    <div class="page">
      <h1>Equipment library</h1>
      <p class="muted">Every category, and every exercise you can do with it. Not sure where to
      start? <strong>Bodyweight</strong> and <strong>machines</strong> are the gentlest re-entry.</p>
      <div v-if="loading" class="spinner"></div>
      <div v-else class="grid cols-2 mt">
        <router-link v-for="e in items" :key="e.type" class="card card-link"
                     :to="'/exercises?equipment=' + e.type">
          <div class="row" style="flex-wrap:nowrap">
            <span style="font-size:1.8rem">{{ icon(e.type) }}</span>
            <div>
              <div class="spread"><h3 style="margin:0">{{ e.label }}</h3></div>
              <span class="small muted">{{ e.exercise_count }} exercises</span>
            </div>
          </div>
          <p class="small muted" style="margin-top:.6rem">{{ e.blurb }}</p>
        </router-link>
      </div>
    </div>
  `,
};
