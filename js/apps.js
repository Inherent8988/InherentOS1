// Офисные приложения InherentOS: Word, Excel, PowerPoint, Paint
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=h=>{const d=document.createElement('div');d.style.cssText='display:flex;flex-direction:column;flex:1;min-height:0';d.innerHTML=h;return d};
const dlBlob=(blob,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)};
function mkApp(st,title,w,h,b,save){
  st.win=openWin(title,w,h,b,()=>!(st.dirty&&!confirm('Есть несохранённые изменения. Закрыть без сохранения?')));
  st.touch=()=>{if(!st.dirty){st.dirty=true;st.win.setTitle((st.id?FS.get(st.id).name:title)+' *')}};
  b.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}});
}
function put(st,ext,content,bin){
  if(!st.id){const n=prompt('Имя файла:','Новый файл');if(!n)return false;st.id=FS.add('root',FS.unique('root',n.trim().replace(/\.\w+$/,'')+ext),'file','')}
  FS.setContent(st.id,content,!!bin);st.dirty=false;st.win.setTitle(FS.get(st.id).name);return true;
}

/* ---------- WORD ---------- */
function word(id){
  const st={id};
  const b=el(`<div class="tools">
   <button data-c="save">💾 Сохранить</button><button data-c="dl">⬇ Скачать .doc</button>
   <select data-s="formatBlock"><option value="&lt;p&gt;">Обычный</option><option value="&lt;h1&gt;">Заголовок 1</option><option value="&lt;h2&gt;">Заголовок 2</option></select>
   <select data-s="fontSize"><option value="2">10</option><option value="3" selected>12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">32</option></select>
   <button data-x="bold"><b>Ж</b></button><button data-x="italic"><i>К</i></button><button data-x="underline"><u>Ч</u></button>
   <button data-x="justifyLeft">⇤</button><button data-x="justifyCenter">↔</button><button data-x="justifyRight">⇥</button>
   <button data-x="insertUnorderedList">• Список</button><button data-x="insertOrderedList">1. Список</button>
   <input type="color" data-s="foreColor" value="#000000" title="Цвет текста"><button data-x="undo">↶</button><button data-x="redo">↷</button></div>
   <div class="paper"><div class="page" contenteditable="true"></div></div><div class="stat"></div>`);
  const page=$('.page',b),stat=$('.stat',b);let saved=null;
  if(id){const d=new DOMParser().parseFromString(FS.get(id).content,'text/html');
    d.querySelectorAll('script,iframe,object,embed,link,meta').forEach(x=>x.remove());
    d.body.querySelectorAll('*').forEach(x=>[...x.attributes].forEach(a=>/^on/i.test(a.name)&&x.removeAttribute(a.name)));
    page.innerHTML=d.body.innerHTML}
  const save=()=>put(st,'.doc','<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+page.innerHTML+'</body></html>');
  mkApp(st,id?FS.get(id).name:'Word — новый документ',700,480,b,save);
  const count=()=>stat.textContent='Слов: '+page.innerText.trim().split(/\s+/).filter(Boolean).length+' · Ctrl+S — сохранить';
  page.oninput=()=>{st.touch();count()};
  page.onblur=()=>{const s=getSelection();saved=s.rangeCount?s.getRangeAt(0):null};
  const ex=(c,v,r)=>{page.focus();if(r&&saved){const s=getSelection();s.removeAllRanges();s.addRange(saved)}document.execCommand(c,false,v);st.touch()};
  $('.tools',b).onmousedown=e=>{if(e.target.tagName==='BUTTON')e.preventDefault()};
  b.onclick=e=>{const t=e.target;if(t.dataset.x)ex(t.dataset.x);if(t.dataset.c==='save')save();if(t.dataset.c==='dl'&&save())FS.download(st.id)};
  b.onchange=e=>{const t=e.target;if(t.dataset.s)ex(t.dataset.s,t.value,1)};
  count();
}

/* ---------- PAINT ---------- */
function paint(id){
  const st={id};
  const b=el(`<div class="tools">
   <button data-c="save">💾 Сохранить</button><button data-c="dl">⬇ PNG</button>
   <button data-t="pencil" class="on">✏️ Карандаш</button><button data-t="eraser">🧽 Ластик</button><button data-t="line">╱ Линия</button><button data-t="rect">▭ Квадрат</button><button data-t="oval">◯ Овал</button><button data-t="fill">🪣 Заливка</button>
   <input type="color" value="#000000" title="Цвет"><input type="range" min="1" max="30" value="3" title="Толщина"><button data-c="clear">Очистить</button></div>
   <div class="cv"><canvas width="640" height="400"></canvas></div>`);
  const cv=$('canvas',b),c=cv.getContext('2d'),col=$('[type=color]',b),sz=$('[type=range]',b);
  const white=()=>{c.fillStyle='#fff';c.fillRect(0,0,cv.width,cv.height)};white();
  if(id)FS.bytes(id).then(u=>{if(!u||!u.length)return;const im=new Image();im.onload=()=>{cv.width=im.width;cv.height=im.height;white();c.drawImage(im,0,0)};im.src=URL.createObjectURL(new Blob([u]))});
  const save=()=>put(st,'.png',cv.toDataURL('image/png').split(',')[1],true);
  mkApp(st,id?FS.get(id).name:'Paint — новый рисунок',720,520,b,save);
  let tool='pencil',down=false,sx,sy,snap;
  const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
  function fill(x,y,hex){x|=0;y|=0;const w=cv.width,h=cv.height,im=c.getImageData(0,0,w,h),d=im.data,i0=(y*w+x)*4,t=[d[i0],d[i0+1],d[i0+2]],
      n=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));if(t[0]==n[0]&&t[1]==n[1]&&t[2]==n[2])return;
    const m=i=>d[i]==t[0]&&d[i+1]==t[1]&&d[i+2]==t[2],s=[[x,y]];
    while(s.length){let[a,q]=s.pop();while(q>=0&&m((q*w+a)*4))q--;q++;let l=false,r=false;
      for(;q<h&&m((q*w+a)*4);q++){const k=(q*w+a)*4;d[k]=n[0];d[k+1]=n[1];d[k+2]=n[2];d[k+3]=255;
        if(a>0){const z=m(k-4);if(!l&&z){s.push([a-1,q]);l=true}else if(l&&!z)l=false}
        if(a<w-1){const z=m(k+4);if(!r&&z){s.push([a+1,q]);r=true}else if(r&&!z)r=false}}}
    c.putImageData(im,0,0)}
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);const[x,y]=pos(e);
    if(tool==='fill'){fill(x,y,col.value);st.touch();return}
    down=true;sx=x;sy=y;if(!/pencil|eraser/.test(tool))snap=c.getImageData(0,0,cv.width,cv.height);
    c.lineCap=c.lineJoin='round';c.lineWidth=+sz.value*(tool==='eraser'?3:1);c.strokeStyle=tool==='eraser'?'#fff':col.value;
    if(/pencil|eraser/.test(tool)){c.beginPath();c.moveTo(x,y);c.lineTo(x+.01,y);c.stroke()}};
  cv.onpointermove=e=>{if(!down)return;const[x,y]=pos(e);
    if(/pencil|eraser/.test(tool)){c.lineTo(x,y);c.stroke()}
    else{c.putImageData(snap,0,0);c.beginPath();
      if(tool==='line'){c.moveTo(sx,sy);c.lineTo(x,y)}
      if(tool==='rect')c.rect(sx,sy,x-sx,y-sy);
      if(tool==='oval')c.ellipse((sx+x)/2,(sy+y)/2,Math.abs(x-sx)/2,Math.abs(y-sy)/2,0,0,7);
      c.stroke()}st.touch()};
  cv.onpointerup=cv.onpointercancel=()=>down=false;
  b.onclick=e=>{const t=e.target;if(t.dataset.t){tool=t.dataset.t;b.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x===t))}
    if(t.dataset.c==='save')save();if(t.dataset.c==='dl'&&save())FS.download(st.id);
    if(t.dataset.c==='clear'&&confirm('Очистить рисунок?')){white();st.touch()}};
}

