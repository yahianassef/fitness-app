import { RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  props: { ex: { type: Object, required: true } },
  computed: {
    muscles() {
      return (this.ex.primary_muscles || []).slice(0, 3).join(' · ');
    },
    thumb() {
      return this.ex.video_provider === 'youtube'
        ? `https://i.ytimg.com/vi/${this.ex.video_id}/mqdefault.jpg`
        : null;
    },
  },
  template: `
    <router-link :to="'/exercises/' + ex.slug" class="card tight card-link">
      <div class="row" style="flex-wrap:nowrap; align-items:flex-start; gap:.8rem">
        <div style="flex:0 0 96px; aspect-ratio:16/9; border-radius:8px; overflow:hidden; background:var(--surface-2)">
          <img v-if="thumb" :src="thumb" :alt="ex.name" loading="lazy"
               style="width:100%; height:100%; object-fit:cover" />
        </div>
        <div style="flex:1; min-width:0">
          <div class="spread" style="align-items:flex-start">
            <h3 style="margin:0">{{ ex.name }}</h3>
            <span class="badge" :class="ex.difficulty">{{ ex.difficulty }}</span>
          </div>
          <p class="small muted" style="margin:.15rem 0 .35rem">{{ ex.summary }}</p>
          <div class="pill-row">
            <span class="badge">{{ ex.equipment_label }}</span>
            <span v-if="muscles" class="small muted">{{ muscles }}</span>
          </div>
        </div>
      </div>
    </router-link>
  `,
};
