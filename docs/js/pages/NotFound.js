import { RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  template: `
    <div class="page">
      <div class="empty">
        <div class="big">🧭</div>
        <h1>Page not found</h1>
        <p>That link doesn’t lead anywhere. Let’s get you back on track.</p>
        <router-link to="/"><span class="btn soft sm">Go home</span></router-link>
      </div>
    </div>
  `,
};