/* ---------- EXCEL ---------- */
const nums=a=>a.flat(9).map(Number).filter(x=>!isNaN(x));
const FN={SUM:(...a)=>nums(a).reduce((s,x)=>s+x,0),AVERAGE:(...a)=>{const n=nums(a);return n.reduce((s,x)=>s+x,0)/n.length},
  MIN:(...a)=>Math.min(...nums(a)),MAX:(...a)=>Math.max(...nums(a)),COUNT:(...a)=>nums(a).length,
  ROUND:(x,n=0)=>Math.round(x*10**n)/10**n,ABS:Math.abs,SQRT:Math.sqrt,IF:(c,a,b)=>c?a:b};
Object.assign(FN,{СУММ:FN.SUM,СРЗНАЧ:FN.AVERAGE,МИН:FN.MIN,МАКС:FN.MAX,СЧЁТ:FN.COUNT,ОКРУГЛ:FN.ROUND,ЕСЛИ:FN.IF});
function parseCSV(t){t=t.replace(/^\uFEFF/,'');const d=t.split('\n')[0].includes(';')?';':',',rows=[];let r=[],f='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){if(ch==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=ch}
    else if(ch==='"')q=true;else if(ch===d){r.push(f);f=''}else if(ch==='\n'){r.push(f);rows.push(r);r=[];f=''}else if(ch!=='\r')f+=ch}
  if(f||r.length){r.push(f);rows.push(r)}return rows}
