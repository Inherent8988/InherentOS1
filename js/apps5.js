// Browser: свой браузер InherentOS (страницы показываются в окне через iframe)
function browser(){
  const SITES=[['Википедия','https://ru.wikipedia.org/'],['Wiktionary','https://ru.wiktionary.org/'],['Mojeek','https://www.mojeek.com/'],['Marginalia','https://search.marginalia.nu/'],['Wiby','https://wiby.me/'],
    ['Bing','https://www.bing.com/',1],['Google','https://www.google.com/',1],['DuckDuckGo','https://duckduckgo.com/',1],['YouTube','https://www.youtube.com/',1]];
  const ENG={wiki:['Поиск: Википедия','https://ru.wikipedia.org/w/index.php?search=%s'],mojeek:['Поиск: Mojeek','https://www.mojeek.com/search?q=%s'],marg:['Поиск: Marginalia','https://search.marginalia.nu/search?query=%s'],
    bing:['Поиск: Bing (вкладка)','https://www.bing.com/search?q=%s',1],google:['Поиск: Google (вкладка)','https://www.google.com/search?q=%s',1],ddg:['Поиск: DuckDuckGo (вкладка)','https://duckduckgo.com/?q=%s',1]};
  const b=el(`<div class="tools"><button data-c="back">←</button><button data-c="fwd">→</button><button data-c="reload">↻</button><button data-c="home">🏠</button>
    <input class="bq" placeholder="Адрес сайта или запрос" autocomplete="off" autocapitalize="off"><button data-c="go">Перейти</button>
    <select class="bsel">${Object.entries(ENG).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select>
    <button data-c="full">⛶ Весь экран / окно</button><button data-c="ext">↗ В браузере</button></div>
    <div class="bstart"><h3>🌐 Browser</h3><p class="dim">Введи адрес сайта (например ru.wikipedia.org) или запрос и нажми «Перейти». Сайты со значком ↗ запрещают показ в окне и откроются в обычной вкладке.</p>
    <div class="bgrid">${SITES.map(s=>`<button data-u="${s[1]}" data-x="${s[2]?1:0}">${s[0]}${s[2]?' ↗':''}</button>`).join('')}</div></div>
    <iframe class="bf hidden" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
    <div class="stat">Если страница пустая или с ошибкой, сайт запрещает показ в окне. Нажми «↗ В браузере».</div>`);
  const fr=$('.bf',b),q=$('.bq',b),sel=$('.bsel',b),start=$('.bstart',b);let hist=[''],hi=0,cur='';
  const win=openWin('Browser',700,470,b);
  const nav=(u,push=true)=>{cur=u;q.value=u;start.classList.add('hidden');fr.classList.remove('hidden');fr.src=u;if(push){hist=hist.slice(0,hi+1);hist.push(u);hi=hist.length-1}};
  const home=(push=true)=>{cur='';q.value='';fr.classList.add('hidden');fr.src='about:blank';start.classList.remove('hidden');if(push){hist=hist.slice(0,hi+1);hist.push('');hi=hist.length-1}};
  const ext=u=>window.open(u,'_blank','noopener');
  const parse=t=>{t=t.trim();if(!t)return null;if(/^https?:\/\//i.test(t))return[t,0];
    if(/^[^\s\/]+\.[a-z]{2,}([\/?#]\S*)?$/i.test(t))return['https://'+t,0];const e=ENG[sel.value];return[e[1].replace('%s',encodeURIComponent(t)),e[2]?1:0]};
  const go=()=>{const r=parse(q.value);if(!r)return home();r[1]?ext(r[0]):nav(r[0])};
  const step=d=>{const n=hi+d;if(n<0||n>=hist.length)return;hi=n;hist[n]?nav(hist[n],false):home(false)};
  q.onkeydown=e=>{if(e.key==='Enter')go()};
  b.onclick=e=>{const t=e.target,c=t.dataset.c;
    if(t.dataset.u){t.dataset.x==='1'?ext(t.dataset.u):nav(t.dataset.u);return}
    if(c==='go')go();if(c==='home')home();if(c==='back')step(-1);if(c==='fwd')step(1);
    if(c==='reload'&&cur){fr.src='about:blank';setTimeout(()=>fr.src=cur,50)}
    if(c==='full')win.el.querySelector('[data-a=max]').click();
    if(c==='ext')ext(cur||'https://ru.wikipedia.org/')};
}
