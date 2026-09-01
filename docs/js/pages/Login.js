import { store } from '../store.js';
import { navigate, RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  data() {
    return { email: '', password: '', error: '', busy: false };
  },
  methods: {
    async submit() {
      this.error = '';
      this.busy = true;
      try {
        await store.login({ email: this.email, password: this.password });
        store.flash(`Welcome back, ${store.profile.display_name || 'friend'}!`);
        navigate(store.needsOnboarding ? '/onboarding' : '/dashboard', { replace: true });
      } catch (e) {
        this.error = e.message;
      } finally {
        this.busy = false;
      }
    },
  },
  template: `
    <div class="page" style="max-width:420px">
      <h1 class="center mt">Sign in</h1>
      <p class="muted center" style="margin-bottom:1.4rem">Good to see you again.</p>
      <form class="card" @submit.prevent="submit">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" v-model="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="pw">Password</label>
          <input id="pw" type="password" v-model="password" autocomplete="current-password" required />
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn block" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      </form>
      <p class="center mt">New here? <router-link to="/signup">Create an account</router-link></p>
    </div>
  `,
};
