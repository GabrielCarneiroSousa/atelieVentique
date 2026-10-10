/* Movimento da Ventique (Motion hospedado em assets/). Nada aqui roda com "reduzir movimento".
   Se o Motion não carregar (ex.: navegador interno), os efeitos de rolagem são só pulados e o conteúdo continua visível. */
(function () {
  'use strict';
  var M = window.Motion;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var EASE = [0.23, 1, 0.32, 1];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Revelar ao rolar (sem depender do Motion) ---- */
  function revelar() {
    var grupos = [
      '.trabalho, .trabalhos__chamada',
      '.servicos__lista .servico',
      '.etapa',
      '.sobre__foto',
      '.sobre__texto p',
      '.medida',
      '.dados > div',
      '.formulario',
      '.aviso__interno > *'
    ];
    var itens = [];
    grupos.forEach(function (sel) {
      $$(sel).forEach(function (el, i) { el.classList.add('revela'); el.style.setProperty('--i', String(Math.min(i, 5))); itens.push(el); });
    });
    if (!('IntersectionObserver' in window)) { itens.forEach(function (e) { e.classList.add('revela--on'); }); return; }
    var io = new IntersectionObserver(function (lista) {
      lista.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('revela--on'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    itens.forEach(function (e) { io.observe(e); });
    setTimeout(function () { itens.forEach(function (e) { e.classList.add('revela--on'); }); }, 6000); /* rede de segurança */
  }

  /* ---- Cabeçalho e menu atual ---- */
  function topoEMenu() {
    var topo = $('.topo');
    var links = $$('.menu__lista a');
    var alvos = links.map(function (a) { return $(a.getAttribute('href')); });
    var tick = false;
    function atualizar() {
      tick = false;
      if (topo) topo.classList.toggle('topo--rolou', window.scrollY > 8);
      var ref = window.innerHeight * 0.35, atual = -1;
      alvos.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= ref) atual = i; });
      links.forEach(function (a, i) { if (i === atual) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(atualizar); } }, { passive: true });
    atualizar();
  }

  /* ---- Divide um título em palavras (cada uma sobe de dentro de uma máscara) ---- */
  function dividir(h) {
    var palavras = h.textContent.trim().split(/\s+/); h.textContent = '';
    return palavras.map(function (p, i) {
      var o = document.createElement('span'); o.className = 'pal';
      var s = document.createElement('span'); s.textContent = p; s.style.transform = 'translateY(112%)'; o.appendChild(s);
      h.appendChild(o); if (i < palavras.length - 1) h.appendChild(document.createTextNode(' '));
      return s;
    });
  }

  function titulos() {
    var h1 = $('.papel__titulo');
    if (h1) { var s1 = dividir(h1); M.animate(s1, { transform: ['translateY(112%)', 'translateY(0%)'] }, { duration: 0.85, delay: M.stagger(0.08, { startDelay: 0.15 }), ease: EASE }); }
    $$('.secao__titulo').forEach(function (h) {
      var spans = dividir(h);
      M.inView(h, function () {
        M.animate(spans, { transform: ['translateY(112%)', 'translateY(0%)'] }, { duration: 0.75, delay: M.stagger(0.07), ease: EASE });
      }, { margin: '0px 0px -12% 0px' });
    });
  }

  /* ---- Primeira dobra: a foto desliza mais devagar que a página ---- */
  function heroRolagem() {
    var hero = $('.inicio'); if (!hero) return;
    var img = $('.inicio__foto img'), papel = $('.papel');
    var op = { target: hero, offset: ['start start', 'end start'] };
    if (img) M.scroll(M.animate(img, { transform: ['translateY(0%)', 'translateY(9%)'] }, { ease: 'linear' }), op);
    if (papel) M.scroll(M.animate(papel, { transform: ['translateY(0px)', 'translateY(34px)'] }, { ease: 'linear' }), op);
  }

  /* ---- Brilho que segue o ponteiro nas fotos ---- */
  function brilho() {
    document.addEventListener('pointermove', function (e) {
      var m = e.target.closest && e.target.closest('.moldura'); if (!m) return;
      var r = m.getBoundingClientRect();
      m.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      m.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ---- Botões "puxam" um pouco em direção ao ponteiro, com mola ---- */
  function magnetico() {
    $$('.papel .botao, .trabalhos__chamada .botao, .aviso .botao, .medidas__intro .botao').forEach(function (b) {
      var quadro = 0, alvo = '0px 0px';
      function ir() { quadro = 0; M.animate(b, { translate: alvo }, { type: 'spring', stiffness: 320, damping: 22 }); }
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 12, y = ((e.clientY - r.top) / r.height - 0.5) * 10;
        alvo = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px'; if (!quadro) quadro = requestAnimationFrame(ir);
      });
      b.addEventListener('pointerleave', function () { alvo = '0px 0px'; if (!quadro) quadro = requestAnimationFrame(ir); });
    });
  }

  function iniciar() {
    if (reduz) return;
    revelar(); topoEMenu();
    if (!M) return;
    titulos(); heroRolagem();
    if (fino) { brilho(); magnetico(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
