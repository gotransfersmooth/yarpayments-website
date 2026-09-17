import { createZohoMailer } from './mail.mjs';
export function createContactHandler({env = process.env, mailer = createZohoMailer(env)} = {}) {
  let windowStart = Date.now();
  let attempts = 0;
  const interests = new Set(['Partnership','Small business','Yara Pay for me','Something else']);
  return async function contact(req,res,headers) {
    function reply(status,data) { res.writeHead(status,{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
    if (req.method !== 'POST') return reply(405,{ok:false,error:'Please use the contact form.'});
    const localOrigin = `http://localhost:${env.PORT || 4173}`;
    const expectedOrigin = env.SITE_ORIGIN || (env.NODE_ENV === 'production' ? '' : localOrigin);
    if (!expectedOrigin || req.headers.origin !== expectedOrigin || req.headers['sec-fetch-site'] === 'cross-site') return reply(403,{ok:false,error:'Please send your enquiry from our website.'});
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(415,{ok:false,error:'Unsupported request format.'});
    if (Date.now() - windowStart > 600000) { windowStart = Date.now(); attempts = 0; }
    if (++attempts > 30) return reply(429,{ok:false,error:'We’re receiving many enquiries. Please try again in a few minutes.'});
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16000) return reply(413,{ok:false,error:'Your message is too long. Please shorten it.'});
        chunks.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid input');
      if (data.website) return reply(400,{ok:false,error:'We couldn’t process this enquiry.'});
      for (const [field,max] of [['name',100],['email',200],['interest',60],['message',2000]]) {
        if (typeof data[field] !== 'string' || data[field].length > max) throw new Error('Invalid input');
        data[field] = data[field].trim();
      }
      if (!data.name || /[\r\n]/.test(data.name) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !interests.has(data.interest)) throw new Error('Invalid input');
      if (!mailer.configured()) return reply(503,{ok:false,error:'Our enquiry form is temporarily unavailable. Please try again later.'});
      try {
        await mailer.send(data);
        return reply(200,{ok:true});
      } catch {
        // Do not log visitor details, provider responses or credentials.
        console.error('Contact delivery could not be confirmed. Check Zoho configuration and service availability.');
        return reply(502,{ok:false,error:'We couldn’t confirm delivery of your enquiry. Please wait a few minutes before trying again.'});
      }
    } catch { return reply(400,{ok:false,error:'Please check your name, email and message, then try again.'}); }
  };
}
