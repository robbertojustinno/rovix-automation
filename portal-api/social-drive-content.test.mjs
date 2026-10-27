import test from 'node:test';
import assert from 'node:assert/strict';
import {DRIVE_IMAGE_POLICY,isApprovedDriveCatalog,chooseDriveFile} from './social-drive-content.mjs';
import {imageInventory} from './social-image-inventory.mjs';
const catalog={ownerId:DRIVE_IMAGE_POLICY.ownerId,folderId:'resolved-images-folder',path:DRIVE_IMAGE_POLICY.path,recursive:true,files:[{id:'new-image',name:'ROVIX_001_robo.png',mime_type:'image/png',object_key:DRIVE_IMAGE_POLICY.ownerId+'/child/image.png'}]};
test('catálogo recursivo com ID resolvido abastece contador e seleção de imagem',()=>{
 assert.equal(isApprovedDriveCatalog(catalog),true);
 assert.deepEqual(imageInventory(catalog,{posts:[]}),{total:1,used:0,reserved:0,remaining:1});
 assert.equal(chooseDriveFile(catalog.files,[]).file.id,'new-image');
});
test('não autoriza catálogo antigo, outra empresa ou pasta sem identificação',()=>{
 for(const patch of [{path:'Meu Drive → ROVIX Social Agent → Imagens'},{ownerId:'another-owner'},{folderId:null},{recursive:false},{files:null}])assert.equal(isApprovedDriveCatalog({...catalog,...patch}),false);
 assert.equal(isApprovedDriveCatalog(null),false);
});
