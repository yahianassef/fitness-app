// Global reactive state: the signed-in user + a tiny toast queue.
import { reactive } from 'vue';
import { api, getToken, setToken } from './api.js';
import { requestPersistence } from './session.js';

export const store = reactive({
  user: null,
  ready: false,        // finished the initial "am I logged in?" check
  toast: '',
  celebration: null,   // { emoji, title, subtitle, stats:[{n,l}], cta, to }
  persistence: 'unknown',  // granted | denied | unsupported

  get isAuthed() { return !!this.user; },
  get needsOnboarding() { return !!this.user && !this.user.profile.onboarded; },
  get profile() { return this.user ? this.user.profile : null; },
  get unit() { return this.user ? this.user.profile.unit : 'lb'; },
  get fitnessLevel() { return this.user ? this.user.profile.fitness_level : 'beginner'; },

  async bootstrap() {
    if (getToken()) {
      try {
        this.user = await api.get('/auth/me/');
        // Already signed in from a previous session — keep the storage grant alive.
        requestPersistence().then((s) => { this.persistence = s; });
      } catch {
        // Only drop the session if the profile is genuinely gone, never on a
        // transient read error, or a reload would silently sign the user out.
        if (!localStorage.getItem('fc_profile')) setToken('');
      }
    }
    this.ready = true;
  },

  async signup(payload) {
    const data = await api.post('/auth/signup/', payload);
    setToken(data.token);
    this.user = data.user;
    this.persistence = await requestPersistence();
  },

  async login(payload) {
    const data = await api.post('/auth/login/', payload);
    setToken(data.token);
    this.user = data.user;
    this.persistence = await requestPersistence();
  },

  // Signing out clears the session but deliberately keeps the workout log, so
  // signing back in on this device restores it. `forget` wipes everything.
  logout({ forget = false } = {}) {
    setToken('');
    this.user = null;
    if (forget) {
      try {
        localStorage.removeItem('fc_profile');
        localStorage.removeItem('fc_workouts');
        localStorage.removeItem('fc_seq');
      } catch { /* ignore */ }
    }
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
