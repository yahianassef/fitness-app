import { store } from '../store.js';
import { navigate, RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  data() {
    return { name: '', email: '', password: '', error: '', busy: false };
  },
  methods: {
    async submit() {
      this.error = '';
      this.busy = true;
      try {
        await store.signup({ name: this.name, email: this.email, password: this.password });
        store.flash('Account created. Let’s set things up.');
        navigate('/onboarding', { replace: true });
      } catch (e) {
        this.error = e.message;
      } finally {
        this.busy = false;
      }
    },
  },
  template: `
    <div class="page" style="max-width:420px">
      <h1 class="center mt">Create your account</h1>
      <p class="muted center" style="margin-bottom:1.4rem">Takes about 20 seconds.</p>
      <form class="card" @submit.prevent="submit">
        <div class="field">
          <label for="name">First name</label>
          <input id="name" v-model="name" autocomplete="given-name" required />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" v-model="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="pw">Password</label>
          <input id="pw" type="password" v-model="password" autocomplete="new-password"
                 minlength="8" required />
          <p class="small muted" style="margin-top:.35rem">At least 8 characters.</p>
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn block" :disabled="busy">{{ busy ? 'Creating…' : 'Create account' }}</button>
      </form>
      <p class="center mt">Already have one? <router-link to="/login">Sign in</router-link></p>
    </div>
  `,
};
