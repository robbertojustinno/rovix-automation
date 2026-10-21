// ZIP sem compressao: preserva arquivos binarios sem dependencias externas.
// Limite ZIP32 deliberado; chamadas devem impor limite de memoria antes de carregar.
export type ZipEntry={path:string;data:Uint8Array};
function crc32(bytes:Uint8Array){
  let c=0xffffffff;
  for(const b of bytes){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return (c^0xffffffff)>>>0;
}
const encoder=new TextEncoder();
export function makeZip(entries:ZipEntry[]):Blob{
  const parts:BlobPart[]=[];
  const central:Uint8Array[]=[];
  let offset=0;
  for(const entry of entries){
    const name=encoder.encode(entry.path.replace(/\\/g,"/"));
    const data=entry.data;
    if(name.length>65535||data.byteLength>0xffffffff)throw Error("Arquivo grande demais para ZIP32.");
    const crc=crc32(data);
    const local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
    lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);
    lv.setUint16(8,0,true);lv.setUint32(14,crc,true);
    lv.setUint32(18,data.byteLength,true);lv.setUint32(22,data.byteLength,true);
    lv.setUint16(26,name.length,true);local.set(name,30);
    const dir=new Uint8Array(46+name.length),dv=new DataView(dir.buffer);
    dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);
    dv.setUint16(8,0x0800,true);dv.setUint16(10,0,true);
    dv.setUint32(16,crc,true);dv.setUint32(20,data.byteLength,true);
    dv.setUint32(24,data.byteLength,true);dv.setUint16(28,name.length,true);
    dv.setUint32(42,offset,true);dir.set(name,46);
    parts.push(local as BlobPart,data as BlobPart);central.push(dir);
    offset+=local.byteLength+data.byteLength;
    if(offset>0xffffffff)throw Error("Pasta excede o limite do ZIP32.");
  }
  const centralSize=central.reduce((n,c)=>n+c.byteLength,0);
  if(entries.length>65535||offset+centralSize>0xffffffff)throw Error("Pasta excede o limite do ZIP32.");
  const end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);
  ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);
  ev.setUint32(16,offset,true);
  return new Blob([...parts,...central,end],{type:"application/zip"});
}
