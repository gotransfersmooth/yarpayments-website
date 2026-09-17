import { createContactHandler } from './contact.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('./public/', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml' };
const handleContact = createContactHandler();
const server = createServer(async (req, res) => {
  const headers = { 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin', 'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'" };
  if (req.url?.split('?')[0] === '/api/contact') return handleContact(req,res,headers);
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, { ...headers, Allow:'GET, HEAD' }); return res.end(); }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/health') { res.writeHead(200, {...headers, 'Content-Type':'text/plain'}); return res.end(req.method === 'HEAD' ? undefined : 'ok'); }
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403, headers); return res.end('Forbidden'); }
    const content = await readFile(file);
    res.writeHead(200, {...headers, 'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control': extname(file) === '.jpeg' ? 'public, max-age=86400' : 'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404, {...headers, 'Content-Type':'text/plain'}); res.end('Page not found'); }
});
server.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log(`Yara Pay website listening on ${process.env.PORT || 4173}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
