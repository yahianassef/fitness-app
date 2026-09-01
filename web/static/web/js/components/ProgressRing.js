// Animated SVG progress ring with a gradient stroke.
export default {
  props: {
    value: { type: Number, default: 0 },     // 0..1
    size: { type: Number, default: 92 },
    stroke: { type: Number, default: 9 },
    label: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  computed: {
    r() { return (this.size - this.stroke) / 2; },
    circ() { return 2 * Math.PI * this.r; },
    offset() { return this.circ * (1 - Math.max(0, Math.min(1, this.value))); },
  },
  template: `
    <div class="ring" :style="{ width: size + 'px', height: size + 'px' }">
      <svg :width="size" :height="size">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--accent)" />
            <stop offset="100%" stop-color="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle class="track" :cx="size/2" :cy="size/2" :r="r" :stroke-width="stroke" />
        <circle class="fill" :cx="size/2" :cy="size/2" :r="r" :stroke-width="stroke"
                :stroke-dasharray="circ" :stroke-dashoffset="offset" />
      </svg>
      <div class="ring-label">
        <div class="ring-num">{{ label }}</div>
        <div class="ring-cap">{{ caption }}</div>
      </div>
    </div>
  `,
};
