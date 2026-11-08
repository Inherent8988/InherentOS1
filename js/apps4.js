// Настройки InherentOS: хранилище
function settings(){
  const b=el(`<div class="setwrap"><div class="snav"><div class="sbrand">InherentOS</div><button data-p="storage">Storage</button><button data-p="about">About the Device</button></div><div class="set"><div class="sbody"><p class="dim">Выбери раздел слева.</p></div></div></div>`),body=$('.sbody',b);
  const fmt=n=>n>=2**30?(n/2**30).toFixed(2)+' ГБ':n>=2**20?(n/2**20).toFixed(1)+' МБ':n>=1024?Math.round(n/1024)+' КБ':n+' Б';
  const bar=(a,t)=>`<div class="bar"><i style="width:${Math.max(a>0?1:0,Math.min(100,t?a/t*100:0))}%"></i></div>`;
  async function render(){
    body.textContent='Считаю…';
    const all=FS.all();let legacy=false;
    for(const[k,v]of all)if(v.type==='file'&&v.big&&v.size==null){const u=await FS.bytes(k);v.size=u?u.length:0;legacy=true}
    if(legacy)FS.save();
    const size=v=>v.big?v.size||0:v.bin?Math.floor(v.content.length*3/4):v.content.length;
    const files=all.filter(([k,v])=>v.type==='file'),folders=all.filter(([k,v])=>v.type==='folder'&&k!=='root').length;
    const bigSum=files.filter(([k,v])=>v.big).reduce((s,[k,v])=>s+size(v),0);
    let ls=0;try{ls=Object.keys(localStorage).reduce((s,k)=>s+k.length+(localStorage.getItem(k)||'').length,0)}catch(e){}
    let est=null,pers=null;try{est=await navigator.storage.estimate()}catch(e){}try{pers=await navigator.storage.persisted()}catch(e){}
    const top=files.map(([k,v])=>[v.name,size(v)]).sort((a,b)=>b[1]-a[1]).slice(0,5);
    body.innerHTML='<h3>💾 Storage</h3>'+(est&&est.quota?`<p><b>Занято:</b> ${fmt(est.usage)} из ${fmt(est.quota)}</p>${bar(est.usage,est.quota)}
      <p><b>Осталось:</b> ${fmt(Math.max(0,est.quota-est.usage))}</p>
      <p class="dim">Это максимум, который браузер разрешает этому сайту. Реально записать можно не больше свободного места на телефоне.</p>`
      :'<p>Браузер не сообщает лимит хранилища.</p>')+
    `<h4>Файлы InherentOS</h4><table>
      <tr><td>Файлов / папок</td><td>${files.length} / ${folders}</td></tr>
      <tr><td>Большие файлы (музыка, фото, видео, ZIP)</td><td>${fmt(bigSum)}</td></tr>
      <tr><td>Документы и текст (лимит около 5 МБ)</td><td>${(ls/1048576).toFixed(2)} из 5 МБ</td></tr></table>${bar(ls,5242880)}
    <h4>Самые большие файлы</h4><table>${top.map(t=>`<tr><td>${esc(t[0])}</td><td>${fmt(t[1])}</td></tr>`).join('')||'<tr><td>Файлов нет</td><td></td></tr>'}</table>
    <h4>Постоянное хранилище</h4><p>${pers===true?'✅ Включено: браузер не удалит файлы сам.':pers===false?'⚠️ Не включено: при нехватке места браузер может удалить данные сайта.':'Не поддерживается этим браузером.'}</p>
    ${pers===false?'<button data-c="persist">Запросить постоянное хранилище</button> ':''}<button data-c="refresh">↻ Пересчитать</button>`;
  }
  const about=()=>body.innerHTML='<h3>ℹ️ About the Device</h3><table><tr><td>Type</td><td>WebOS</td></tr><tr><td>Model</td><td>InherentOS 1.0.0</td></tr><tr><td>Technology</td><td>HTML, CSS, JavaScript</td></tr><tr><td>Storage</td><td>Max 10GB</td></tr></table>';
  const nav=p=>{b.querySelectorAll('.snav button').forEach(x=>x.classList.toggle('on',x.dataset.p===p));p==='storage'?render():about()};
  b.onclick=async e=>{const p=e.target.dataset.p;if(p){nav(p);return}const c=e.target.dataset.c;if(c==='refresh')render();
    if(c==='persist'){let ok=false;try{ok=await navigator.storage.persist()}catch(x){}if(!ok)alert('Браузер не разрешил. Иногда помогает добавить сайт на домашний экран или чаще им пользоваться.');render()}};
  openWin('Настройки',520,440,b);
}
