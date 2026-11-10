// Установщик InherentOS 1: показывается при первом запуске и после сброса системы (в том числе после вируса)
(function(){
  const KEY='inherentos_installed';
  if(localStorage.getItem('inherentos_wipe')==='1')return; // идёт переустановка после вируса, потом страница перезагрузится
  if(localStorage.getItem(KEY))return;
  const o=overlay();o.classList.add('setup');
  const page=h=>{o.innerHTML='<div class="rsb">'+h+'</div>'};
  const logo='<img class="slogo" src="icons/icon-192.png" alt="">';
  page(logo+'<div class="rst">InherentOS 1</div><div class="rss">Добро пожаловать! Система ещё не установлена.</div><button class="sbtn" id="sinst">Установить InherentOS 1</button>');
  o.querySelector('#sinst').onclick=async()=>{
    page('<div class="rst">Установка InherentOS 1</div><div class="rss">Подготовка…</div><div class="rbar"><i></i></div><div class="rsp">0%</div>');
    const steps=['Подготовка…','Копирование файлов…','Создание файловой системы…','Установка приложений…','Настройка рабочего стола…','Завершение…'],
      bar=o.querySelector('.rbar i'),sp=o.querySelector('.rsp'),ss=o.querySelector('.rss'),ms=7000,t0=Date.now();
    while(Date.now()-t0<ms){const p=(Date.now()-t0)/ms;bar.style.width=p*100+'%';sp.textContent=Math.floor(p*100)+'%';ss.textContent=steps[Math.min(steps.length-1,Math.floor(p*steps.length))];await sleep(100)}
    localStorage.setItem(KEY,'1.0.0');
    page(logo+'<div class="rst">Установка завершена</div><div class="rss">InherentOS 1 готова к работе.</div><button class="sbtn" id="sgo">Запустить</button>');
    o.querySelector('#sgo').onclick=()=>o.remove();
  };
})();
