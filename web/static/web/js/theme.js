// Day / night theme.
//
// Three states, not two: "system" follows the OS, and light/dark override it.
// Without a system option a user who changes their phone to dark at sunset would
// be stuck on whatever they last tapped here.
//
// The chosen theme is written to <html data-theme> — CSS applies the dark tokens
// for either data-theme="dark" or (prefers-color-scheme: dark) with no explicit
// light override, so both directions of override work.
import { reactive } from 'vue';

const KEY = 'fc_theme';
const ORDER = ['system', 'light', 'dark'];

function stored() {
  try {
    const v = localStorage.getItem(KEY);
    return ORDER.includes(v) ? v : 'system';
  } catch { return 'system'; }
}

export const theme = reactive({
  mode: stored(),                 // system | light | dark

  get resolved() {
    if (this.mode !== 'system') return this.mode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  get label() {
    return { system: 'Auto', light: 'Light', dark: 'Dark' }[this.mode];
  },
  get icon() {
    return { system: '◐', light: '☀', dark: '☾' }[this.mode];
  },

  set(mode) {
    this.mode = ORDER.includes(mode) ? mode : 'system';
    try { localStorage.setItem(KEY, this.mode); } catch { /* private mode */ }
    apply(this.mode);
  },

  cycle() {
    this.set(ORDER[(ORDER.indexOf(this.mode) + 1) % ORDER.length]);
  },
});

function apply(mode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);

  // Keep the iOS status bar / browser chrome in step with the page.
  const dark = mode === 'dark'
    || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = dark ? '#06070e' : '#f4f5fa';
  document.head.appendChild(meta);
}

export function initTheme() {
  apply(theme.mode);
  // While on "system", track OS changes live.
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => { if (theme.mode === 'system') apply('system'); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}
