import { RouterLink } from '../router.js';

export default {
  components: { RouterLink },
  template: `
    <div class="page">
      <section class="hero">
        <h1>Get back in shape with just a mat and some bands.</h1>
        <p>
          No gym, no excuses. Pick your level — beginner, intermediate, or advanced —
          and get a complete bodyweight &amp; resistance-band program with a form video
          for every exercise and a plan that scales as you get stronger.
        </p>
        <div class="row" style="justify-content:center">
          <router-link to="/signup"><span class="btn">Start my comeback</span></router-link>
          <router-link to="/moves"><span class="btn ghost">Browse the exercises</span></router-link>
        </div>
      </section>

      <div class="grid cols-3 mt-2">
        <div class="card">
          <h3>🤸 Bodyweight &amp; bands, done right</h3>
          <p class="muted small">40+ exercises organised into progression ladders — from wall
          push-ups to one-arm push-ups, from glute bridges to single-leg RDLs. Each with a
          short form video and the mistakes to avoid.</p>
        </div>
        <div class="card">
          <h3>📊 Three real levels</h3>
          <p class="muted small">Beginner, Intermediate and Advanced each get their own
          6-week program with the right reps, rest and exercise versions — not a
          watered-down copy of the hard one.</p>
        </div>
        <div class="card">
          <h3>📈 See yourself climb</h3>
          <p class="muted small">Log sets in seconds. Watch your reps, holds and weekly
          consistency go up — and get nudged to the next rung when you've earned it.</p>
        </div>
      </div>

      <div class="callout calm mt-2">
        Just browsing? Explore the whole <router-link to="/moves">Bodyweight &amp; Bands library</router-link>
        without an account.
      </div>
    </div>
  `,
};
