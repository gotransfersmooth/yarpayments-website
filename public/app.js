const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if(e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
const partners = {
 banks: ['Banking within reach.', 'Reach UAE’s people and businesses. We support onboarding and everyday service.'],
 exchange: ['Bring home closer.', 'Connect with customers who send money home, month after month.'],
 insurance: ['Protection for everyday life.', 'Bring affordable life and micro-insurance to underserved communities.'],
 bills: ['Everyday payments. Simplified.', 'Local bills, international payments and mobile top-ups. One app.'],
 employers: ['Back your people.', 'Bring everyday financial access to your workforce and wider network.']
};
const tabs = [...document.querySelectorAll('[data-partner]')];
function selectPartner(tab) { tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; }); const data = partners[tab.dataset.partner]; ['partner-title','partner-description'].forEach((id,i) => document.getElementById(id).textContent = data[i]); document.querySelector('#partner-panel').setAttribute('aria-labelledby',tab.id); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelector('#partner-panel').animate([{opacity:.3,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'ease-out'}); }
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

// Repeating entrances: re-arm only after the element has left the viewport.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const entranceTargets = document.querySelectorAll('.hero-copy, .hero-visual, .mission-grid, .section-heading, .service, .merchant-art, .business-copy, .partner-layout, .about-intro, .journey article, .regulatory, .contact-grid, .faq-grid');
if ('IntersectionObserver' in window && Element.prototype.animate) {
  const played = new WeakSet();
  const active = new WeakMap();
  function enter(target) {
    if (motionPreference.matches || played.has(target)) return;
    played.add(target);
    target.dataset.entrances = String(Number(target.dataset.entrances || 0) + 1);
    active.get(target)?.cancel();
    const card = target.matches('.service, .journey article');
    const art = target.matches('.merchant-art, .hero-visual');
    const index = card ? [...target.parentElement.children].indexOf(target) : 0;
    const mobile = window.innerWidth <= 600;
    const distance = mobile ? 46 : 76;
    const first = card
      ? {opacity:0, transform:`translateY(${distance}px) scale(.92) rotate(${index % 2 ? 2 : -2}deg)`}
      : art
        ? {opacity:0, transform:`translateY(${distance}px) scale(.9)`}
        : {opacity:0, transform:`translateY(${distance}px)`, clipPath:'inset(0 0 35% 0)'};
    const baseTransform = getComputedStyle(target).transform;
    if (baseTransform !== 'none') first.transform = baseTransform + ' ' + first.transform;
    const animation = target.animate([first, {opacity:1,transform:baseTransform === 'none' ? 'translateY(0) scale(1) rotate(0deg)' : baseTransform,clipPath:'inset(0 0 0 0)'}], {
      duration: card ? 1050 : 1200,
      delay: card ? (index % 3) * 150 : 0,
      easing:'cubic-bezier(.22,.7,.25,1)',
      fill:'backwards'
    });
    active.set(target,animation);
  }
  const entrances = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => { if(isIntersecting) enter(target); });
  }, {threshold:0, rootMargin:'0px 0px -12% 0px'});
  const resets = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => { if(!isIntersecting) played.delete(target); });
  }, {threshold:0, rootMargin:'100px 0px 100px 0px'});
  entranceTargets.forEach(target => {entrances.observe(target);resets.observe(target);});
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) entranceTargets.forEach(target => active.get(target)?.cancel());
  });
}
// A quiet reading-progress line follows the visitor without changing scroll behaviour.
const progress = document.createElement('div');
progress.className = 'reading-progress';
progress.setAttribute('aria-hidden','true');
document.querySelector('.header').append(progress);
let scrollFrame;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1,Math.max(0,window.scrollY / distance)) : 0})`;
  scrollFrame = undefined;
}
window.addEventListener('scroll', () => { if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(updateProgress); }, {passive:true});
window.addEventListener('resize', updateProgress);
updateProgress();
