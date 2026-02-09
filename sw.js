/* SERVICE WORKER - POKEMMO BREEDER PRO
   Permite funcionamiento Offline e Instalación
*/

// --- VERSIÓN DE LA CACHÉ ---
// Mantenemos la v4 como pediste (asegúrate de que sea superior a la que tienes publicada)
const CACHE_NAME = 'pokebreeder-pro-v5';

// LISTA DE TODOS LOS ARCHIVOS A GUARDAR EN EL MÓVIL DEL USUARIO
const ASSETS_TO_CACHE = [
  './',
  './manifest.json',
  './index.html',
  './style.css',
  './logic.js',

  // --- NUEVO: VERSIÓN INGLESA ---
  './languages/US/index.html',
  './languages/US/logic.js',
  
  // Imágenes Base
  './assets/favicon.ico',
  './assets/fondo.jpg',
  './assets/huevo.png',
  './assets/pokeball.png',
  './assets/piedraeterna.png',
  './assets/genero_m.png',
  './assets/genero_f.png',
  './assets/nature_icon.png',

  // --- NUEVO: BANDERAS ---
  './assets/usa_flag.svg',
  './assets/spain_flag.svg',

  // Brazales (Objetos Recios)
  './assets/brazal_ps.png',
  './assets/brazal_atk.png',
  './assets/brazal_def.png',
  './assets/brazal_spa.png',
  './assets/brazal_spd.png',
  './assets/brazal_vel.png'
];

// 1. INSTALACIÓN: Descargar y guardar archivos
self.addEventListener('install', (e) => {
  console.log('[SW] Instalando versión:', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Borrar cachés viejas si cambias la versión
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Borrando caché vieja:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. INTERCEPTAR RED: Usar caché si existe (Offline First)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );

});
