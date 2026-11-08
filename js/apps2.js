// Дополнительные приложения: Калькулятор, Терминал, Змейка, Сапёр
function calc(){
  const keys=['C','⌫','(',')','7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];
  const b=el(`<div class="calc"><input class="disp" readonly value="0"><div class="keys">${keys.map(k=>`<button class="${/[\/*\-+]/.test(k)?'op':k==='='?'eq':''}">${k}</button>`).join('')}</div></div>`);
  const disp=$('.disp',b);let ex='';
  const press=k=>{if(k==='C')ex='';else if(k==='⌫')ex=ex.slice(0,-1);
    else if(k==='='){try{if(!/^[\d+\-*/().\s]+$/.test(ex))throw 0;const r=Function('"use strict";return('+ex+')')();ex=isFinite(r)?String(Math.round(r*1e10)/1e10):'Ошибка'}catch(e){ex='Ошибка'}}
    else{if(ex==='Ошибка')ex='';ex+=k}disp.value=ex||'0'};
  b.onclick=e=>{if(e.target.tagName==='BUTTON')press(e.target.textContent)};
  b.tabIndex=0;b.onkeydown=e=>{const k=e.key;if(/^[\d+\-*/().]$/.test(k))press(k);else if(k==='Enter'||k==='=')press('=');else if(k==='Backspace')press('⌫');else if(k==='Escape')press('C');else return;e.preventDefault()};
  openWin('Калькулятор',270,380,b);b.focus();
}

function term(){
  let cwd='root';const hist=[];let hi=0;
  const b=el(`<div class="term"><div class="tout"></div><div class="tin"><span class="pr"></span><input spellcheck="false" autocomplete="off"></div></div>`);
  const out=$('.tout',b),inp=$('input',b),pr=$('.pr',b);
  const w=t=>{out.textContent+=t+'\n';out.scrollTop=out.scrollHeight};
  const pth=()=>FS.path(cwd).replace(/ › /g,'/').replace('Мой компьютер','~');
  const find=(p,from=cwd)=>{let id=p.startsWith('/')?'root':from;
    for(const s of p.split('/').filter(Boolean)){if(s==='.'||s==='~')continue;if(s==='..'){id=FS.get(id).parent||id;continue}
      const k=FS.kids(id).find(([i,f])=>f.name===s);if(!k)return null;id=k[0]}return id};
  const C={
    help:()=>w('Команды: ls, cd <папка>, pwd, mkdir <имя>, touch <имя>, cat <файл>, rm <имя>,\necho <текст> [> файл], run <файл.js>, open <файл>, date, clear'),
    ls:()=>w(FS.kids(cwd).map(([i,f])=>f.name+(f.type==='folder'?'/':'')).join('\n')||'(пусто)'),
    pwd:()=>w(pth()),date:()=>w(new Date().toLocaleString('ru')),clear:()=>out.textContent='',
    cd:a=>{const id=find(a||'/');if(id&&FS.get(id).type==='folder')cwd=id;else w('cd: папка не найдена')},
    mkdir:a=>a?FS.add(cwd,FS.unique(cwd,a),'folder'):w('mkdir: укажи имя'),
    touch:a=>a?FS.add(cwd,FS.unique(cwd,a),'file',''):w('touch: укажи имя'),
    cat:a=>{const id=find(a);const f=id&&FS.get(id);if(!f||f.type!=='file')w('cat: файл не найден');else w(f.bin?'(двоичный файл)':f.content)},
    rm:a=>{const id=find(a);if(!id||id==='root')w('rm: не найдено');else FS.del(id)},
    open:a=>{const id=find(a);id?FS.get(id).type==='folder'?explorer(id):openFile(id):w('open: не найдено')},
    echo:a=>{const m=a.split(' > ');if(m.length<2)return w(a);const n=m[1].trim();let id=find(n);if(!id)id=FS.add(cwd,n,'file','');FS.setContent(id,m[0])},
    run:a=>{const id=find(a);const f=id&&FS.get(id);if(!f||f.type!=='file'||f.bin)return w('run: файл не найден');
      const log=(...x)=>w(x.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(' '));
      try{new Function('console',f.content)({log,error:log,warn:log,info:log})}catch(e){w('Ошибка: '+e.message)}}
  };
  const upd=()=>pr.textContent=pth()+'> ';
  inp.onkeydown=e=>{
    if(e.key==='ArrowUp'&&hist.length){hi=Math.max(0,hi-1);inp.value=hist[hi];e.preventDefault()}
    if(e.key==='ArrowDown'){hi=Math.min(hist.length,hi+1);inp.value=hist[hi]||'';e.preventDefault()}
    if(e.key!=='Enter')return;const line=inp.value.trim();inp.value='';w(pth()+'> '+line);if(!line)return;hist.push(line);hi=hist.length;
    const sp=line.indexOf(' '),cmd=(sp<0?line:line.slice(0,sp)).toLowerCase(),arg=sp<0?'':line.slice(sp+1).trim().replace(/^"(.*)"$/,'$1');
    if(C[cmd])C[cmd](arg);else w('Неизвестная команда: '+cmd+'. Введи help');upd()};
  b.onclick=()=>inp.focus();w('InherentOS Terminal. Введи help');upd();
  openWin('Терминал',560,360,b);inp.focus();
}

function snake(){
  const b=el(`<div class="game"><div class="gs">Счёт: 0</div><div class="srow"><canvas width="300" height="300"></canvas><div class="pad"><button data-d="0,-1">↑</button><div><button data-d="-1,0">←</button><button data-d="0,1">↓</button><button data-d="1,0">→</button></div></div></div></div>`);
  const cv=$('canvas',b),c=cv.getContext('2d'),gs=$('.gs',b),N=15,Z=20;
  let s,dir,nd,food,score,run=false,t;
  const rnd=()=>Math.floor(Math.random()*N);
  const reset=()=>{s=[[7,7],[6,7],[5,7]];dir=nd=[1,0];score=0;do{food=[rnd(),rnd()]}while(s.some(p=>p[0]==food[0]&&p[1]==food[1]));gs.textContent='Счёт: 0';run=true};
  const draw=()=>{c.fillStyle='#0f1b21';c.fillRect(0,0,300,300);c.fillStyle='#e0566b';c.fillRect(food[0]*Z+2,food[1]*Z+2,Z-4,Z-4);
    s.forEach((p,i)=>{c.fillStyle=i?'#4fd1c5':'#a7f3ea';c.fillRect(p[0]*Z+1,p[1]*Z+1,Z-2,Z-2)})};
  const tick=()=>{if(!run)return;const h=[s[0][0]+nd[0],s[0][1]+nd[1]];dir=nd;
    if(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N||s.some(p=>p[0]==h[0]&&p[1]==h[1])){run=false;gs.textContent='Конец! Счёт: '+score+' — нажми стрелку';return}
    s.unshift(h);if(h[0]==food[0]&&h[1]==food[1]){score++;gs.textContent='Счёт: '+score;do{food=[rnd(),rnd()]}while(s.some(p=>p[0]==food[0]&&p[1]==food[1]))}else s.pop();draw()};
  const turn=d=>{if(!run){reset()}if(d[0]!==-dir[0]||d[1]!==-dir[1])nd=d};
  b.tabIndex=0;b.onkeydown=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(m){e.preventDefault();turn(m)}};
  b.onclick=e=>{const d=e.target.dataset.d;if(d)turn(d.split(',').map(Number));b.focus()};
  reset();draw();t=setInterval(tick,130);
  openWin('Змейка',480,380,b,()=>{clearInterval(t)});b.focus();
}

