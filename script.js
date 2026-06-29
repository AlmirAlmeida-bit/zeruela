// Sempre carregar no topo (header), ignorando a restauração de scroll do navegador.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('beforeunload', ()=> window.scrollTo(0, 0));
window.addEventListener('load', ()=>{ window.scrollTo(0, 0); if (window.__lenis) window.__lenis.scrollTo(0, { immediate:true }); });

(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // acessibilidade: sem JS de motion

  gsap.registerPlugin(ScrollTrigger);

  // ---- Lenis: scroll suave conectado ao ScrollTrigger ----
  const lenis = new Lenis({ lerp:0.1, smoothWheel:true });
  window.__lenis = lenis; // usado pelo menu mobile para travar/destravar o scroll
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t)=> lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);

  // ---- Links do header deslizam suave até a seção (offset = altura do nav) ----
  document.querySelectorAll('.nav a[href^="#"], .nav__brand[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const target = a.getAttribute('href');
      if (target.length > 1){ e.preventDefault(); lenis.start(); lenis.scrollTo(target, { offset:-68, duration:1.2 }); }
    });
  });

  // ---- Parallax por camadas (data-speed) ----
  // speed<1 = mais devagar que o scroll (fundo). Hero usa scrub.
  gsap.utils.toArray('.hero .layer, .hero__content, .hero__mascote').forEach(el=>{
    const speed = parseFloat(el.dataset.speed || 1);
    gsap.to(el, {
      yPercent: (1 - speed) * 60,   // fundo sobe menos, frente mais
      ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true }
    });
  });
  // engrenagem decorativa da seção sobre
  gsap.utils.toArray('[data-speed]').forEach(el=>{
    if (el.closest('.hero')) return;
    const speed = parseFloat(el.dataset.speed);
    gsap.to(el, { yPercent:(1-speed)*40, ease:'none',
      scrollTrigger:{ trigger:el.closest('section')||el, start:'top bottom', end:'bottom top', scrub:true }});
  });

  // ---- Abertura sincronizada: logo entra com IMPACTO + texto em cascata ----
  const heroTl = gsap.timeline({ defaults:{ ease:'power3.out' } });
  heroTl
    .from('#mascote-hero', { scale:.2, opacity:0, rotation:-14, duration:1.2, ease:'back.out(1.7)' })
    .from('.hero__text h1', { y:50, opacity:0, duration:.8 }, '-=0.7')
    .from('.hero__sub',     { y:30, opacity:0, duration:.7 }, '-=0.5');

  // ---- Título vazado preenchendo de amarelo conforme o scroll ----
  const fill1 = document.getElementById('fill1');
  ScrollTrigger.create({
    trigger:'.hero', start:'top top', end:'bottom top', scrub:true,
    onUpdate:(self)=> fill1.style.setProperty('--fill', (self.progress*100).toFixed(1)+'%')
  });

  // ---- Reveal cascata (stagger) — via classe .in (sem opacity inline que possa travar) ----
  gsap.utils.toArray('.reveal, .reveal-left').forEach(el=>{
    const staggered = el.hasAttribute('data-stagger');
    const delay = staggered
      ? [...el.parentNode.children].filter(c=>c.hasAttribute('data-stagger')).indexOf(el) * 0.12
      : 0;
    ScrollTrigger.create({
      trigger: staggered ? el.parentNode : el,
      start:'top 82%', once:true,
      onEnter:()=> gsap.delayedCall(delay, ()=> el.classList.add('in'))
    });
  });
  // engrenagem de fundo dos diferenciais girando conforme o scroll
  gsap.to('#dif-gear svg', {
    rotation:200, ease:'none',
    scrollTrigger:{ trigger:'#diferenciais', start:'top bottom', end:'bottom top', scrub:true }
  });

  // parallax nas imagens dos cards (a foto desliza dentro da moldura ao rolar)
  gsap.utils.toArray('.card__img').forEach(img=>{
    gsap.fromTo(img, { yPercent:-4 }, {
      yPercent:4, ease:'none',
      scrollTrigger:{ trigger:img.closest('.card'), start:'top bottom', end:'bottom top', scrub:true }
    });
  });
  // mascote do fechamento gesticulando
  gsap.from('#mascote-fechar', {
    x:-60, rotation:-8, opacity:0, duration:.9, ease:'back.out(1.5)',
    scrollTrigger:{ trigger:'#comprar', start:'top 70%', once:true }
  });
})();

// Fallback de reveal SEM GSAP (ou reduced-motion off mas script falhou):
// IntersectionObserver garante que o conteúdo apareça mesmo sem animação.
(function(){
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal,.reveal-left').forEach(e=>e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  }, { threshold:0.15 });
  document.querySelectorAll('.reveal,.reveal-left').forEach(e=>io.observe(e));
})();

// Menu hambúrguer (mobile): abre/fecha o overlay fosco.
(function(){
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  if (!nav || !burger) return;
  const setOpen = (open)=>{
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open); // trava o scroll nativo (toque) também
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
  };
  burger.addEventListener('click', ()=> setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('.nav__links a').forEach(a=> a.addEventListener('click', ()=> setOpen(false)));
})();

// Formulário "Fale Conosco" -> abre o WhatsApp com a mensagem montada (sem backend).
// ponytail: zero-config; troque por um endpoint (Formspree/back-end) se quiser receber por e-mail.
(function(){
  const form = document.getElementById('form-contato');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const d = new FormData(form);
    const linhas = [
      `Olá, Zé Ruela! Sou ${d.get('nome')} (${d.get('email')}).`,
      d.get('assunto') ? `Procuro: ${d.get('assunto')}` : '',
      d.get('mensagem')
    ].filter(Boolean);
    window.open('https://wa.me/5521971444414?text=' + encodeURIComponent(linhas.join('\n')), '_blank');
  });
})();
