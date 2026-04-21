/* ============================================================
   INFLOW MEDIA — SHARED JAVASCRIPT
   Runs on every page. Don't touch unless you know JS.
   ============================================================ */

/* ---- CURSOR ---- */
const cur = document.getElementById('cur');
const curR = document.getElementById('curR');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.left=mx+'px';cur.style.top=my+'px'});
(function t(){rx+=(mx-rx)*.12;ry+=(my-ry)*.12;curR.style.left=rx+'px';curR.style.top=ry+'px';requestAnimationFrame(t)})();
document.querySelectorAll('a,button,.wc,.sc-card,.pr,.svc-row').forEach(el=>{
  el.addEventListener('mouseenter',()=>{cur.style.width='18px';cur.style.height='18px';curR.style.width='56px';curR.style.height='56px';curR.style.borderColor='rgba(255,107,43,.7)'});
  el.addEventListener('mouseleave',()=>{cur.style.width='10px';cur.style.height='10px';curR.style.width='38px';curR.style.height='38px';curR.style.borderColor='rgba(255,107,43,.45)'});
});

/* ---- NAV SCROLL ---- */
window.addEventListener('scroll',()=>document.getElementById('nav').classList.toggle('sc',scrollY>60));

/* ---- SCROLL REVEAL ---- */
const ro=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add('in')}),{threshold:.1});
document.querySelectorAll('.rv').forEach(el=>ro.observe(el));

/* ---- COUNTER ANIMATION ---- */
const co=new IntersectionObserver(e=>e.forEach(x=>{
  if(x.isIntersecting){
    const el=x.target,t=parseInt(el.dataset.t);
    let n=0;const s=t/55;
    const id=setInterval(()=>{n+=s;if(n>=t){el.textContent=t;clearInterval(id)}else el.textContent=Math.floor(n)},18);
    co.unobserve(el);
  }
}),{threshold:.5});
document.querySelectorAll('.cnt').forEach(c=>co.observe(c));

/* ---- 3D TILT on work cards ---- */
document.querySelectorAll('.wc').forEach(c=>{
  c.addEventListener('mouseenter',()=>{c.style.transition='transform .1s'});
  c.addEventListener('mousemove',e=>{
    const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.style.transform=`perspective(900px) rotateY(${x*9}deg) rotateX(${-y*5}deg) scale(1.025)`;
  });
  c.addEventListener('mouseleave',()=>{c.style.transition='transform .55s cubic-bezier(.25,.46,.45,.94)';c.style.transform=''});
});

/* ---- VIDEO PLAY (YouTube embed on click) ---- */
document.querySelectorAll('.wc-play').forEach(btn=>{
  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const card=btn.closest('.wc');
    const vid=card.dataset.vid;
    const idx=card.dataset.idx;
    const wrap=document.getElementById('if'+idx);
    if(!wrap||wrap.classList.contains('on'))return;
    wrap.innerHTML=`<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    wrap.classList.add('on');
    const th=card.querySelector('.wc-th');
    if(th)th.style.opacity='0';
    btn.classList.add('gone');
  });
});

/* ---- CTA CANVAS (orbiting rings) ---- */
const ctaCv=document.getElementById('ctaCv');
if(ctaCv){
  const cx=ctaCv.getContext('2d');
  let W,H,t=0;
  const rs=()=>{W=ctaCv.width=ctaCv.offsetWidth;H=ctaCv.height=ctaCv.offsetHeight};
  rs();window.addEventListener('resize',rs);
  (function lp(){cx.clearRect(0,0,W,H);t+=.004;const ox=W/2,oy=H/2;
    [[200,.9],[310,1.3],[430,.6],[560,1.0]].forEach(([r,sp],i)=>{
      cx.globalAlpha=.055;cx.strokeStyle='#ff6b2b';cx.lineWidth=.8;cx.setLineDash([3,14]);
      cx.beginPath();cx.arc(ox,oy,r,0,Math.PI*2);cx.stroke();
      const a=t*sp+i*1.5;cx.globalAlpha=.55;cx.fillStyle='#ff6b2b';cx.setLineDash([]);
      cx.beginPath();cx.arc(ox+Math.cos(a)*r,oy+Math.sin(a)*r,2.5,0,Math.PI*2);cx.fill();
    });
  requestAnimationFrame(lp)})();
}
