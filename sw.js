/* SERVICE WORKER - POKEMMO BREEDER PRO
   Permite funcionamiento Offline e Instalación
*/

// --- VERSIÓN DE LA CACHÉ ---
// CAMBIA ESTO CADA VEZ QUE ACTUALICES LA WEB (v1 -> v2 -> v3...)
const CACHE_NAME = 'pokebreeder-pro-v2';

// LISTA DE TODOS LOS ARCHIVOS A GUARDAR EN EL MÓVIL DEL USUARIO
const ASSETS_TO_CACHE = [
  './',
  './manifest.json',
  './index.html',
  './style.css',
  './logic.js',
  
  // Imágenes Base
  './assets/favicon.ico',
  './assets/fondo.jpg',
  './assets/huevo.png',
  './assets/pokeball.png',
  './assets/piedraeterna.png',
  './assets/genero_m.png',
  './assets/genero_f.png',
  './assets/nature_icon.png', // <--- TU NUEVO ICONO

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
