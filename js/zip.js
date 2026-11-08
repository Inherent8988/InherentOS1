// Мини-ZIP (без сжатия), работает без библиотек
const ZIP=(()=>{
  const T=new Uint32Array(256).map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0});
  const crc=d=>{let c=~0;for(const b of d)c=T[(c^b)&255]^(c>>>8);return(~c)>>>0};
  const enc=new TextEncoder();
  function build(entries){ // [{path, data:Uint8Array|null}] ; null = папка
    const parts=[],cen=[];let off=0;
    for(const e of entries){
      const name=enc.encode(e.path),d=e.data||new Uint8Array(0),c=crc(d);
      const h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);
      h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,name.length,true);
      parts.push(new Uint8Array(h.buffer),name,d);
      const g=new DataView(new ArrayBuffer(46));
      g.setUint32(0,0x02014b50,true);g.setUint16(4,20,true);g.setUint16(6,20,true);g.setUint16(8,0x0800,true);
      g.setUint32(16,c,true);g.setUint32(20,d.length,true);g.setUint32(24,d.length,true);g.setUint16(28,name.length,true);
      g.setUint32(42,off,true);if(!e.data)g.setUint32(38,0x10,true);
      cen.push(new Uint8Array(g.buffer),name);
      off+=30+name.length+d.length;
    }
    const cs=cen.reduce((s,x)=>s+x.length,0);
    const end=new DataView(new ArrayBuffer(22));
    end.setUint32(0,0x06054b50,true);end.setUint16(8,entries.length,true);end.setUint16(10,entries.length,true);
    end.setUint32(12,cs,true);end.setUint32(16,off,true);
    return new Blob([...parts,...cen,new Uint8Array(end.buffer)],{type:'application/zip'});
  }
  return{build};
})();