function mines(){
  const N=9,M=10;let g,over,first,fm=false;
  const b=el(`<div class="game"><div class="tools"><button data-c="new">🙂 Заново</button><button data-c="flag">🚩 Флажок: выкл</button></div><div class="gs"></div><div class="mg"></div></div>`);
  const mg=$('.mg',b),gs=$('.gs',b);
  const nb=i=>{const x=i%N,y=i/N|0,r=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,q=y+dy;if((dx||dy)&&a>=0&&a<N&&q>=0&&q<N)r.push(q*N+a)}return r};
  const init=()=>{g=Array.from({length:N*N},()=>({m:0,o:0,f:0,n:0}));over=false;first=true;gs.textContent='Мин: '+M};
  const plant=s=>{let k=0;while(k<M){const i=Math.floor(Math.random()*N*N);if(i!==s&&!g[i].m){g[i].m=1;k++}}g.forEach((x,i)=>x.n=nb(i).filter(j=>g[j].m).length)};
  const open=i=>{const x=g[i];if(x.o||x.f)return;x.o=1;if(x.m){over=true;return}if(!x.n)nb(i).forEach(open)};
  const COL=['','#6cb6ff','#7ee787','#ff7b72','#d2a8ff','#ffa657','#4fd1c5','#fff','#aaa'];
  const draw=()=>{mg.innerHTML='';g.forEach((x,i)=>{const e=document.createElement('button');e.dataset.i=i;
    if(over&&x.m){e.textContent='💣';e.className='o'}else if(x.o){e.className='o';if(x.n){e.textContent=x.n;e.style.color=COL[x.n]}}else if(x.f)e.textContent='🚩';mg.append(e)});
    if(over)gs.textContent='💥 Взрыв! Нажми «Заново»';
    else if(g.filter(x=>x.o).length===N*N-M){over=true;gs.textContent='🎉 Победа!'}};
  const flag=i=>{if(!over&&!g[i].o){g[i].f^=1;draw()}};
  mg.onclick=e=>{const t=e.target.closest('button');if(!t||over)return;const i=+t.dataset.i;if(fm)return flag(i);
    if(first){plant(i);first=false}open(i);draw()};
  mg.oncontextmenu=e=>{e.preventDefault();const t=e.target.closest('button');if(t)flag(+t.dataset.i)};
  b.querySelector('.tools').onclick=e=>{const c=e.target.dataset.c;if(c==='new'){init();draw()}if(c==='flag'){fm=!fm;e.target.textContent='🚩 Флажок: '+(fm?'вкл':'выкл')}};
  init();draw();openWin('Сапёр',340,440,b);
}
