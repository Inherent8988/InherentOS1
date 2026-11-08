// Service worker InherentOS: сначала сеть (всегда свежая версия), без интернета — из кэша
const V='inherentos-v1.0.1';
const FILES=['index.html','css/style.css','js/zip.js','js/fs.js','js/apps.js','js/apps2.js','js/apps3.js','js/apps4.js','js/os.js','manifest.json','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r.ok&&new URL(e.request.url).origin===location.origin){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}
    return r;
  }).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html'))));
});
