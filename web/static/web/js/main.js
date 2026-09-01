import { createApp, h, shallowRef, watch } from 'vue';
import { store } from './store.js';
import { route, defineRoutes, resolve, navigate, RouterLink } from './router.js';

import Landing from './pages/Landing.js';
import Login from './pages/Login.js';
import Signup from './pages/Signup.js';
import Onboarding from './pages/Onboarding.js';
import Dashboard from './pages/Dashboard.js';
import EquipmentIndex from './pages/EquipmentIndex.js';
import ExerciseList from './pages/ExerciseList.js';
import ExerciseDetail from './pages/ExerciseDetail.js';
import Moves from './pages/Moves.js';
import PatternDetail from './pages/PatternDetail.js';
import Programs from './pages/Programs.js';
import ProgramDetail from './pages/ProgramDetail.js';
import LogWorkout from './pages/LogWorkout.js';
import History from './pages/History.js';
import WorkoutDetail from './pages/WorkoutDetail.js';
import Progress from './pages/Progress.js';
import NotFound from './pages/NotFound.js';
import Celebration from './components/Celebration.js';

defineRoutes([
  { path: '/', name: 'root', public: true },
  { path: '/login', component: Login, public: true },
  { path: '/signup', component: Signup, public: true },
  { path: '/onboarding', component: Onboarding, auth: true },
  { path: '/dashboard', component: Dashboard, auth: true },
  { path: '/moves', component: Moves, public: true },
  { path: '/moves/:pattern', component: PatternDetail, public: true },
  { path: '/equipment', component: EquipmentIndex, public: true },
  { path: '/exercises', component: ExerciseList, public: true },
  { path: '/exercises/:slug', component: ExerciseDetail, public: true },
  { path: '/programs', component: Programs, public: true },
  { path: '/programs/:slug', component: ProgramDetail, public: true },
  { path: '/log', component: LogWorkout, auth: true },
  { path: '/history', component: History, auth: true },
  { path: '/history/:id', component: WorkoutDetail, auth: true },
  { path: '/progress', component: Progress, auth: true },
  { path: '*', component: NotFound, public: true },
]);

// shallowRef so route components are not turned into deep reactive proxies.
const currentComponent = shallowRef(null);

function syncRoute() {
  const matched = resolve();

  if (matched && matched.auth && !store.isAuthed) {
    return navigate('/login', { replace: true });
  }
  if (store.isAuthed && store.needsOnboarding &&
      !['/onboarding', '/login', '/signup'].includes(route.path)) {
    return navigate('/onboarding', { replace: true });
  }
  if (store.isAuthed && ['/login', '/signup'].includes(route.path)) {
    return navigate('/dashboard', { replace: true });
  }

  if (!matched || matched.name === 'root') {
    currentComponent.value = store.isAuthed ? Dashboard : Landing;
  } else {
    currentComponent.value = matched.component || NotFound;
  }
}

window.addEventListener('fc:navigate', syncRoute);
watch(() => store.user, syncRoute);

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', ico: '🏠', authOnly: true },
  { to: '/moves', label: 'Moves', ico: '🤸' },
  { to: '/programs', label: 'Programs', ico: '🗺️' },
  { to: '/log', label: 'Log', ico: '➕', authOnly: true },
  { to: '/progress', label: 'Progress', ico: '📈', authOnly: true },
];

function iosInstallHintVisible() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
  let dismissed = false;
  try { dismissed = localStorage.getItem('fc_a2hs_dismissed') === '1'; } catch { /* ignore */ }
  return isIOS && !standalone && !dismissed;
}

const App = {
  components: { RouterLink },
  data() {
    return { showInstallHint: iosInstallHintVisible() };
  },
  computed: {
    store: () => store,
    navItems() {
      return NAV_ITEMS.filter((i) => !i.authOnly || store.isAuthed);
    },
  },
  methods: {
    dismissInstallHint() {
      this.showInstallHint = false;
      try { localStorage.setItem('fc_a2hs_dismissed', '1'); } catch { /* ignore */ }
    },
    logout() {
      store.logout();
      navigate('/');
      store.flash('Signed out. See you soon!');
    },
  },
  render() {
    const View = currentComponent.value;
    return h('div', { class: 'app-shell' }, [
      h('header', { class: 'topbar' }, [
        h('div', { class: 'topbar-inner' }, [
          h(RouterLink, { to: store.isAuthed ? '/dashboard' : '/' }, {
            default: () => h('span', { class: 'brand' }, [
              h('span', { class: 'logo' }, '💪'), 'Fitness Comeback',
            ]),
          }),
          h('nav', { class: 'nav-links' },
            this.navItems.map((i) =>
              h(RouterLink, { to: i.to, key: i.to }, { default: () => i.label }))),
          h('div', { class: 'row' }, [
            h('a', { href: '/connect', class: 'btn ghost sm hide-mobile', title: 'Open on your phone' }, '📱 Phone'),
            store.isAuthed
              ? h('button', { class: 'btn ghost sm', onClick: this.logout }, 'Sign out')
              : h(RouterLink, { to: '/login' }, {
                  default: () => h('span', { class: 'btn soft sm' }, 'Sign in'),
                }),
          ]),
        ]),
      ]),
      this.showInstallHint
        ? h('div', { class: 'a2hs' }, [
            h('span', null, 'Add to your Home Screen: tap '),
            h('strong', null, 'Share'),
            h('span', null, ' ￪ then '),
            h('strong', null, '“Add to Home Screen”'),
            h('button', { class: 'a2hs-x', onClick: this.dismissInstallHint, 'aria-label': 'Dismiss' }, '✕'),
          ])
        : null,
      View
        ? h(View, { key: route.path })
        : h('div', { class: 'boot' }, '…'),
      h('nav', { class: 'tabbar' },
        this.navItems.map((i) =>
          h(RouterLink, { to: i.to, key: i.to }, {
            default: () => [h('span', { class: 'ico' }, i.ico), h('span', null, i.label)],
          }))),
      store.toast ? h('div', { class: 'toast' }, store.toast) : null,
      store.celebration ? h(Celebration) : null,
    ]);
  },
};

store.bootstrap().then(() => {
  syncRoute();
  createApp(App).mount('#app');
});
