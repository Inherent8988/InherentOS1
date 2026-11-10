const $=(s,r=document)=>r.querySelector(s);
let z=10,wins=[];
const MEDIA=/\.(mp3|wav|flac|ogg|oga|opus|m4a|aac|wma|weba|mp4|webm|mkv|mov|ogv|png|jpe?g|gif|webp|bmp|avif|ico|zip|pdf)$/i,AUD=/^(mp3|wav|flac|ogg|oga|opus|m4a|aac|wma|weba)$/,VID=/^(mp4|webm|mkv|mov|ogv)$/,IMG=/^(png|jpe?g|gif|webp|bmp|avif|ico|svg)$/;
const ext=n=>((n.match(/\.(\w+)$/)||[])[1]||'').toLowerCase();
const icon=f=>f.type==='folder'?'📁':AUD.test(ext(f.name))?'🎵':VID.test(ext(f.name))?'🎬':IMG.test(ext(f.name))?'🖼️':/\.doc$/i.test(f.name)?'📘':/\.csv$/i.test(f.name)?'📗':/\.slides$/i.test(f.name)?'📙':/\.png$/i.test(f.name)?'🎨':/\.zip$/i.test(f.name)?'🗜️':/\.js$/i.test(f.name)?'📜':f.bin?'📦':'📄';

function openWin(title,w,h,body,onclose){
  const el=document.createElement('div');el.className='win';
  const W=Math.min(w,innerWidth-8),H=Math.min(h,innerHeight-48),L=Math.max(0,Math.min(60+wins.length*28,innerWidth-W)),T=Math.max(0,Math.min(40+wins.length*28,innerHeight-44-H));
  el.style.cssText=`width:${W}px;height:${H}px;left:${L}px;top:${T}px;z-index:${++z}`;
  el.innerHTML=`<div class="title"><span></span><button data-a="min" title="Свернуть">–</button><button data-a="max" title="Развернуть">▢</button><button data-a="x" title="Закрыть">✕</button></div><div class="body"></div>`;
  $('span',el).textContent=title;$('.body',el).append(body);$('#windows').append(el);
  const tb=document.createElement('button');tb.textContent=title;$('#tasks').append(tb);
  const win={el,tb,setTitle(t){$('span',el).textContent=t;tb.textContent=t}};wins.push(win);
  const focus=()=>{el.style.zIndex=++z;el.classList.remove('hidden');wins.forEach(x=>x.tb.classList.toggle('on',x===win))};
  const close=()=>{if(onclose&&onclose()===false)return;el.remove();tb.remove();wins=wins.filter(x=>x!==win)};
  el.addEventListener('mousedown',focus);focus();
  tb.onclick=()=>{el.classList.contains('hidden')||tb.classList.contains('on')&&el.style.zIndex==z?el.classList.toggle('hidden'):focus()};
  let prev;
  $('.title',el).addEventListener('click',e=>{const a=e.target.dataset.a;if(a==='x')close();if(a==='min')el.classList.add('hidden');
    if(a==='max'){if(prev){el.style.cssText=prev;prev=null}else{prev=el.style.cssText;el.style.cssText+=';left:0;top:0;width:100%;height:100%'}}});
  const tl=$('.title',el); // перетаскивание окна: мышь и палец (pointer events)
  tl.addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON'||prev)return;
    const dx=e.clientX-el.offsetLeft,dy=e.clientY-el.offsetTop;tl.setPointerCapture(e.pointerId);
    const mv=ev=>{el.style.left=Math.max(0,Math.min(innerWidth-60,ev.clientX-dx))+'px';el.style.top=Math.max(0,Math.min(innerHeight-90,ev.clientY-dy))+'px'};
    const up=()=>{tl.removeEventListener('pointermove',mv);tl.removeEventListener('pointerup',up);tl.removeEventListener('pointercancel',up)};
    tl.addEventListener('pointermove',mv);tl.addEventListener('pointerup',up);tl.addEventListener('pointercancel',up)});
  return win;
}

