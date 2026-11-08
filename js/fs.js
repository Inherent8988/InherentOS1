// Файловая система InherentOS (хранится в localStorage браузера)
const FS=(()=>{
  const KEY='inherentos_fs_v1';let n=0,db;
  const uid=()=>'n'+Date.now().toString(36)+(n++);
  function seed(){
    db={root:{name:'Мой компьютер',type:'folder',parent:null}};
    const d=add('root','Документы','folder'),p=add('root','Проекты','folder');
    add(d,'Привет.txt','file','Добро пожаловать в InherentOS!\nСоздавай папки, файлы .txt и .js, архивы ZIP.\nВсё сохраняется в твоём браузере.');
    add(p,'hello.js','file','console.log("Привет из InherentOS!");\nconsole.log(2+2);');
  }
  function load(){try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!db||!db.root)seed()}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert('Память браузера заполнена. Удали ненужные файлы.')}}
  function add(parent,name,type,content=''){const id=uid();db[id]={name,type,parent,content,ts:Date.now()};save();return id}
  const kids=p=>Object.entries(db).filter(([k,v])=>v.parent===p).sort((a,b)=>(a[1].type===b[1].type?a[1].name.localeCompare(b[1].name):a[1].type==='folder'?-1:1));
  const get=id=>db[id];
  function exists(parent,name,except){return kids(parent).some(([k,v])=>v.name===name&&k!==except)}
  function unique(parent,name){let b=name,i=1,dot=name.lastIndexOf('.');let s=dot>0?name.slice(0,dot):name,e=dot>0?name.slice(dot):'';while(exists(parent,name))name=s+' ('+i++ +')'+e;return name}
  function del(id){kids(id).forEach(([k])=>del(k));if(db[id].big)delBlob(id);delete db[id];save()}
  function rename(id,name){db[id].name=name;save()}
  function setContent(id,c,bin){if(db[id].big){db[id].big=false;delBlob(id)}db[id].content=c;if(bin!==undefined)db[id].bin=bin;db[id].ts=Date.now();save()}
  function path(id){const a=[];while(id){a.unshift(db[id].name);id=db[id].parent}return a.join(' › ')}
  const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const idb=new Promise(r=>{try{const q=indexedDB.open('inherentos_blobs',1);q.onupgradeneeded=()=>q.result.createObjectStore('b');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
  const tx=(m,f)=>idb.then(d=>d?new Promise(r=>{try{const t=d.transaction('b',m);f(t.objectStore('b'));t.oncomplete=()=>r(true);t.onerror=t.onabort=()=>r(null)}catch(e){r(null)}}):null);
  const getBlob=id=>idb.then(d=>d?new Promise(r=>{try{const q=d.transaction('b').objectStore('b').get(id);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}}):null);
  const putBlob=(id,u8)=>tx('readwrite',s=>s.put(u8,id)),delBlob=id=>tx('readwrite',s=>s.delete(id));
  async function addBin(parent,name,u8){const id=add(parent,name,'file','');db[id].bin=true;
    if(await putBlob(id,u8)===true)db[id].big=true;else db[id].content=b64(u8);db[id].size=u8.length;save();return id}
  async function bytesOf(id){const n=db[id];if(!n)return null;if(!n.bin)return new TextEncoder().encode(n.content);return n.big?await getBlob(id):unb64(n.content)}
  async function entries(id,prefix=''){const out=[];for(const[k,v]of kids(id)){
    if(v.type==='folder')out.push({path:prefix+v.name+'/',data:null},...await entries(k,prefix+v.name+'/'));else out.push({path:prefix+v.name,data:await bytesOf(k)})}return out}
  async function zip(id){const f=db[id],blob=ZIP.build([{path:f.name+'/',data:null},...await entries(id,f.name+'/')]);
    return addBin(f.parent,unique(f.parent,f.name+'.zip'),new Uint8Array(await blob.arrayBuffer()))}
  async function fileOf(id){const f=db[id],fold=f.type==='folder';
    return{name:fold?f.name+'.zip':f.name,blob:fold?ZIP.build([{path:f.name+'/',data:null},...await entries(id,f.name+'/')]):new Blob([await bytesOf(id)])}}
  const bridge=()=>window.Android&&window.Android.beginShare!==undefined; // мост из Android-приложения (WebView)
  async function share(id){ // окно «Поделиться»
    const{name,blob}=await fileOf(id),type=blob.type||'application/octet-stream';
    if(bridge()){const CH=3*174762;Android.beginShare(name,type);
      for(let i=0;i<blob.size;i+=CH)Android.shareChunk(b64(new Uint8Array(await blob.slice(i,i+CH).arrayBuffer())));
      Android.endShare();return true}
    try{const file=new File([blob],name,{type});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return true}}
    catch(e){if(e&&e.name==='AbortError')return true}
    return false}
  async function download(id){
    if(bridge())return share(id); // в WebView обычное скачивание не работает
    const{name,blob}=await fileOf(id),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
  function reset(){localStorage.removeItem(KEY);tx('readwrite',s=>s.clear());seed()}
  load();
  return{get,kids,add,del,rename,setContent,path,zip,download,exists,unique,reset,b64,unb64,addBin,bytes:bytesOf,share,save,all:()=>Object.entries(db)};
})();
