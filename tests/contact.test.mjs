import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createContactHandler} from '../contact.mjs';
import {createZohoMailer} from '../mail.mjs';
const origin='https://www.yarapayments.com';
const valid={name:'Test visitor',email:'visitor@example.com',interest:'Partnership',message:'A test enquiry',website:''};
async function withServer(mailer,run) {
 const handler=createContactHandler({env:{SITE_ORIGIN:origin},mailer});
 const server=createServer((req,res)=>handler(req,res,{}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {await run(async(data=valid,headers={})=>fetch(`http://127.0.0.1:${server.address().port}/api/contact`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:typeof data==='string'?data:JSON.stringify(data)}));}
 finally {await new Promise(r=>server.close(r));}
}
test('valid enquiry reaches mailer once; cross-site, invalid and bot input do not',async()=>{
 const sent=[];
 await withServer({configured:()=>true,send:async d=>sent.push(d)},async post=>{
  assert.equal((await post()).status,200);assert.equal(sent.length,1);
  for(const data of [{...valid,email:'bad'},{...valid,name:''},{...valid,interest:'invalid'},{...valid,website:'spam'},'{'])assert.equal((await post(data)).status,400);
  assert.equal((await post(valid,{Origin:'https://unrelated.example'})).status,403);
  assert.equal((await post(valid,{'Content-Type':'text/plain'})).status,415);
  assert.equal((await post({...valid,message:'a'.repeat(17000)})).status,413);
  assert.equal(sent.length,1);
 });
});
test('unconfigured or rejected delivery never claims success',async()=>{
 await withServer({configured:()=>false},async post=>{const r=await post();assert.equal(r.status,503);assert.equal((await r.json()).ok,false)});
 await withServer({configured:()=>true,send:async()=>{throw Error('failed')}},async post=>{const r=await post();assert.equal(r.status,502);assert.equal((await r.json()).ok,false)});
});
test('submission burst is capped',async()=>{
 await withServer({configured:()=>false},async post=>{for(let i=0;i<30;i++)assert.equal((await post()).status,503);assert.equal((await post()).status,429)});
});
test('Zoho request fixes recipient and subject, uses plaintext and caches refreshed token',async()=>{
 const requests=[];
 const env={ZOHO_CLIENT_ID:'test',ZOHO_CLIENT_SECRET:'test',ZOHO_REFRESH_TOKEN:'test',ZOHO_ACCOUNT_ID:'123',ZOHO_FROM_ADDRESS:'sender@example.com'};
 const request=async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url.includes('/token')?{access_token:'fake',expires_in:3600}:{status:{code:200}}}};
 const mail=createZohoMailer(env,request);assert.equal(mail.configured(),true);
 await mail.send({...valid,toAddress:'attacker@example.com',subject:'Injected'});await mail.send(valid);
 assert.equal(requests.length,3);
 const body=JSON.parse(requests[1].options.body);
 assert.equal(body.toAddress,'samrat@transfersmooth.com');assert.equal(body.subject,'Website enquiries');assert.equal(body.mailFormat,'plaintext');assert.match(body.content,/visitor@example.com/);
 assert.equal(requests[1].options.headers.Authorization,'Zoho-oauthtoken fake');
});
test('Zoho API errors propagate',async()=>{
 const env={ZOHO_CLIENT_ID:'test',ZOHO_CLIENT_SECRET:'test',ZOHO_REFRESH_TOKEN:'test',ZOHO_ACCOUNT_ID:'123',ZOHO_FROM_ADDRESS:'sender@example.com'};
 const mail=createZohoMailer(env,async url=>({ok:true,json:async()=>url.includes('/token')?{access_token:'fake'}:{status:{code:500}}}));
 await assert.rejects(mail.send(valid));
});
