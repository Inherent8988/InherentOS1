// Service worker InherentOS: сначала сеть (всегда свежая версия), без интернета — из кэша
const V='inherentos-v1.0.7';
const FILES=['index.html','css/style.css','js/zip.js','js/fs.js','js/apps.js','js/apps2.js','js/apps3.js','js/apps4.js','js/apps5.js','js/apps6.js','js/setup.js','js/power.js','js/os.js','manifest.json','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const same=new URL(e.request.url).origin===location.origin;
  // для своих файлов всегда спрашиваем сервер (no-cache), чтобы обновления с GitHub приходили сразу
  e.respondWith((same?fetch(e.request.url,{cache:'no-cache'}):fetch(e.request)).then(r=>{
    if(r.ok&&same){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}
    return r;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));
});