function openFile(id){const f=FS.get(id),e=ext(f.name),m={doc:word,csv:excel,slides:ppt,zip:openZip};
  if(AUD.test(e)||VID.test(e))player(id);else if(IMG.test(e))viewer(id);else m[e]?m[e](id):f.bin?FS.download(id):notepad(id)}

function explorer(startId='root'){
  let cwd=startId,sel=null,hist=[];
  const b=document.createElement('div');b.style.cssText='display:flex;flex-direction:column;flex:1;min-height:0';
  b.innerHTML=`<div class="tools">
   <button data-c="open">Открыть</button><button data-c="back">←</button><button data-c="up">↑</button>
   <button data-c="nf">+ Папка</button><button data-c="nt">+ Файл</button><button data-c="up2">⇪ Загрузить</button>
   <button data-c="zip">🗜️ В ZIP</button><button data-c="ren">Переименовать</button><button data-c="dl">⬇ Скачать</button><button data-c="share">↗ Поделиться</button><button data-c="tofolder">📂 В папку</button><button data-c="del">🗑 Удалить</button></div>
   <div class="path"></div><div class="files"></div><div class="stat"></div>`;
  const win=openWin('Проводник',640,420,b);
  const files=$('.files',b),upl=document.createElement('input');upl.type='file';upl.multiple=true;
  function draw(){
    $('.path',b).textContent=FS.path(cwd);win.setTitle('Проводник — '+FS.get(cwd).name);files.innerHTML='';
    const k=FS.kids(cwd);if(!k.length)files.innerHTML='<div class="empty">Папка пуста. Создай папку или файл кнопками сверху.</div>';
    k.forEach(([id,f])=>{const d=document.createElement('div');d.className='it'+(id===sel?' sel':'');d.dataset.id=id;
      d.innerHTML=`<b>${icon(f)}</b><span></span>`;$('span',d).textContent=f.name;files.append(d)});
    $('.stat',b).textContent=k.length+' элементов'+(sel?' · выбрано: '+FS.get(sel).name:'');
  }
  const go=id=>{hist.push(cwd);cwd=id;sel=null;draw()};
  const open=id=>{const f=FS.get(id);if(f.type==='folder')go(id);else openFile(id)};
  let last=0,lastId=null;
  files.onclick=e=>{const it=e.target.closest('.it'),id=it?it.dataset.id:null,now=Date.now();
    if(id&&id===lastId&&now-last<450){last=0;lastId=null;open(id);return}
    last=now;lastId=id;sel=id;
    files.querySelectorAll('.it').forEach(x=>x.classList.toggle('sel',x.dataset.id===id));
    $('.stat',b).textContent=FS.kids(cwd).length+' элементов'+(sel?' · выбрано: '+FS.get(sel).name:'')};
  upl.onchange=async()=>{for(const f of upl.files){const buf=new Uint8Array(await f.arrayBuffer());let txt=null;
      if(!MEDIA.test(f.name))try{txt=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){}
      const nm=FS.unique(cwd,f.name);if(txt!==null)FS.add(cwd,nm,'file',txt);else await FS.addBin(cwd,nm,buf)}upl.value='';draw()};
  b.onclick=async e=>{const c=e.target.dataset.c;if(!c)return;
    if(c==='open'){if(!sel)return alert('Сначала выбери файл или папку.');open(sel)}
    if(c==='back'&&hist.length){cwd=hist.pop();sel=null;draw()}
    if(c==='up'&&FS.get(cwd).parent)go(FS.get(cwd).parent);
    if(c==='nf'){const n=prompt('Имя папки:','Новая папка');if(n){FS.add(cwd,FS.unique(cwd,n.trim()),'folder');draw()}}
    if(c==='nt'){const n=prompt('Имя файла (например notes.txt или app.js):','Новый файл.txt');if(n){const id=FS.add(cwd,FS.unique(cwd,n.trim()),'file','');draw();openFile(id)}}
    if(c==='up2')upl.click();
    if(c==='zip'){if(!sel||FS.get(sel).type!=='folder')return alert('Выбери папку, которую нужно запаковать в ZIP.');await FS.zip(sel);draw()}
    if(c==='ren'&&sel){const n=prompt('Новое имя:',FS.get(sel).name);if(n&&!FS.exists(cwd,n,sel)){FS.rename(sel,n.trim());draw()}}
    if(c==='dl'){if(!sel)return alert('Сначала выбери файл или папку.');FS.download(sel)}
    if(c==='tofolder'){if(!sel)return alert('Сначала выбери файл или папку.');
      FS.saveToFolder(sel).then(r=>{if(r===true)alert('Сохранено в выбранную папку ✅');else if(r===false)alert('Выбор папки не поддерживается в этом браузере или приложении. Используй «Поделиться» или «Скачать».')}).catch(e=>alert('Не удалось сохранить: '+e.message))}
    if(c==='share'){if(!sel)return alert('Сначала выбери файл или папку.');FS.share(sel).then(ok=>{if(!ok){alert('Меню «Поделиться» недоступно в этом браузере, файл будет скачан.');FS.download(sel)}})}
    if(c==='del'&&sel&&confirm('Удалить «'+FS.get(sel).name+'»?')){FS.del(sel);sel=null;draw()}};
  draw();return win;
}

