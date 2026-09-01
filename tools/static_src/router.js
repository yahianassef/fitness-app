// Minimal history-API router for the SPA. No dependencies.
//
// GitHub Pages serves the app from a sub-path (/fitness-app/), so every real
// URL carries that prefix while the app's own route table stays rooted at "/".
// BASE is stripped on read and re-applied on write.
import { reactive } from 'vue';

const BASE = (window.__FC_BASE__ || '').replace(/\/$/, '');

function stripBase(pathname) {
  if (BASE && pathname.startsWith(BASE)) {
    return pathname.slice(BASE.length) || '/';
  }
  return pathname || '/';
}
export function withBase(to) {
  if (!BASE) return to;
  return BASE + (to.startsWith('/') ? to : `/${to}`);
}
function currentPath() { return stripBase(window.location.pathname); }

export const route = reactive({ path: currentPath(), params: {}, query: {} });

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
  const path = currentPath();
  const { route: r, params } = match(path);
  route.path = path;
  route.params = params;
  route.query = parseQuery(window.location.search);
  return r;
}

export function navigate(to, { replace = false } = {}) {
  const target = withBase(to);
  if (target === window.location.pathname + window.location.search) return;
  if (replace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
    window.scrollTo(0, 0);
  }
  window.dispatchEvent(new Event('fc:navigate'));
}

window.addEventListener('popstate', () => window.dispatchEvent(new Event('fc:navigate')));

// <router-link to="/path"> — an <a> that navigates without a full reload.
export const RouterLink = {
  props: { to: { type: String, required: true } },
  computed: {
    href() { return withBase(this.to); },
    active() {
      return this.to === '/'
        ? route.path === '/'
        : route.path === this.to || route.path.startsWith(`${this.to}/`);
    },
  },
  methods: {
    go(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(this.to);
    },
  },
  template: `<a :href="href" :class="{ active }" @click="go"><slot /></a>`,
};
