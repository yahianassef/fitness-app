// Global reactive state: the signed-in user + a tiny toast queue.
import { reactive } from 'vue';
import { api, getToken, setToken } from './api.js';

export const store = reactive({
  user: null,
  ready: false,        // finished the initial "am I logged in?" check
  toast: '',
  celebration: null,   // { emoji, title, subtitle, stats:[{n,l}], cta, to }

  get isAuthed() { return !!this.user; },
  get needsOnboarding() { return !!this.user && !this.user.profile.onboarded; },
  get profile() { return this.user ? this.user.profile : null; },
  get unit() { return this.user ? this.user.profile.unit : 'lb'; },
  get fitnessLevel() { return this.user ? this.user.profile.fitness_level : 'beginner'; },

  async bootstrap() {
    if (getToken()) {
      try {
        this.user = await api.get('/auth/me/');
      } catch {
        setToken('');
      }
    }
    this.ready = true;
  },

  async signup(payload) {
    const data = await api.post('/auth/signup/', payload);
    setToken(data.token);
    this.user = data.user;
  },

  async login(payload) {
    const data = await api.post('/auth/login/', payload);
    setToken(data.token);
    this.user = data.user;
  },

  logout() {
    setToken('');
    this.user = null;
  },

  async refreshUser() {
    this.user = await api.get('/auth/me/');
  },

  setUser(u) { this.user = u; },

  flash(msg) {
    this.toast = msg;
    clearTimeout(this._t);
    this._t = setTimeout(() => { this.toast = ''; }, 2600);
  },

  celebrate(payload) {
    this.celebration = payload;
  },
});
