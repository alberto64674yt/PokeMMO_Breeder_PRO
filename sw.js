/* SERVICE WORKER - POKEMMO BREEDER PRO */
const CACHE_NAME = 'pokebreeder-pro-v16';

const ASSETS_TO_CACHE = [
  // --- RAÍZ Y MENÚS ---
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './robots.txt',
  './sitemap.xml',
  './sw.js',

  // --- TOOLS (ESPAÑOL) ---
  './tools/breeder/index.html',
  './tools/breeder/logic.js',
  './tools/egg_moves/index.html',
  './tools/egg_moves/egg_logic.js',
  './tools/ev_calc/index.html',
  './tools/ev_calc/ev_logic.js',

  // --- LANGUAGES (INGLÉS) ---
  './languages/US/index.html',
  './languages/US/tools/breeder/index.html',
  './languages/US/tools/breeder/logic.js',
  './languages/US/tools/egg_moves/index.html',
  './languages/US/tools/egg_moves/egg_logic.js',
  './languages/US/tools/ev_calc/index.html',
  './languages/US/tools/ev_calc/ev_logic.js',

  // --- DATA (BASES DE DATOS) ---
  './data/ev_data_es.json',
  './data/ev_data_en.json',
  './data/pokedex_es.json',
  './data/pokedex_en.json',
  './data/moves_es.json',
  './data/moves_en.json',
  './data/chains_es.json',
  './data/chains_en.json',
  
  // --- ASSETS (IMÁGENES) ---
  './assets/favicon.ico',
  './assets/fondo.jpg',
  './assets/huevo.png',
  './assets/pokeball.png',
  './assets/piedraeterna.png',
  './assets/genero_m.png',
  './assets/genero_f.png',
  './assets/nature_icon.png',
  './assets/usa_flag.svg',
  './assets/spain_flag.svg',
  './assets/brazal_ps.png',
  './assets/brazal_atk.png',
  './assets/brazal_def.png',
  './assets/brazal_spa.png',
  './assets/brazal_spd.png',
  './assets/brazal_vel.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});






