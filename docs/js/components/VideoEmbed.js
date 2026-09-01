// Click-to-load YouTube embed. Nothing is requested from YouTube until the user
// taps play, which keeps exercise pages fast and private.
//
// The demo videos are the one part of this offline-first app that genuinely needs
// the network, so every failure mode is handled explicitly: offline, a thumbnail
// that will not load, and an embed that never finishes loading on a slow link.
export default {
  props: {
    videoId: { type: String, required: true },
    provider: { type: String, default: 'youtube' },
    title: { type: String, default: 'Demo video' },
  },
  data() {
    return {
      playing: false,
      loaded: false,      // iframe finished loading
      slow: false,        // taking long enough to warrant an escape hatch
      thumbFailed: false,
      online: navigator.onLine,
    };
  },
  computed: {
    embedUrl() {
      if (this.provider === 'youtube') {
        return `https://www.youtube-nocookie.com/embed/${this.videoId}`
          + '?rel=0&modestbranding=1&autoplay=1&playsinline=1';
      }
      if (this.provider === 'vimeo') {
        return `https://player.vimeo.com/video/${this.videoId}?autoplay=1`;
      }
      return this.videoId;
    },
    watchUrl() {
      if (this.provider === 'youtube') return `https://www.youtube.com/watch?v=${this.videoId}`;
      if (this.provider === 'vimeo') return `https://vimeo.com/${this.videoId}`;
      return this.videoId;
    },
    // hqdefault exists for every video; maxres often 404s, so it is not worth the risk.
    thumb() {
      if (this.provider !== 'youtube' || this.thumbFailed) return null;
      return `https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg`;
    },
  },
  created() {
    this._onOnline = () => { this.online = true; };
    this._onOffline = () => { this.online = false; };
    window.addEventListener('online', this._onOnline);
    window.addEventListener('offline', this._onOffline);
  },
  beforeUnmount() {
    window.removeEventListener('online', this._onOnline);
    window.removeEventListener('offline', this._onOffline);
    clearTimeout(this._slowTimer);
  },
  methods: {
    play() {
      if (!this.online) return;
      this.playing = true;
      this.loaded = false;
      this.slow = false;
      // On a slow connection the iframe can sit blank; surface a way out.
      clearTimeout(this._slowTimer);
      this._slowTimer = setTimeout(() => { if (!this.loaded) this.slow = true; }, 6000);
    },
    onLoaded() {
      this.loaded = true;
      this.slow = false;
      clearTimeout(this._slowTimer);
    },
    retry() {
      this.playing = false;
      this.loaded = false;
      this.slow = false;
      this.$nextTick(() => this.play());
    },
  },
  template: `
    <div class="video-wrap">
      <template v-if="playing">
        <iframe
          :src="embedUrl"
          :title="title"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          @load="onLoaded"></iframe>
        <div v-if="!loaded" class="video-loading">
          <span class="vid-spinner" aria-hidden="true"></span>
          <span class="small">Loading the demo…</span>
          <a v-if="slow" :href="watchUrl" target="_blank" rel="noopener noreferrer"
             class="btn soft sm">Taking a while — open on YouTube</a>
          <button v-if="slow" type="button" class="btn ghost sm" @click="retry">Try again</button>
        </div>
      </template>

      <div v-else-if="!online" class="video-poster offline">
        <span class="play muted-play" aria-hidden="true">📶</span>
        <span class="small">You're offline — the rest of the app still works.</span>
        <span class="small muted">Reconnect to watch the form demo.</span>
      </div>

      <button v-else type="button" class="video-poster" @click="play"
              :aria-label="'Play form demo: ' + title">
        <img v-if="thumb" :src="thumb" alt="" class="video-thumb" loading="lazy"
             @error="thumbFailed = true" />
        <span class="play" aria-hidden="true">▶</span>
        <span class="small">Watch the 30–60s form demo</span>
      </button>
    </div>
  `,
};
