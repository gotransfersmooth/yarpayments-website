const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if(e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const partners = {
 banks: ['Bring everyday banking within everyone’s reach.', 'Connect with workers and small businesses through a single digital interface, with Yara Pay supporting distribution, onboarding and day-to-day servicing.', 'Aggregated customer demand and a pathway to WPS-led account adoption.', 'Partner-issued accounts, salary access and domestic payment capabilities.'],
 exchange: ['Bring home a little closer.', 'Reach a community with recurring remittance needs through a simpler digital customer journey.', 'Aggregated remittance demand and ongoing customer support.', 'Competitive FX pricing, settlement and API integration.'],
 insurance: ['Make protection part of everyday life.', 'Connect accessible insurance products with communities that have traditionally been underserved.', 'Customer reach, product discovery and distribution through the app.', 'Affordable life and micro-insurance products from regulated insurers.'],
 bills: ['Simplify the payments that keep life moving.', 'Bring local and international bill payments and airtime top-ups into one everyday experience.', 'Recurring customer demand and a single app interface.', 'Local and global biller coverage, payment and top-up integration.'],
 employers: ['Support the people behind your business.', 'Explore a financial wellness offering designed around the everyday needs of your workforce or wider network.', 'An accessible platform concept and a focus on underserved communities.', 'Connections to employers, workforce communities and member networks.']
};
const tabs = [...document.querySelectorAll('[data-partner]')];
function selectPartner(tab) { tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; }); const data = partners[tab.dataset.partner]; ['partner-title','partner-description'].forEach((id,i) => document.getElementById(id).textContent = data[i]); document.querySelector('#partner-panel').setAttribute('aria-labelledby',tab.id); }
tabs.forEach((tab,i) => { tab.addEventListener('click',()=>selectPartner(tab)); tab.addEventListener('keydown', e => { let next; if(e.key==='ArrowDown'||e.key==='ArrowRight') next=(i+1)%tabs.length; if(e.key==='ArrowUp'||e.key==='ArrowLeft') next=(i+tabs.length-1)%tabs.length; if(e.key==='Home') next=0; if(e.key==='End') next=tabs.length-1; if(next!==undefined){ e.preventDefault(); tabs[next].focus(); selectPartner(tabs[next]); } }); });
document.querySelectorAll('[data-interest]').forEach(a => a.addEventListener('click',()=>document.querySelector('#interest').value=a.dataset.interest));
document.querySelector('#contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  const status = document.querySelector('#form-status');
  const data = Object.fromEntries(new FormData(form));
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = '';
  try {
    const response = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(30000) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'We couldn’t send your enquiry. Please try again later.');
    status.textContent = 'Thanks for reaching out. Your enquiry is on its way to our team.';
    form.reset();
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' ? 'We couldn’t confirm delivery. Please wait a few minutes before trying again.' : error.message === 'Failed to fetch' ? 'We couldn’t connect. Please check your connection and try again.' : error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Let’s talk ↗';
  }
});
document.querySelector('#year').textContent=new Date().getFullYear();
