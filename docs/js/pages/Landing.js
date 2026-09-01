import { RouterLink } from '../router.js';
import { api } from '../api.js';
import { store } from '../store.js';

// Movement patterns for the marquee. Static labels — the marquee is decorative,
// so it must render instantly rather than wait on data.
const PATTERNS = [
  '◈ Horizontal push', '◈ Horizontal pull', '◈ Vertical push', '◈ Vertical pull',
  '◈ Squat', '◈ Hinge', '◈ Lunge', '◈ Anti-extension', '◈ Anti-rotation',
  '◈ Anti-lateral', '◈ Rotation', '◈ Calves', '◈ Conditioning', '◈ Mobility',
];

// The signature idea of the app, shown rather than described.
const LADDER = [
  { n: 1, name: 'Wall Push-Up', tag: 'start here' },
  { n: 2, name: 'Incline Push-Up', tag: '' },
  { n: 3, name: 'Knee Push-Up', tag: '' },
  { n: 4, name: 'Push-Up', tag: '' },
  { n: 5, name: 'Decline Push-Up', tag: '' },
  { n: 6, name: 'Archer Push-Up', tag: 'the ceiling' },
];

export default {
  components: { RouterLink },
  data() {
    return {
      patterns: PATTERNS,
      ladder: LADDER,
      stats: [
        { n: '—', l: 'Exercises' },
        { n: '—', l: 'Bodyweight & bands' },
        { n: '—', l: 'Movement patterns' },
        { n: '—', l: 'Programs' },
      ],
    };
  },
  computed: {
    store: () => store,
    ctaTo() { return store.isAuthed ? '/dashboard' : '/signup'; },
    ctaLabel() { return store.isAuthed ? 'Go to my dashboard' : 'Start my comeback'; },
  },
  async created() {
    // Real numbers from the real library — never hardcoded marketing figures.
    try {
      const [all, moves, programs] = await Promise.all([
        api.get('/exercises/'),
        api.get('/moves/?equipment=bodyweight,bands'),
        api.get('/programs/'),
      ]);
      this.stats = [
        { n: String(all.length), l: 'Exercises' },
        { n: String(moves.total), l: 'Bodyweight & bands' },
        { n: String(moves.patterns.length), l: 'Movement patterns' },
        { n: String(programs.length), l: 'Programs' },
      ];
    } catch {
      // Offline or storage-blocked: drop the strip rather than show broken values.
      this.stats = [];
    }
  },
  mounted() {
    // Scroll reveal, deliberately fail-open.
    //
    // The elements are NOT hidden in CSS by default. They are hidden here, at
    // runtime, only once we know we can un-hide them. If scripting or
    // IntersectionObserver is unavailable — or the observer simply never fires,
    // which does happen in background/throttled renderers — the page stays fully
    // readable instead of being permanently blank below the hero.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = [...this.$el.querySelectorAll('.reveal')];
    if (reduce || !('IntersectionObserver' in window)) return;

    els.forEach((el) => el.classList.add('armed'));
    const show = (el) => { el.classList.add('in'); };

    this._io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          show(e.target);
          this._io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => this._io.observe(el));

    // Safety net: if the observer has not reported anything at all, assume it
    // is not going to and reveal everything rather than leave the page empty.
    this._safety = setTimeout(() => {
      if (!this.$el.querySelector('.reveal.in')) els.forEach(show);
    }, 2500);
  },
  beforeUnmount() {
    if (this._io) this._io.disconnect();
    clearTimeout(this._safety);
  },
  template: `
    <div class="page lp">

      <section class="lp-hero">
        <div class="lp-grid" aria-hidden="true"></div>
        <div class="lp-orb lp-orb-a" aria-hidden="true"></div>
        <div class="lp-orb lp-orb-b" aria-hidden="true"></div>

        <div class="lp-hero-inner">
          <span class="lp-eyebrow">
            <span class="lp-dot" aria-hidden="true"></span>
            No gym · No machines · No subscription
          </span>

          <h1 class="lp-title">
            Your comeback,<br />
            <span class="lp-grad">engineered.</span>
          </h1>

          <p class="lp-sub">
            A mat, a wall and a set of bands. Pick your level and get a complete
            progressive program — every exercise on a ladder that scales the day
            it stops being hard.
          </p>

          <div class="lp-actions">
            <router-link :to="ctaTo"><span class="btn lp-cta">{{ ctaLabel }}</span></router-link>
            <router-link to="/moves"><span class="btn ghost">Explore the library</span></router-link>
          </div>

          <div v-if="stats.length" class="lp-stats">
            <div v-for="s in stats" :key="s.l" class="lp-stat">
              <div class="lp-stat-n">{{ s.n }}</div>
              <div class="lp-stat-l">{{ s.l }}</div>
            </div>
          </div>
        </div>
      </section>

      <div class="lp-marquee reveal" aria-hidden="true">
        <div class="lp-track">
          <span v-for="(p, i) in patterns" :key="'a' + i">{{ p }}</span>
          <span v-for="(p, i) in patterns" :key="'b' + i">{{ p }}</span>
        </div>
      </div>

      <section class="lp-section reveal">
        <span class="lp-kicker">The method</span>
        <h2>Every move is a rung, not a milestone.</h2>
        <p class="muted">
          You never “graduate” from an exercise — you climb it. Each pattern is an
          ordered ladder, and the app knows which rung is yours.
        </p>

        <div class="lp-ladder">
          <div v-for="(s, i) in ladder" :key="s.name" class="lp-rung"
               :class="{ mine: i === 3 }" :style="{ '--i': i }">
            <span class="lp-rung-n">{{ s.n }}</span>
            <span class="lp-rung-name">{{ s.name }}</span>
            <span v-if="s.tag" class="lp-rung-tag">{{ s.tag }}</span>
            <span v-else-if="i === 3" class="lp-rung-tag now">you are here</span>
          </div>
        </div>
      </section>

      <section class="lp-features">
        <article class="lp-feature reveal">
          <span class="lp-ico" aria-hidden="true">🤸</span>
          <h3>Built for zero equipment</h3>
          <p class="muted small">
            Wall push-ups to archer push-ups. Glute bridges to single-leg RDLs.
            Every step has a form video and the mistakes to avoid.
          </p>
        </article>
        <article class="lp-feature reveal">
          <span class="lp-ico" aria-hidden="true">📊</span>
          <h3>Three real levels</h3>
          <p class="muted small">
            Beginner, Intermediate and Advanced each get their own program with the
            right sets, reps, rest and tempo — not a watered-down copy of the hard one.
          </p>
        </article>
        <article class="lp-feature reveal">
          <span class="lp-ico" aria-hidden="true">📈</span>
          <h3>Progress you can see</h3>
          <p class="muted small">
            Log sets in seconds. Watch volume, holds and weekly consistency climb —
            and get nudged up a rung once you have earned it.
          </p>
        </article>
        <article class="lp-feature reveal">
          <span class="lp-ico" aria-hidden="true">📶</span>
          <h3>Works with no signal</h3>
          <p class="muted small">
            Installs to your Home Screen and runs offline. Your log lives on your
            phone — no account server, nothing to pay, nothing to cancel.
          </p>
        </article>
      </section>

      <section class="lp-final reveal">
        <h2>Week one is the hardest. Start it.</h2>
        <p class="muted">Free, offline, and yours. No card, no trial, no upsell.</p>
        <div class="lp-actions">
          <router-link :to="ctaTo"><span class="btn lp-cta">{{ ctaLabel }}</span></router-link>
          <router-link to="/programs"><span class="btn ghost">See the programs</span></router-link>
        </div>
        <p class="small muted" style="margin-top:.9rem">
          Just browsing? The whole
          <router-link to="/moves">Bodyweight &amp; Bands library</router-link>
          is open without an account.
        </p>
      </section>
    </div>
  `,
};
