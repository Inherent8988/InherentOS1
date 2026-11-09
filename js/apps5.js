// Bing в окне (iframe)
function bing(){
  const HOME='https://www.bing.com/';
  const b=el(`<div class="tools"><button data-c="home">🏠</button><button data-c="reload">↻</button><input class="bq" placeholder="Поиск в Bing или адрес сайта" autocomplete="off"><button data-c="go">Найти</button><button data-c="full">⛶ Весь экран / окно</button><button data-c="ext">↗ В браузере</button></div><iframe class="bf" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe><div class="stat">Если страница не открывается в окне, нажми «↗ В браузере»: некоторые сайты запрещают показ внутри чужих страниц.</div>`);
  const fr=$('.bf',b),q=$('.bq',b);let cur=HOME;
  const open=u=>{cur=u;fr.src=u};
  const go=()=>{const t=q.value.trim();if(!t)return open(HOME);
    open(/^https?:\/\//i.test(t)?t:'https://www.bing.com/search?q='+encodeURIComponent(t))};
  const win=openWin('Bing',680,460,b);open(HOME);
  q.onkeydown=e=>{if(e.key==='Enter')go()};
  b.onclick=e=>{const c=e.target.dataset.c;if(c==='home'){q.value='';open(HOME)}if(c==='reload'){fr.src='about:blank';setTimeout(()=>fr.src=cur,50)}
    if(c==='go')go();if(c==='full')win.el.querySelector('[data-a=max]').click();if(c==='ext')window.open(cur,'_blank','noopener')};
}
