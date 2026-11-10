// Включение и выключение InherentOS
function powerBoot(o){ // экран загрузки, потом страница перезагружается (все окна закрыты)
  o.innerHTML='<div class="rsb"><img class="slogo" src="icons/icon-192.png" alt=""><div class="rst">InherentOS 1</div><div class="rbar"><i></i></div></div>';
  const bar=o.querySelector('.rbar i'),t0=Date.now();
  const tick=()=>{const p=Math.min(1,(Date.now()-t0)/3000);bar.style.width=p*100+'%';
    if(p<1)requestAnimationFrame(tick);else{localStorage.removeItem('inherentos_off');location.reload()}};
  tick();
}
function powerScreen(o){ // чёрный экран выключенной системы с кнопкой включения
  o.innerHTML='<button class="pwr" title="Включить">⏻</button><div class="pwt">Система выключена. Нажми кнопку, чтобы включить.</div>';
  o.querySelector('.pwr').onclick=()=>powerBoot(o);
}
async function powerOff(restart){
  const dirty=(typeof wins!=='undefined'?wins:[]).some(w=>/ \*$/.test(w.tb.textContent));
  if(dirty&&!confirm('Есть несохранённые изменения. Всё равно '+(restart?'перезагрузить?':'выключить?')))return;
  const st=document.getElementById('start');if(st)st.classList.add('hidden');
  const o=overlay();o.innerHTML='<div class="rsb"><div class="spin"></div><div class="rst">'+(restart?'Перезагрузка…':'Завершение работы…')+'</div></div>';
  await sleep(2200);
  if(restart)return powerBoot(o);
  localStorage.setItem('inherentos_off','1');powerScreen(o);
}
// если систему выключили и закрыли страницу, при следующем открытии она остаётся выключенной
if(localStorage.getItem('inherentos_off')==='1'&&localStorage.getItem('inherentos_wipe')!=='1')powerScreen(overlay());
