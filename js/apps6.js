// ZIP: распаковка + виртуальные вирусы (ZIP с manifest.json, type "virus"). Всё происходит только внутри InherentOS.
ZIP.read=async function(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);let e=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break}
  if(e<0)throw new Error('Не ZIP');
  const n=dv.getUint16(e+10,true),dec=new TextDecoder(),out=[];let p=dv.getUint32(e+16,true);
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)throw new Error('Повреждённый ZIP');
    const method=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=dec.decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
    if(name.endsWith('/')){out.push({path:name,dir:true});continue}
    const start=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true);let data=u8.subarray(start,start+cs);
    if(method===8)data=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else if(method!==0)throw new Error('Неподдерживаемое сжатие ZIP');
    out.push({path:name,data});
  }
  return out;
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function unpackZip(id,entries){
  const f=FS.get(id),root=FS.add(f.parent,FS.unique(f.parent,f.name.replace(/\.zip$/i,'')),'folder'),cache={};
  const mk=parts=>{let cur=root,key='';for(const s of parts){key+='/'+s;if(!cache[key])cache[key]=FS.add(cur,s,'folder');cur=cache[key]}return cur};
  for(const e of entries){
    const parts=e.path.split('/').filter(s=>s&&s!=='.'&&s!=='..');if(!parts.length)continue;
    if(e.dir){mk(parts);continue}
    const name=parts.pop(),parent=mk(parts);let txt=null;
    if(!MEDIA.test(name))try{txt=new TextDecoder('utf-8',{fatal:true}).decode(e.data)}catch(x){}
    if(txt!==null)FS.add(parent,FS.unique(parent,name),'file',txt);else await FS.addBin(parent,FS.unique(parent,name),e.data);
  }
  return root;
}

const fmtB=n=>n>=1048576?(n/1048576).toFixed(1)+' МБ':n>=1024?Math.round(n/1024)+' КБ':n+' Б';
async function openZip(id){
  const sz=FS.get(id).size||0;
  if(sz>200*1048576&&!confirm('ZIP очень большой ('+fmtB(sz)+'). Открытие может зависнуть. Продолжить?'))return;
  let ent;try{ent=await ZIP.read(await FS.bytes(id))}catch(e){return FS.download(id)}
  // структура вируса: manifest.json или любой JSON в корне архива с "type": "virus"
  const roots=ent.filter(x=>!x.dir&&!x.path.includes('/')&&/\.json$/i.test(x.path)).sort((a,b)=>(/^manifest\.json$/i.test(b.path)?1:0)-(/^manifest\.json$/i.test(a.path)?1:0));
  for(const j of roots){let man=null;try{man=JSON.parse(new TextDecoder().decode(j.data))}catch(e){}
    if(man&&typeof man==='object'&&man.type==='virus')return runVirus(man,ent)}
  zipWindow(id,ent); // обычный ZIP: открываем как папку
}
function zipWindow(id,ent){
  const f=FS.get(id),b=el('<div class="tools"><button data-c="unpack">📂 Распаковать в папку</button><button data-c="dl">⬇ Скачать ZIP</button></div><div class="zl"></div><div class="stat"></div>'),list=b.querySelector('.zl');
  const items=ent.filter(e=>e.path.replace(/\/$/,''));
  items.forEach((e,i)=>{const x=document.createElement('button');x.textContent=(e.dir?'📁 ':'📄 ')+e.path+(e.dir?'':'  ('+fmtB(e.data.length)+')');x.dataset.i=i;if(e.dir)x.disabled=true;list.append(x)});
  b.querySelector('.stat').textContent=ent.filter(e=>!e.dir).length+' файлов · нажми на файл, чтобы посмотреть (текст и картинки)';
  openWin('ZIP — '+f.name,520,400,b);
  b.onclick=async e=>{const c=e.target.dataset.c;
    if(c==='unpack'){await unpackZip(id,ent);alert('Готово: архив распакован в папку рядом с ним. Обнови окно Проводника (← и обратно).')}
    if(c==='dl')FS.download(id);
    if(e.target.dataset.i!==undefined){const it=items[+e.target.dataset.i],name=it.path.split('/').pop(),ex=ext(name);
      if(IMG.test(ex)&&ex!=='svg'){const w=el('<div class="vw"><img alt=""></div>');w.querySelector('img').src=URL.createObjectURL(new Blob([it.data],{type:mime(name)}));w.querySelector('img').style.cssText='width:100%;height:100%;object-fit:contain';openWin(name,480,360,w)}
      else{let t=null;if(!MEDIA.test(name))try{t=new TextDecoder('utf-8',{fatal:true}).decode(it.data)}catch(x){}
        if(t===null)alert('Этот файл нельзя посмотреть внутри ZIP. Распакуй архив и открой файл из папки.');
        else{const w=el('<textarea readonly></textarea>');w.querySelector('textarea').value=t;openWin(name,480,360,w)}}}};
}

