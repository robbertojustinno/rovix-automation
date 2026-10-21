import test from 'node:test';
import assert from 'node:assert/strict';
import {imageInventory} from './social-image-inventory.mjs';
const catalog={files:['a','b','c','d'].map(id=>({id,object_key:'owner/'+id}))};
test('separa imagens usadas, reservadas e livres sem contar postagens repetidas',()=>{
 const db={posts:[{driveFileId:'a',status:'published'},{driveFileId:'a',status:'published'},{driveFileId:'b',status:'approved'}],meta:{manualPreviewBatch:{entries:[{driveFileId:'c'}]}}};
 assert.deepEqual(imageInventory(catalog,db),{total:4,used:1,reserved:2,remaining:1});
});
test('contabiliza fontes legadas e histórico removido e ignora arquivos fora da pasta',()=>{
 const db={posts:[{visualSource:'rovix-drive://a',status:'cancelled'},{strategy:{visual:{fileId:'b'}},status:'deleted'},{driveFileId:'missing',status:'published'}]};
 assert.deepEqual(imageInventory(catalog,db),{total:4,used:2,reserved:0,remaining:2});
});
test('uma imagem publicada e também reservada ocupa somente uma unidade',()=>{
 assert.deepEqual(imageInventory(catalog,{posts:[{driveFileId:'a',status:'published'},{driveFileId:'a',status:'draft'}]}),{total:4,used:1,reserved:0,remaining:3});
});
test('catálogo vazio retorna zero; arquivos duplicados não aumentam o total',()=>{
 assert.deepEqual(imageInventory({files:[]},{}),{total:0,used:0,reserved:0,remaining:0});
 assert.equal(imageInventory({files:[...catalog.files,catalog.files[0],{id:'invalid'}]},{}).total,4);
});
