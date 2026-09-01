// Offline cache. Bumping CACHE evicts the previous version on activate.
const CACHE = 'fitness-comeback-19350192';
const BASE = '/fitness-app';
const ASSETS = [
  '/fitness-app/',
  '/fitness-app/index.html',
  '/fitness-app/css/styles.css',
  '/fitness-app/site.webmanifest',
  '/fitness-app/data/app-data.json',
  '/fitness-app/vendor/vue.esm-browser.prod.js',
  '/fitness-app/js/api.js',
  '/fitness-app/js/celebrate.js',
  '/fitness-app/js/components/Celebration.js',
  '/fitness-app/js/components/Charts.js',
  '/fitness-app/js/components/ExerciseCard.js',
  '/fitness-app/js/components/ProgressRing.js',
  '/fitness-app/js/components/VideoEmbed.js',
  '/fitness-app/js/draft.js',
  '/fitness-app/js/main.js',
  '/fitness-app/js/pages/Dashboard.js',
  '/fitness-app/js/pages/EquipmentIndex.js',
  '/fitness-app/js/pages/ExerciseDetail.js',
  '/fitness-app/js/pages/ExerciseList.js',
  '/fitness-app/js/pages/History.js',
  '/fitness-app/js/pages/Landing.js',
  '/fitness-app/js/pages/Login.js',
  '/fitness-app/js/pages/LogWorkout.js',
  '/fitness-app/js/pages/Moves.js',
  '/fitness-app/js/pages/NotFound.js',
  '/fitness-app/js/pages/Onboarding.js',
  '/fitness-app/js/pages/PatternDetail.js',
  '/fitness-app/js/pages/ProgramDetail.js',
  '/fitness-app/js/pages/Programs.js',
  '/fitness-app/js/pages/Progress.js',
  '/fitness-app/js/pages/Signup.js',
  '/fitness-app/js/pages/WorkoutDetail.js',
  '/fitness-app/js/router.js',
  '/fitness-app/js/session.js',
  '/fitness-app/js/store.js',
  '/fitness-app/icons/apple-touch-icon.png',
  '/fitness-app/icons/icon-192.png',
  '/fitness-app/icons/icon-512.png',
  '/fitness-app/icons/maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigations: serve the cached shell so deep links work offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(BASE + '/index.html')),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    })),
  );
});