async function runVirus(man,ent){
  const acts=(Array.isArray(man.actions)?man.actions:[]).slice(0,50),kills=man.kill||acts.some(a=>a&&a.type==='killScreen');
  const msg='⚠ ВИРТУАЛЬНЫЙ ВИРУС\n\nПакет: '+String(man.name||'без названия')+(man.author?' ('+man.author+')':'')+(man.description?'\n'+man.description:'')+
    '\n\nОн действует только внутри InherentOS и не затрагивает телефон.'+
    (kills?'\n\nПосле него система «переустановится», и ВСЕ файлы InherentOS будут удалены. Заранее скачай то, что нужно.':'')+'\n\nЗапустить?';
  if(!confirm(msg))return;
  for(const a of acts){if(a&&typeof a==='object'){try{await doEffect(a,ent)}catch(e){}}}
  if(man.kill&&!acts.some(a=>a&&a.type==='killScreen'))await killScreen({},ent);
}

function fakeWin(title,text,w,h){
  const b=el('<div style="padding:18px;font-size:15px;white-space:pre-wrap;overflow:auto"></div>');b.firstChild.textContent=String(text||'');
  return openWin(String(title||'⚠ Предупреждение'),w||340,h||160,b);
}
async function doEffect(a,ent){
  const t=a.type;
  if(t==='message')fakeWin(a.title,a.text);
  else if(t==='popups'){const n=Math.min(40,Math.max(1,+a.count||5));
    for(let i=0;i<n;i++){const w=fakeWin(a.title||'Ошибка',a.text||'Ошибка 0xDEAD',300,130);
      w.el.style.left=Math.random()*Math.max(1,innerWidth-310)+'px';w.el.style.top=Math.random()*Math.max(1,innerHeight-200)+'px';await sleep(150)}}
  else if(t==='glitch'){document.body.classList.add('glitch');await sleep(Math.min(8000,+a.ms||2500));document.body.classList.remove('glitch')}
  else if(t==='wait')await sleep(Math.min(10000,Math.max(0,+a.ms||1000)));
  else if(t==='killScreen')await killScreen(a,ent);
}

function overlay(){const o=document.createElement('div');o.className='kov';document.body.append(o);return o}
async function killScreen(a,ent){
  localStorage.setItem('inherentos_wipe','1');           // если закрыть страницу, переустановка продолжится при следующем запуске
  const o=overlay(),name=String(a.image||'kill_screen.png'),z=ent&&ent.find(x=>!x.dir&&x.path===name);
  const img=document.createElement('img');img.className='kimg';
  img.onerror=()=>{o.innerHTML='<div class="ktxt">☠ СИСТЕМА ПОВРЕЖДЕНА</div>'};
  img.src=z?URL.createObjectURL(new Blob([z.data],{type:'image/png'})):name;o.append(img);
  await sleep(Math.min(20000,Math.max(1000,+a.imageMs||4000)));
  await reinstall(o,a.reinstallMs);
}
async function reinstall(o,ms){
  ms=Math.min(60000,Math.max(3000,+ms||8000));
  o.innerHTML='<div class="rsb"><div class="rst">Переустановка InherentOS</div><div class="rss">Подготовка…</div><div class="rbar"><i></i></div><div class="rsp">0%</div></div>';
  const steps=['Удаление файлов пользователя…','Очистка хранилища…','Сброс настроек…','Установка системы…','Завершение…'],
    bar=o.querySelector('.rbar i'),sp=o.querySelector('.rsp'),ss=o.querySelector('.rss'),t0=Date.now();
  while(Date.now()-t0<ms){const p=(Date.now()-t0)/ms;bar.style.width=p*100+'%';sp.textContent=Math.floor(p*100)+'%';ss.textContent=steps[Math.min(steps.length-1,Math.floor(p*steps.length))];await sleep(100)}
  bar.style.width='100%';sp.textContent='100%';
  await FS.reset();['inherentos_icons','inherentos_wipe'].forEach(k=>localStorage.removeItem(k));
  location.reload();
}
// переустановка была начата, но страницу закрыли: доводим до конца
if(localStorage.getItem('inherentos_wipe')==='1')reinstall(overlay(),5000);
