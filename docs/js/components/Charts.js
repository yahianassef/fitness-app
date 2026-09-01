// Tiny dependency-free SVG charts.

export const LineChart = {
  props: {
    points: { type: Array, required: true },   // [{ x: label, y: number }]
    height: { type: Number, default: 160 },
    unit: { type: String, default: '' },
  },
  computed: {
    view() {
      const w = 480;
      const h = this.height;
      const pad = { l: 34, r: 10, t: 10, b: 22 };
      const ys = this.points.map((p) => p.y);
      let min = Math.min(...ys), max = Math.max(...ys);
      if (min === max) { min -= 1; max += 1; }
      const spanY = max - min;
      const innerW = w - pad.l - pad.r;
      const innerH = h - pad.t - pad.b;
      const n = this.points.length;
      const px = (i) => pad.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const py = (v) => pad.t + innerH - ((v - min) / spanY) * innerH;
      const coords = this.points.map((p, i) => ({ cx: px(i), cy: py(p.y), ...p }));
      const path = coords.map((c, i) => `${i ? 'L' : 'M'}${c.cx.toFixed(1)} ${c.cy.toFixed(1)}`).join(' ');
      const ticks = [min, (min + max) / 2, max].map((v) => ({ v, y: py(v) }));
      const labelEvery = Math.ceil(n / 4);
      return { w, h, path, coords, ticks, labelEvery, pad };
    },
  },
  template: `
    <div class="chart">
      <svg :viewBox="'0 0 ' + view.w + ' ' + view.h" role="img">
        <line v-for="t in view.ticks" :key="'g'+t.v" class="axis"
              :x1="view.pad.l" :x2="view.w - view.pad.r" :y1="t.y" :y2="t.y" opacity="0.4" />
        <text v-for="t in view.ticks" :key="'t'+t.v" class="lbl"
              :x="view.pad.l - 5" :y="t.y + 3" text-anchor="end">{{ Math.round(t.v) }}</text>
        <path class="line" :d="view.path" />
        <g v-for="(c, i) in view.coords" :key="'d'+i">
          <circle class="dot" :cx="c.cx" :cy="c.cy" r="3" />
          <text v-if="i % view.labelEvery === 0 || i === view.coords.length - 1"
                class="lbl" :x="c.cx" :y="view.h - 6" text-anchor="middle">{{ c.x }}</text>
        </g>
      </svg>
    </div>
  `,
};

export const BarChart = {
  props: {
    bars: { type: Array, required: true },   // [{ x: label, y: number }]
    height: { type: Number, default: 150 },
    target: { type: Number, default: 0 },
  },
  computed: {
    view() {
      const w = 480;
      const h = this.height;
      const pad = { l: 20, r: 8, t: 10, b: 22 };
      const max = Math.max(this.target, ...this.bars.map((b) => b.y), 1);
      const innerW = w - pad.l - pad.r;
      const innerH = h - pad.t - pad.b;
      const bw = innerW / this.bars.length;
      const bars = this.bars.map((b, i) => {
        const bh = (b.y / max) * innerH;
        return {
          x: pad.l + i * bw + bw * 0.15,
          y: pad.t + innerH - bh,
          w: bw * 0.7,
          h: bh,
          label: b.x,
          value: b.y,
          cx: pad.l + i * bw + bw / 2,
        };
      });
      const targetY = this.target ? pad.t + innerH - (this.target / max) * innerH : null;
      const labelEvery = Math.ceil(this.bars.length / 6);
      return { w, h, bars, targetY, pad, innerW, labelEvery };
    },
  },
  template: `
    <div class="chart">
      <svg :viewBox="'0 0 ' + view.w + ' ' + view.h" role="img">
        <line class="axis" :x1="view.pad.l" :x2="view.w - view.pad.r"
              :y1="view.h - view.pad.b" :y2="view.h - view.pad.b" />
        <line v-if="view.targetY" :x1="view.pad.l" :x2="view.w - view.pad.r"
              :y1="view.targetY" :y2="view.targetY"
              stroke="var(--good)" stroke-dasharray="4 3" stroke-width="1.5" />
        <g v-for="(b, i) in view.bars" :key="i">
          <rect class="bar" :x="b.x" :y="b.y" :width="b.w" :height="Math.max(b.h, 0)" rx="3" />
          <text v-if="i % view.labelEvery === 0 || i === view.bars.length - 1"
                class="lbl" :x="b.cx" :y="view.h - 6" text-anchor="middle">{{ b.label }}</text>
        </g>
      </svg>
    </div>
  `,
};
