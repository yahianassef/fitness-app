// Minimal history-API router for the SPA. No dependencies.
import { reactive } from 'vue';

export const route = reactive({ path: window.location.pathname, params: {}, query: {} });

let routes = [];

export function defineRoutes(list) { routes = list; }

function parseQuery(search) {
  const q = {};
  new URLSearchParams(search).forEach((v, k) => { q[k] = v; });
  return q;
}

function match(path) {
  for (const r of routes) {
    const rp = r.path.split('/').filter(Boolean);
    const pp = path.split('/').filter(Boolean);
    if (rp.length !== pp.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < rp.length; i++) {
      if (rp[i].startsWith(':')) params[rp[i].slice(1)] = decodeURIComponent(pp[i]);
      else if (rp[i] !== pp[i]) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  const fallback = routes.find((r) => r.path === '*');
  return { route: fallback, params: {} };
}

export function resolve() {
  const { route: r, params } = match(window.location.pathname);
  route.path = window.location.pathname;
  route.params = params;
  route.query = parseQuery(window.location.search);
  return r;
}

export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname + window.location.search) return;
  if (replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
    window.scrollTo(0, 0);
  }
  window.dispatchEvent(new Event('fc:navigate'));
}

window.addEventListener('popstate', () => window.dispatchEvent(new Event('fc:navigate')));

// <router-link to="/path"> — an <a> that navigates without a full reload.
export const RouterLink = {
  props: { to: { type: String, required: true } },
  computed: {
    active() {
      return this.to === '/'
        ? route.path === '/'
        : route.path === this.to || route.path.startsWith(this.to + '/');
    },
  },
  methods: {
    go(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(this.to);
    },
  },
  template: `<a :href="to" :class="{ active }" @click="go"><slot /></a>`,
};
