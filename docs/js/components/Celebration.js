import { store } from '../store.js';
import { navigate } from '../router.js';
import { confetti, haptic } from '../celebrate.js';

export default {
  computed: {
    c: () => store.celebration,
  },
  mounted() {
    haptic([18, 40, 18, 40, 60]);
    this.$nextTick(() => confetti(this.$refs.canvas));
  },
  methods: {
    done() {
      const to = this.c?.to || '/dashboard';
      store.celebration = null;
      navigate(to);
    },
  },
  template: `
    <div class="celebrate" @click.self="done">
      <canvas ref="canvas"></canvas>
      <div class="cel-card">
        <div class="cel-emoji">{{ c.emoji || '🎉' }}</div>
        <h2>{{ c.title }}</h2>
        <p class="muted">{{ c.subtitle }}</p>
        <div class="cel-stats">
          <div v-for="s in c.stats" :key="s.l">
            <div class="n">{{ s.n }}</div>
            <div class="l">{{ s.l }}</div>
          </div>
        </div>
        <button class="btn good block" @click="done">{{ c.cta || 'Done' }}</button>
      </div>
    </div>
  `,
};
