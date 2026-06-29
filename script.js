/*
 * ============================================================================
 *  BIBLIOTECAS DE TERCEIROS UTILIZADAS NESTE SITE
 *  Todas servidas localmente (pasta /libs) para não depender de CDN — assim,
 *  se algum CDN sair do ar, o site continua funcionando normalmente.
 * ----------------------------------------------------------------------------
 *  1. GSAP 3.12.5            — libs/gsap.min.js
 *     Motor de animações. Origem: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
 *     Licença: GreenSock Standard "No Charge" License (https://gsap.com/standard-license)
 *
 *  2. ScrollTrigger 3.12.5   — libs/ScrollTrigger.min.js
 *     Plugin do GSAP que dispara animações conforme o scroll.
 *     Origem: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
 *     Licença: GreenSock Standard "No Charge" License
 *
 *  3. Lenis 1.0.42           — libs/lenis.min.js
 *     Scroll suave (smooth scroll). Origem: https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js
 *     Licença: MIT (https://github.com/darkroomengineering/lenis)
 * ============================================================================
 */

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

// Formulário "Fale Conosco" -> posta os campos pro backend (server.js), que dispara o e-mail via SMTP.
// Defina ENDPOINT com a URL do backend (dev: http://localhost:3000/api/contato | prod: https://seu-dominio/api/contato).
(function(){
  const ENDPOINT = ''; // ponytail: vazio = só agradece (nada enviado); preencha com a URL do /api/contato pra disparar
  const form = document.getElementById('form-contato');
  if (!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const dados = {
      nome:     (form.elements.nome.value     || '').trim(),
      email:    (form.elements.email.value    || '').trim(),
      assunto:  (form.elements.assunto.value  || '').trim(),
      mensagem: (form.elements.mensagem.value || '').trim(),
    };
    const btn = form.querySelector('button[type="submit"]');
    const agradece = ()=> {
      form.innerHTML = `<p class="form__ok">Obrigado, ${dados.nome || 'amigo(a)'}! Em breve entraremos em contato.</p>`;
    };

    // Estrutura pronta: enquanto não houver backend configurado, só agradece (nada é enviado).
    if (!ENDPOINT){ agradece(); return; }

    btn.disabled = true; btn.textContent = 'Enviando...';
    try{
      const r = await fetch(ENDPOINT, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Accept:'application/json' },
        body: JSON.stringify(dados),
      });
      if (!r.ok) throw new Error('falha no envio');
      agradece();
    }catch(err){
      btn.disabled = false; btn.textContent = 'Enviar mensagem →';
      alert('Não consegui enviar agora. Tenta de novo ou chama no WhatsApp.');
    }
  });
})();
