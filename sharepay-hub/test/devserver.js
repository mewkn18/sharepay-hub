// Máy chủ thử nghiệm cục bộ: giả lập Vercel (tĩnh + /api/state) và Upstash Redis trong bộ nhớ.
const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const store=new Map();
const redis=http.createServer((q,s)=>{let b='';q.on('data',d=>b+=d);q.on('end',()=>{const c=JSON.parse(b);let r=null;
  if(c[0]==='GET')r=store.has(c[1])?store.get(c[1]):null;else if(c[0]==='SET'){store.set(c[1],c[2]);r='OK'}else if(c[0]==='DEL'){r=store.delete(c[1])?1:0}
  s.setHeader('content-type','application/json');s.end(JSON.stringify({result:r}))})}).listen(8790);
process.env.KV_REST_API_URL='http://127.0.0.1:8790';process.env.KV_REST_API_TOKEN='test';
const handler=require('../api/state.js');
http.createServer((q,s)=>{const u=url.parse(q.url,true);
  if(u.pathname==='/api/state'){let b='';q.on('data',d=>b+=d);q.on('end',async()=>{q.query=u.query;try{q.body=b?JSON.parse(b):undefined}catch(e){q.body=b}
    const res={statusCode:200,setHeader:(k,v)=>s.setHeader(k,v),status(c){this.statusCode=c;return this},json(o){s.statusCode=this.statusCode;s.setHeader('content-type','application/json');s.end(JSON.stringify(o))}};
    await handler(q,res)});return}
  const f=path.join(__dirname,'..','public',u.pathname==='/'?'index.html':u.pathname);
  fs.readFile(f,(e,d)=>{if(e){s.statusCode=404;return s.end('nf')}s.end(d)})}).listen(8788,()=>console.log('dev http://127.0.0.1:8788'));
