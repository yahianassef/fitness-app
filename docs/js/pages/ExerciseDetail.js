import { api } from '../api.js';
import { store } from '../store.js';
import { route, navigate, RouterLink } from '../router.js';
import { addExercise } from '../draft.js';
import VideoEmbed from '../components/VideoEmbed.js';

export default {
  components: { VideoEmbed, RouterLink },
  data() {
    return { ex: null, loading: true, error: '' };
  },
  async created() {
    try {
      this.ex = await api.get(`/exercises/${route.params.slug}/`);
    } catch (e) {
      this.error = e.status === 404 ? 'That exercise doesn’t exist.' : e.message;
    } finally {
      this.loading = false;
    }
  },
  computed: {
    store: () => store,
    allMuscles() {
      return [...(this.ex.primary_muscles || []), ...(this.ex.secondary_muscles || [])];
    },
  },
  methods: {
    addToLog() {
      const added = addExercise(this.ex, { sets: 3, rep_scheme: '' });
      store.flash(added ? `${this.ex.name} added to your workout` : `${this.ex.name} is already in your workout`);
      navigate('/log');
    },
  },
  template: `
    <div class="page">
      <div v-if="loading" class="spinner"></div>
      <div v-else-if="error" class="empty"><div class="big">🤷</div><p>{{ error }}</p>
        <router-link to="/exercises"><span class="btn soft sm">Back to exercises</span></router-link>
      </div>
      <div v-else class="stack">
        <router-link :to="'/exercises?equipment=' + ex.equipment" class="small">‹ {{ ex.equipment_label }}</router-link>
        <div class="spread" style="align-items:flex-start">
          <h1 style="margin:0">{{ ex.name }}</h1>
          <span class="badge" :class="ex.difficulty">{{ ex.difficulty }}</span>
        </div>
        <p class="muted" style="margin-top:-.3rem">{{ ex.summary }}</p>

        <video-embed :video-id="ex.video_id" :provider="ex.video_provider" :title="ex.name + ' demo'" />
        <p class="small muted" style="margin-top:-.4rem">
          {{ ex.video_title }} ·
          <a :href="ex.video_watch_url" target="_blank" rel="noopener">open on YouTube ↗</a>
        </p>

        <div class="pill-row">
          <span class="badge">{{ ex.equipment_label }}</span>
          <router-link v-if="ex.movement_pattern && ex.movement_pattern !== 'other'"
                       :to="'/moves/' + ex.movement_pattern">
            <span class="chip on">{{ ex.movement_pattern_label }}</span>
          </router-link>
          <span v-if="ex.is_compound" class="badge">Compound</span>
          <span v-if="ex.needs_anchor && ex.needs_anchor !== 'none'" class="chip">{{ ex.needs_anchor_label }}</span>
          <router-link v-for="m in allMuscles" :key="m" :to="'/exercises?muscle=' + encodeURIComponent(m)">
            <span class="chip">{{ m }}</span>
          </router-link>
        </div>

        <div v-if="ex.regression || ex.progression" class="chain-nav">
          <router-link v-if="ex.regression" :to="'/exercises/' + ex.regression.slug">
            <span class="dir">‹ Easier</span><br />{{ ex.regression.name }}
          </router-link>
          <span v-else></span>
          <router-link v-if="ex.progression" :to="'/exercises/' + ex.progression.slug" style="text-align:right">
            <span class="dir">Harder ›</span><br />{{ ex.progression.name }}
          </router-link>
        </div>
        <div v-if="ex.scaling_lever_label && ex.regression" class="callout" style="font-weight:500">
          <strong>Why it's harder than {{ ex.regression.name }}:</strong>
          the lever is <em>{{ ex.scaling_lever_label.toLowerCase() }}</em>.
        </div>

        <button v-if="store.isAuthed" class="btn block" @click="addToLog">➕ Add to my workout</button>
        <router-link v-else to="/signup" class="btn ghost block" style="text-align:center">
          Sign up to log this exercise
        </router-link>

        <div class="card">
          <h3>How to do it</h3>
          <ol class="detail-list numbered mt">
            <li v-for="(step, i) in ex.instructions" :key="i">{{ step }}</li>
          </ol>
        </div>

        <div class="grid cols-2">
          <div class="card">
            <h3>Form tips</h3>
            <ul class="detail-list ticks mt">
              <li v-for="(t, i) in ex.form_tips" :key="i">{{ t }}</li>
            </ul>
          </div>
          <div class="card">
            <h3>Common mistakes</h3>
            <ul class="detail-list crosses mt">
              <li v-for="(m, i) in ex.common_mistakes" :key="i">{{ m }}</li>
            </ul>
          </div>
        </div>

        <div class="callout calm">
          Returning tip: for your first two weeks, stop every set 2–3 reps before failure.
          Soreness is normal; sharp pain is not — ease off if anything pinches.
        </div>
      </div>
    </div>
  `,
};