function excel(id){
  const st={id},R=40,C=26,data={},cn=i=>String.fromCharCode(65+i),rc=k=>{const m=/^([A-Z])(\d+)$/.exec(k);return[m[1].charCodeAt(0)-65,+m[2]]};
  if(id)parseCSV(FS.get(id).content).forEach((r,y)=>r.forEach((v,x)=>{if(v!==''&&y<R&&x<C)data[cn(x)+(y+1)]=v}));
  let h='<table><thead><tr><th></th>';for(let x=0;x<C;x++)h+='<th>'+cn(x)+'</th>';h+='</tr></thead><tbody>';
  for(let y=1;y<=R;y++){h+='<tr><th>'+y+'</th>';for(let x=0;x<C;x++)h+=`<td><input data-k="${cn(x)+y}"></td>`;h+='</tr>'}
  const b=el(`<div class="tools"><button data-c="save">💾 Сохранить</button><button data-c="dl">⬇ Скачать .csv</button><span class="cellname">A1</span><span class="hint">=A1+B1 · =СУММ(A1:A5) · СРЗНАЧ · МИН · МАКС · ЕСЛИ</span></div><div class="sheet">${h}</tbody></table></div>`);
  function val(k,d=0){const raw=data[k];if(raw==null||raw==='')return'';
    if(raw[0]!=='='){const n=raw.replace(',','.').trim();return n!==''&&!isNaN(n)?+n:raw}
    if(d>30)return'#ЦИКЛ';
    try{let e=raw.slice(1);
      e=e.replace(/([A-Za-z])(\d+):([A-Za-z])(\d+)/g,(m,a,r1,c2,r2)=>{const o=[],x1=a.toUpperCase().charCodeAt(0)-65,x2=c2.toUpperCase().charCodeAt(0)-65;
        for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)for(let y=Math.min(+r1,+r2);y<=Math.max(+r1,+r2);y++){const v=val(cn(x)+y,d+1);if(typeof v==='number')o.push(v)}return'['+o+']'});
      e=e.replace(/\b([A-Za-z])(\d+)\b/g,(m,a,n)=>{const v=val(a.toUpperCase()+n,d+1);return typeof v==='number'?v:v===''?0:JSON.stringify(v)});
      e=e.replace(/[A-Za-zА-Яа-яЁё]{2,}(?=\()/g,s=>s.toUpperCase()).replace(/;/g,',').replace(/\^/g,'**').replace(/<>/g,'!=').replace(/(?<![<>=!])=(?!=)/g,'==');
      const r=new Function(...Object.keys(FN),'return '+e)(...Object.values(FN));
      return typeof r==='number'?(isFinite(r)?Math.round(r*1e10)/1e10:'#ДЕЛ/0'):r}catch(x){return'#ОШИБКА'}}
  const inputs=[...b.querySelectorAll('input')];
  const show=()=>inputs.forEach(i=>{if(document.activeElement===i)return;const k=i.dataset.k,v=data[k];i.value=v==null?'':v[0]==='='?val(k):v});
  const commit=i=>{const k=i.dataset.k;if(i.value!=='')data[k]=i.value;else delete data[k]};
  const save=()=>{const a=document.activeElement;if(a&&a.dataset&&a.dataset.k)commit(a);let mx=0,my=0;
    Object.keys(data).forEach(k=>{const[x,y]=rc(k);mx=Math.max(mx,x+1);my=Math.max(my,y)});
    const q=v=>/[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;let t='\uFEFF';
    for(let y=1;y<=my;y++){const row=[];for(let x=0;x<mx;x++)row.push(q(data[cn(x)+y]||''));t+=row.join(';')+'\n'}
    return put(st,'.csv',t)};
  mkApp(st,id?FS.get(id).name:'Excel — новая таблица',720,480,b,save);
  b.addEventListener('focusin',e=>{const i=e.target;if(i.dataset.k){i.value=data[i.dataset.k]||'';$('.cellname',b).textContent=i.dataset.k;i.select()}});
  b.addEventListener('focusout',e=>{if(e.target.dataset.k){commit(e.target);show()}});
  b.addEventListener('input',e=>{if(e.target.dataset.k)st.touch()});
  b.addEventListener('keydown',e=>{const i=e.target,k=i.dataset.k;if(!k)return;const d=e.key==='Enter'||e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;
    if(d){e.preventDefault();const[x,y]=rc(k),n=b.querySelector(`[data-k="${cn(x)+(y+d)}"]`);n&&n.focus()}});
  b.onclick=e=>{const c=e.target.dataset.c;if(c==='save')save();if(c==='dl'&&save())FS.download(st.id)};
  show();
}

/* ---------- POWERPOINT ---------- */
function ppt(id){
  const st={id},mk=(t='Новый слайд',bb='')=>({t,b:bb,bg:'#1f6f8b',fg:'#ffffff'});let slides=[mk('Заголовок презентации','Подзаголовок')],cur=0;
  if(id){try{const s=JSON.parse(FS.get(id).content);if(Array.isArray(s)&&s.length)slides=s}catch(e){}}
  const b=el(`<div class="tools"><button data-c="save">💾 Сохранить</button><button data-c="html">⬇ HTML</button><button data-c="add">+ Слайд</button><button data-c="dup">Копия</button><button data-c="del">🗑</button><button data-c="up">↑</button><button data-c="dn">↓</button>
   <label>Фон <input type="color" data-p="bg"></label><label>Текст <input type="color" data-p="fg"></label><button data-c="show">▶ Показ</button></div>
   <div style="display:flex;flex:1;min-height:0"><div class="slides"></div><div class="pane"><div class="stage"><div class="st" contenteditable="true"></div><div class="sb" contenteditable="true"></div></div></div></div>`);
  const stage=$('.stage',b),T=$('.st',b),B=$('.sb',b),list=$('.slides',b);
  const save=()=>put(st,'.slides',JSON.stringify(slides));
  mkApp(st,id?FS.get(id).name:'PowerPoint — новая презентация',780,480,b,save);
  const label=i=>(i+1)+'. '+(slides[i].t||'—').slice(0,16);
  const draw=()=>{list.innerHTML='';slides.forEach((s,i)=>{const x=document.createElement('button');x.className=i===cur?'on':'';x.textContent=label(i);x.onclick=()=>{cur=i;draw()};list.append(x)});
    const s=slides[cur];stage.style.background=s.bg;stage.style.color=s.fg;T.textContent=s.t;B.textContent=s.b;$('[data-p=bg]',b).value=s.bg;$('[data-p=fg]',b).value=s.fg};
  T.onpaste=B.onpaste=e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))};
  T.oninput=()=>{slides[cur].t=T.innerText.replace(/\n$/,'');list.children[cur].textContent=label(cur);st.touch()};
  B.oninput=()=>{slides[cur].b=B.innerText.replace(/\n$/,'');st.touch()};
  b.oninput=e=>{const p=e.target.dataset.p;if(p){slides[cur][p]=e.target.value;stage.style[p==='bg'?'background':'color']=e.target.value;st.touch()}};
  const inner=s=>`<div class="st">${esc(s.t)}</div><div class="sb">${esc(s.b)}</div>`;
  function show(){const o=document.createElement('div'),sg=document.createElement('div'),x=document.createElement('button');let i=cur;
    o.style.cssText='position:fixed;inset:0;background:#000;z-index:20000;display:flex;align-items:center;justify-content:center;overflow:hidden';
    sg.className='stage';x.textContent='✕ Выход';x.style.cssText='position:fixed;top:8px;right:8px';o.append(sg,x);document.body.append(o);
    const r=()=>{const s=slides[i];sg.style.background=s.bg;sg.style.color=s.fg;sg.style.transform=`scale(${Math.min(innerWidth/640,innerHeight/360)})`;sg.innerHTML=inner(s)};
    const nx=d=>{i=Math.max(0,Math.min(slides.length-1,i+d));r()};
    const end=()=>{o.remove();removeEventListener('keydown',key,true)};
    const key=e=>{e.preventDefault();e.stopPropagation();if(e.key==='Escape')end();else if(['ArrowRight',' ','PageDown'].includes(e.key))nx(1);else if(['ArrowLeft','PageUp'].includes(e.key))nx(-1)};
    addEventListener('keydown',key,true);o.onclick=e=>nx(e.clientX<innerWidth/3?-1:1);x.onclick=e=>{e.stopPropagation();end()};r()}
  b.onclick=e=>{const c=e.target.dataset.c;if(!c)return;
    if(c==='save')save();
    if(c==='add'){slides.splice(cur+1,0,mk());cur++;st.touch()}
    if(c==='dup'){slides.splice(cur+1,0,{...slides[cur]});cur++;st.touch()}
    if(c==='del'&&slides.length>1){slides.splice(cur,1);cur=Math.max(0,cur-1);st.touch()}
    if(c==='up'&&cur>0){[slides[cur-1],slides[cur]]=[slides[cur],slides[cur-1]];cur--;st.touch()}
    if(c==='dn'&&cur<slides.length-1){[slides[cur+1],slides[cur]]=[slides[cur],slides[cur+1]];cur++;st.touch()}
    if(c==='show')return show();
    if(c==='html'){const css='body{margin:0;background:#222;display:flex;flex-direction:column;align-items:center;gap:20px;padding:20px}.stage{width:640px;height:360px;padding:36px 48px;box-sizing:border-box;overflow:hidden}.st{font:700 38px/1.15 Georgia,serif;white-space:pre-wrap;margin-bottom:18px}.sb{font:22px/1.4 sans-serif;white-space:pre-wrap}';
      dlBlob(new Blob(['<!DOCTYPE html><meta charset="utf-8"><title>Презентация</title><style>'+css+'</style>'+slides.map(s=>`<div class="stage" style="background:${esc(s.bg)};color:${esc(s.fg)}">${inner(s)}</div>`).join('')],{type:'text/html'}),(st.id?FS.get(st.id).name.replace(/\.slides$/,''):'Презентация')+'.html');return}
    draw()};
  draw();
}