function notepad(id){
  if(!id){const n=prompt('Имя файла:','Новый файл.txt');if(!n)return;id=FS.add('root',FS.unique('root',n.trim()),'file','')}
  const f=FS.get(id);let dirty=false;
  const b=document.createElement('div');b.style.cssText='display:flex;flex-direction:column;flex:1;min-height:0';
  b.innerHTML=`<div class="tools"><button data-c="save">💾 Сохранить</button><button data-c="run" class="${/\.js$/i.test(f.name)?'':'hidden'}">▶ Запустить</button><button data-c="dl">⬇ Скачать</button></div><textarea spellcheck="false"></textarea><div class="out hidden"></div><div class="stat">Ctrl+S — сохранить</div>`;
  const ta=$('textarea',b),out=$('.out',b),stat=$('.stat',b);ta.value=f.content;
  const win=openWin(f.name,560,400,b,()=>!(dirty&&!confirm('Есть несохранённые изменения. Закрыть без сохранения?')));
  const save=()=>{FS.setContent(id,ta.value);dirty=false;win.setTitle(f.name);stat.textContent='Сохранено '+new Date().toLocaleTimeString()};
  ta.oninput=()=>{if(!dirty){dirty=true;win.setTitle(f.name+' *')}};
  ta.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();save()}
    if(e.key==='Tab'){e.preventDefault();ta.setRangeText('  ',ta.selectionStart,ta.selectionEnd,'end')}};
  b.onclick=e=>{const c=e.target.dataset.c;if(c==='save')save();if(c==='dl'){save();FS.download(id)}
    if(c==='run'){save();out.classList.remove('hidden');out.textContent='';
      const log=(...a)=>out.textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')+'\n';
      try{new Function('console',ta.value)({log,error:log,warn:log,info:log})}catch(err){log('Ошибка: '+err.message)}}};
  ta.focus();return win;
}

