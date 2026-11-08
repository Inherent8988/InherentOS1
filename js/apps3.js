// Просмотр картинок и медиаплеер (аудио/видео) внутри InherentOS
const MIME={mp3:'audio/mpeg',wav:'audio/wav',flac:'audio/flac',ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',m4a:'audio/mp4',aac:'audio/aac',weba:'audio/webm',wma:'audio/x-ms-wma',
  mp4:'video/mp4',webm:'video/webm',mkv:'video/x-matroska',mov:'video/quicktime',ogv:'video/ogg',
  png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp',avif:'image/avif',ico:'image/x-icon',svg:'image/svg+xml'};
const mime=n=>MIME[ext(n)]||'application/octet-stream';

function viewer(id){
  const f=()=>FS.get(id),list=()=>FS.kids(f().parent).filter(([k,v])=>v.type==='file'&&IMG.test(ext(v.name))).map(x=>x[0]);
  const b=el(`<div class="tools"><button data-c="prev">◀</button><button data-c="next">▶</button><button data-c="in">＋</button><button data-c="out">－</button><button data-c="fit">По размеру</button><button data-c="dl">⬇ Скачать</button><button data-c="edit">🎨 В Paint</button></div><div class="vw"><img alt=""></div><div class="stat"></div>`);
  const img=$('img',b),stat=$('.stat',b);let url,zoom=0;
  const win=openWin(f().name,560,430,b,()=>{url&&URL.revokeObjectURL(url)});
  const fit=()=>{zoom=0;img.style.cssText='width:100%;height:100%;object-fit:contain'};
  const scale=k=>{zoom=(zoom||img.clientWidth/img.naturalWidth)*k;img.style.cssText='width:'+img.naturalWidth*zoom+'px;height:auto;max-width:none'};
  const info=()=>{const l=list();stat.textContent=img.naturalWidth+'×'+img.naturalHeight+' · '+(l.indexOf(id)+1)+' из '+l.length};
  img.onload=info;img.onerror=()=>stat.textContent='Не удалось открыть изображение';
  const load=async()=>{const u=await FS.bytes(id);if(!u)return;if(url)URL.revokeObjectURL(url);
    url=URL.createObjectURL(new Blob([u],{type:mime(f().name)}));img.src=url;win.setTitle(f().name);fit();
    $('[data-c=edit]',b).classList.toggle('hidden',!/^(png|jpe?g|webp|bmp)$/.test(ext(f().name)))};
  const step=d=>{const l=list(),i=l.indexOf(id);if(l.length>1){id=l[(i+d+l.length)%l.length];load()}};
  b.onclick=e=>{const c=e.target.dataset.c;if(c==='prev')step(-1);if(c==='next')step(1);if(c==='in')scale(1.25);if(c==='out')scale(.8);if(c==='fit')fit();
    if(c==='dl')FS.download(id);if(c==='edit'){
      if(ext(f().name)==='png')paint(id);else alert('В Paint можно редактировать только .png (открой файл через Загрузить → png).')}};
  b.tabIndex=0;b.onkeydown=e=>{if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1)};
  load();
}

function player(id){
  const isM=n=>AUD.test(ext(n))||VID.test(ext(n));
  const list=()=>FS.kids(FS.get(id).parent).filter(([k,v])=>v.type==='file'&&isM(v.name)).map(x=>x[0]);
  const b=el(`<div class="mt"></div><div class="mv"></div><div class="tools"><button data-c="prev">⏮</button><button data-c="next">⏭</button><button data-c="rep">🔁 Повтор: выкл</button><button data-c="dl">⬇</button></div><div class="pl"></div>`);
  const pl=$('.pl',b),mt=$('.mt',b);let url,m,rep=false;
  const win=openWin('Плеер',420,440,b,()=>{if(m)m.pause();url&&URL.revokeObjectURL(url)});
  const draw=()=>{pl.innerHTML='';list().forEach(k=>{const x=document.createElement('button');x.textContent=(k===id?'▶ ':'')+FS.get(k).name;x.className=k===id?'on':'';x.onclick=()=>{id=k;play()};pl.append(x)})};
  const step=d=>{const l=list(),i=l.indexOf(id);if(l.length){id=l[(i+d+l.length)%l.length];play()}};
  async function play(){const n=FS.get(id).name;win.setTitle(n);mt.textContent='🎵 '+n;if(m)m.pause();
    const u=await FS.bytes(id);if(!u){mt.textContent='⚠️ Не удалось прочитать файл';return}
    if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([u],{type:mime(n)}));
    m=document.createElement(VID.test(ext(n))?'video':'audio');m.controls=true;m.src=url;
    m.onended=()=>{if(rep)play();else if(list().length>1)step(1)};
    m.onerror=()=>{mt.textContent='⚠️ Браузер не может воспроизвести '+n+' (формат или звук отключён)'};
    $('.mv',b).replaceChildren(m);m.play().catch(()=>{});draw()}
  b.onclick=e=>{const c=e.target.dataset.c;if(c==='prev')step(-1);if(c==='next')step(1);if(c==='dl')FS.download(id);
    if(c==='rep'){rep=!rep;e.target.textContent='🔁 Повтор: '+(rep?'вкл':'выкл')}};
  play();
}
