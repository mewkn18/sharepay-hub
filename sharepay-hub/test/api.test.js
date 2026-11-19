// Kiểm thử API với Redis giả lập
const assert=require('assert');
const store=new Map();
global.fetch=async(u,o)=>{const c=JSON.parse(o.body);let r=null;if(c[0]==='GET')r=store.get(c[1])||null;else if(c[0]==='SET'){store.set(c[1],c[2]);r='OK'}else if(c[0]==='DEL')r=store.delete(c[1])?1:0;return{json:async()=>({result:r})}};
process.env.KV_REST_API_URL='http://x';process.env.KV_REST_API_TOKEN='t';
const h=require('../api/state.js');
function call(method,query,body){return new Promise(ok=>{const res={code:200,setHeader(){},status(c){this.code=c;return this},json(o){ok({code:this.code,body:o})}};h({method,query,body},res)})}
(async()=>{
 let r=await call('GET',{});assert.equal(r.body.db,true);
 r=await call('GET',{phong:'Nhom 1!'});assert.equal(r.body.ver,0);
 r=await call('POST',{phong:'nhom1'},{ver:0,state:{funds:[1]}});assert.equal(r.body.ver,1);
 r=await call('GET',{phong:'nhom1',ver:0});assert.equal(r.body.ver,1);assert.ok(r.body.state);
 r=await call('GET',{phong:'nhom1',ver:1});assert.equal(r.body.state,undefined);
 r=await call('POST',{phong:'nhom1'},{ver:0,state:{funds:[2]}});assert.equal(r.body.conflict,true);
 r=await call('POST',{phong:'nhom1'},{ver:1,state:{funds:[3]}});assert.equal(r.body.ver,2);
 r=await call('POST',{phong:'nhom1'},{ver:2,state:{}});assert.equal(r.code,400);
 r=await call('PUT',{phong:'nhom1'});assert.equal(r.code,405);
 delete process.env.KV_REST_API_URL;r=await call('GET',{phong:'x'});assert.equal(r.code,503);
 console.log('API: tất cả kiểm thử đạt');
})().catch(e=>{console.error(e);process.exit(1)});