// Рабочий стол
const apps={explorer:()=>explorer(),notepad:()=>notepad(),word:()=>word(),excel:()=>excel(),ppt:()=>ppt(),paint:()=>paint(),calc:()=>calc(),term:()=>term(),snake:()=>snake(),mines:()=>mines(),settings:()=>settings(),browser:()=>browser(),reset:()=>{if(confirm('Удалить все файлы и вернуть систему в исходное состояние?')){FS.reset();localStorage.removeItem('inherentos_icons');location.reload()}}};
const LIST=[['explorer','🖥️','Мой компьютер'],['notepad','📝','Блокнот'],['word','📘','Word'],['excel','📗','Excel'],['ppt','📙','PowerPoint'],['paint','🎨','Paint'],['calc','🧮','Калькулятор'],['term','⌨️','Терминал'],['snake','🐍','Змейка'],['mines','💣','Сапёр'],['browser','🌐','Browser'],['settings','⚙️','Настройки']];
$('#desktop').innerHTML=LIST.map(a=>`<div class="icon" data-app="${a[0]}"><b>${a[1]}</b>${a[2]}</div>`).join('');
$('#start').innerHTML=LIST.map(a=>`<button data-app="${a[0]}">${a[1]} ${a[2]}</button>`).join('')+'<button data-app="reset">♻️ Сбросить систему</button>';

$('#start').onclick=e=>{const a=e.target.dataset.app;if(a){apps[a]();$('#start').classList.add('hidden')}};
$('#startbtn').onclick=e=>{e.stopPropagation();$('#start').classList.toggle('hidden')};
document.addEventListener('click',e=>{if(!e.target.closest('#start'))$('#start').classList.add('hidden')});
setInterval(()=>$('#clock').textContent=new Date().toLocaleString('ru',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}),1000);
$('#clock').textContent=new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
// Иконки рабочего стола: мышь — тянуть сразу, телефон — удерживать ~0,4 с и тянуть; двойной клик/тап открывает
const POS_KEY='inherentos_icons',desk=$('#desktop');let pos={};try{pos=JSON.parse(localStorage.getItem(POS_KEY))||{}}catch(e){}
function layout(){const rows=Math.max(1,Math.floor((desk.clientHeight-8)/76));
  LIST.forEach((a,i)=>{const e=desk.querySelector(`[data-app="${a[0]}"]`),p=pos[a[0]]||[8+Math.floor(i/rows)*72,8+(i%rows)*76];e.style.left=p[0]+'px';e.style.top=p[1]+'px'})}
layout();addEventListener('resize',layout);
let drag=null,tapT=0,tapA=null;
desk.addEventListener('pointerdown',e=>{const ic=e.target.closest('.icon');if(!ic||e.button>0)return;
  const r=drag={x:e.clientX,y:e.clientY,l:ic.offsetLeft,t:ic.offsetTop,ic,on:false,moved:false,id:e.pointerId};
  if(e.pointerType!=='mouse')r.timer=setTimeout(()=>{r.on=true;ic.classList.add('drag');navigator.vibrate&&navigator.vibrate(15)},350)});
addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.on){if(Math.hypot(dx,dy)<=6)return;if(e.pointerType==='mouse'){drag.on=true;drag.ic.classList.add('drag')}else{clearTimeout(drag.timer);drag=null;return}}
  drag.moved=true;drag.ic.style.left=Math.max(0,Math.min(desk.scrollWidth-68,drag.l+dx))+'px';drag.ic.style.top=Math.max(0,drag.t+dy)+'px'});
const endDrag=e=>{if(!drag||e.pointerId!==drag.id)return;clearTimeout(drag.timer);const d=drag,a=d.ic.dataset.app;drag=null;d.ic.classList.remove('drag');
  if(d.moved){pos[a]=[d.ic.offsetLeft,d.ic.offsetTop];try{localStorage.setItem(POS_KEY,JSON.stringify(pos))}catch(x){}return}
  if(e.type==='pointerup'&&!d.on){const n=Date.now();if(tapA===a&&n-tapT<450){tapA=null;apps[a]()}else{tapA=a;tapT=n}}};
addEventListener('pointerup',endDrag);addEventListener('pointercancel',endDrag);
desk.addEventListener('touchmove',e=>{if(drag&&drag.on)e.preventDefault()},{passive:false});
desk.addEventListener('contextmenu',e=>{if(e.target.closest('.icon'))e.preventDefault()});
explorer();
