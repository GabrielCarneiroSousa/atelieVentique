(() => {
  'use strict';

  const WHATSAPP_NUMBER = '5511963587995';
  const COOLDOWN_MS = 30000;          // intervalo mínimo entre envios do formulário
  const COOLDOWN_KEY = 'ventique:ultimo-envio';

  // ---------- Fita métrica: 0 a 150 cm conforme a rolagem ----------
  const fita = document.getElementById('fita');
  const agulha = document.getElementById('fita-agulha');
  const valor = document.getElementById('fita-valor');

  function atualizarFita() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    const x = p * (fita.clientWidth - 3);
    agulha.style.setProperty('--x', x + 'px');
    agulha.classList.toggle('fita__agulha--fim', p > 0.82);
    valor.textContent = Math.round(p * 150) + ' cm';
  }
  window.addEventListener('scroll', atualizarFita, { passive: true });
  window.addEventListener('resize', atualizarFita);
  atualizarFita();

  // ---------- Menu no celular ----------
  const botaoMenu = document.getElementById('menu-botao');
  const menu = document.getElementById('menu');

  function fecharMenu() {
    menu.classList.remove('menu--aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.textContent = 'Menu';
  }
  botaoMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('menu--aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.textContent = aberto ? 'Fechar' : 'Menu';
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) fecharMenu(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('menu--aberto')) { fecharMenu(); botaoMenu.focus(); }
  });

  // ---------- Formulário: validação, proteção e envio para o WhatsApp ----------
  const form = document.getElementById('formulario');
  const campos = {
    nome: document.getElementById('nome'),
    telefone: document.getElementById('telefone'),
    mensagem: document.getElementById('mensagem')
  };
  const status = document.getElementById('formulario-status');

  // Remove caracteres de controle e espaços repetidos
  const limpar = (texto) => texto.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();

  // Máscara (11) 99999-9999
  campos.telefone.addEventListener('input', () => {
    const d = campos.telefone.value.replace(/\D/g, '').slice(0, 11);
    let t = d;
    if (d.length > 2) t = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) t = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    campos.telefone.value = t;
  });

  function mostrarErro(campo, texto) {
    const area = campo.closest('.campo');
    const alvo = document.getElementById('erro-' + campo.id);
    alvo.textContent = texto;
    area.classList.toggle('campo--invalido', Boolean(texto));
    campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  }

  function validar() {
    const nome = limpar(campos.nome.value);
    const tel = campos.telefone.value.replace(/\D/g, '');
    const msg = limpar(campos.mensagem.value);
    const erros = {};

    if (nome.length < 2) erros.nome = 'Digite seu nome.';
    else if (nome.length > 80) erros.nome = 'Use até 80 caracteres.';

    if (!/^[1-9]{2}9?\d{8}$/.test(tel)) erros.telefone = 'Digite um WhatsApp com DDD, por exemplo (11) 99999-9999.';

    if (msg.length < 5) erros.mensagem = 'Conte em poucas palavras o que você precisa.';
    else if (msg.length > 600) erros.mensagem = 'Use até 600 caracteres.';

    Object.keys(campos).forEach((k) => mostrarErro(campos[k], erros[k] || ''));
    const primeiro = Object.keys(erros)[0];
    if (primeiro) campos[primeiro].focus();
    return primeiro ? null : { nome, tel, msg };
  }

  function segundosRestantes() {
    try {
      const ultimo = Number(localStorage.getItem(COOLDOWN_KEY)) || 0;
      return Math.ceil(Math.max(0, COOLDOWN_MS - (Date.now() - ultimo)) / 1000);
    } catch (_) { return 0; }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = '';

    // Campo-armadilha preenchido: é um robô. Finge sucesso e não faz nada.
    if (form.elements.site.value !== '') { status.textContent = 'Pronto.'; return; }

    const espera = segundosRestantes();
    if (espera > 0) { status.textContent = 'Aguarde ' + espera + ' segundos para enviar de novo.'; return; }

    const dados = validar();
    if (!dados) return;

    const texto = 'Olá! Meu nome é ' + dados.nome + '.\n' +
                  'Meu WhatsApp: ' + campos.telefone.value + '\n\n' +
                  'Gostaria de um orçamento: ' + dados.msg;
    const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(texto);

    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch (_) { /* sem armazenamento: segue normalmente */ }

    const janela = window.open(url, '_blank', 'noopener,noreferrer');
    status.textContent = janela ? 'WhatsApp aberto em outra aba.' : 'Seu navegador bloqueou a janela. Permita pop-ups para este site e envie de novo.';
    if (janela) form.reset();
  });
})();
