const topbar=document.getElementById('topbar'),menu=document.getElementById('menu'),nav=document.getElementById('nav'),progress=document.getElementById('progress');
menu?.addEventListener('click',()=>nav.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const sections=[...document.querySelectorAll('main section[id]')],links=[...document.querySelectorAll('#nav a')];
function updateScroll(){const y=window.scrollY;topbar.classList.toggle('scrolled',y>20);const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h>0?y/h*100:0)+'%';let active='home';sections.forEach(s=>{if(y+140>=s.offsetTop)active=s.id});links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+active))}
window.addEventListener('scroll',updateScroll,{passive:true});updateScroll();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=Math.min(i%6*70,350)+'ms';observer.observe(el)});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const target=document.querySelector(a.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}}));
