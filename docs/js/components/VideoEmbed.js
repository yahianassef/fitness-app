// Click-to-load YouTube embed. Nothing loads from youtube until the user taps play,
// which keeps the exercise pages fast and private.
export default {
  props: {
    videoId: { type: String, required: true },
    provider: { type: String, default: 'youtube' },
    title: { type: String, default: 'Demo video' },
  },
  data() {
    return { playing: false };
  },
  computed: {
    embedUrl() {
      if (this.provider === 'youtube') {
        return `https://www.youtube-nocookie.com/embed/${this.videoId}` +
          `?rel=0&modestbranding=1&autoplay=1&playsinline=1`;
      }
      if (this.provider === 'vimeo') {
        return `https://player.vimeo.com/video/${this.videoId}?autoplay=1`;
      }
      return this.videoId;
    },
    thumb() {
      if (this.provider !== 'youtube') return null;
      return `https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg`;
    },
  },
  template: `
    <div class="video-wrap">
      <iframe
        v-if="playing"
        :src="embedUrl"
        :title="title"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"></iframe>
      <div v-else class="video-poster" role="button" tabindex="0"
           :style="thumb ? { backgroundImage: 'linear-gradient(rgba(20,12,8,.35),rgba(20,12,8,.6)), url(' + thumb + ')', backgroundSize: 'cover', backgroundPosition: 'center' } : null"
           @click="playing = true" @keydown.enter="playing = true" @keydown.space.prevent="playing = true">
        <span class="play">▶</span>
        <span>Watch the 30–60s form demo</span>
      </div>
    </div>
  `,
};
