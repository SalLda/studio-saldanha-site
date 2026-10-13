/* Studio Saldanha — comportamento da página */
(() => {
  'use strict';

  /* ===== Configuração =====
     WHATSAPP: número que recebe os pedidos (DDI + DDD + número, só dígitos).
     FORM_ENDPOINT: Google Apps Script que grava cada pedido na planilha de leads
     (aba "Leads do site"), mesmo que a pessoa não envie a mensagem no WhatsApp, mesmo que a pessoa não envie a mensagem no WhatsApp. */
  const WHATSAPP = '5553991662471';
  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxz0w309r9CgBcf29xokl2zxi_-n6OgVLRoQLsQO1O5FITaPDCd5GKFbWNvoIpfQ3QL6Q/exec';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /* ===== Vídeo do case: respeita "reduzir movimento" ===== */
  const caseVideo = $('.case-video video');
  if (caseVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    caseVideo.removeAttribute('autoplay');
    caseVideo.pause();
    caseVideo.controls = true;
  }

  /* ===== Links diretos de WhatsApp: usam o número configurado acima ===== */
  $$('[data-whats]').forEach((a) => {
    a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Olá, Matheus! Vim pelo site do Studio Saldanha e quero saber mais sobre o diagnóstico gratuito.')}`;
  });

  /* ===== Botões "Diagnóstico gratuito": rolam até o formulário e focam o primeiro campo ===== */
  const nameInput = $('#nome');
  $$('[data-cta]').forEach((cta) => {
    cta.addEventListener('click', () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => nameInput.focus({ preventScroll: true }), reduce ? 0 : 700);
    });
  });

  /* ===== Barra fixa do celular: aparece depois do botão do topo, some junto do formulário ===== */
  const sticky = $('#stickyCta');
  const formSection = $('#orcamento');
  const visibleCtas = new Set();
  let formVisible = false;
  const syncSticky = () => sticky.classList.toggle('is-visible', visibleCtas.size === 0 && !formVisible);

  if ('IntersectionObserver' in window) {
    const ctaObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visibleCtas.add(e.target) : visibleCtas.delete(e.target)));
      syncSticky();
    });
    $$('main [data-cta]').forEach((cta) => ctaObserver.observe(cta));
    new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; syncSticky(); }, { threshold: 0.15 })
      .observe(formSection);
  }

  /* ===== Cases em abas ===== */
  const tabs = $$('.tab');
  const selectTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      selectTab(tabs[next], true);
    });
  });

  /* ===== Vídeos do Instagram: só carregam quando a pessoa clica ===== */
  const reelBox = $('#reelBox');
  const reelFrame = $('#reelFrame');
  const reelLink = $('#reelLink');
  let reelTrigger = null;
  $$('[data-reel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.reel;
      reelTrigger = btn;
      reelFrame.title = btn.dataset.title || 'Vídeo do Instagram';
      reelFrame.src = `https://www.instagram.com/reel/${id}/embed/`;
      reelLink.href = `https://www.instagram.com/${btn.dataset.user}/reel/${id}/`;
      if (typeof reelBox.showModal === 'function') reelBox.showModal();
      else window.open(reelLink.href, '_blank', 'noopener');
    });
  });
  $('#reelClose').addEventListener('click', () => reelBox.close());
  reelBox.addEventListener('click', (e) => { if (e.target === reelBox) reelBox.close(); });
  reelBox.addEventListener('close', () => {
    reelFrame.removeAttribute('src');
    if (reelTrigger) reelTrigger.focus({ preventScroll: true });
  });

  /* ===== Imagens do case: ampliar ===== */
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCaption = $('#lbCaption');
  let lastTrigger = null;

  $$('[data-zoom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = $('img', btn);
      lastTrigger = btn;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = $('figcaption', btn.closest('figure')).textContent;
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
    });
  });
  const closeLightbox = () => {
    if (lightbox.open) lightbox.close();
  };
  $('#lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('close', () => {
    lbImg.removeAttribute('src');
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  });

  /* ===== Entrada dos elementos ao rolar =====
     Só roda quando <html> tem a classe "rv" (definida no <head> se o navegador suporta
     IntersectionObserver e a pessoa não pediu menos movimento). */
  if (document.documentElement.classList.contains('rv')) {
    const items = $$([
      '.section .eyebrow', '.section h2', '.section-lead', '.prose p', '.mirror', '.fear', '.bridge',
      '.pillar', '.cta-row', '.trio > div', '.offer', '.dt-bands', '.dt-steps > li', '.dt-loop',
      '.dt-loop-note', '.fly-art', '.flycard', '.steps > li', '.tabs', '.case-video', '.tile',
      '.faq details', '.contact-lead', '.contact-actions', '.form-box',
      '.results-title', '.results-lead', '.res-group', '.res-card', '.res-note', '.cases-title', '.about-photo', '.about-facts',
    ].join(','));
    items.forEach((el) => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      // quem entra junto aparece em cascata, de cima para baixo
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e, i) => {
          e.target.style.setProperty('--d', `${Math.min(i, 5) * 90}ms`);
          e.target.classList.add('in', 'is-seen');
          io.unobserve(e.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));

    // depois de aparecer, o elemento volta ao estilo normal (hover, foco etc.)
    document.addEventListener('animationend', (e) => {
      if (e.animationName === 'reveal') e.target.classList.remove('reveal', 'in');
    });
  }

  /* ===== Formulário ===== */
  const form = $('#leadForm');
  const success = $('#success');
  const successLink = $('#successLink');
  const whatsInput = $('#whats');
  const areaInput = $('#area');
  const needInput = $('#necessidade');

  const maskPhone = (value) => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    const cut = d.length > 10 ? 7 : 6;
    const first = d.slice(2, cut);
    const last = d.slice(cut);
    return `(${d.slice(0, 2)}) ${first}${last ? '-' + last : ''}`;
  };
  whatsInput.addEventListener('input', () => { whatsInput.value = maskPhone(whatsInput.value); });

  const setError = (input, message) => {
    const out = $(`#${input.id}-erro`);
    out.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const validate = () => {
    const errors = [];
    const name = nameInput.value.trim();
    const digits = whatsInput.value.replace(/\D/g, '');

    setError(nameInput, name.length < 2 ? 'Informa o teu nome.' : '');
    setError(whatsInput, digits.length < 10 ? 'Informa o teu WhatsApp com DDD.' : '');
    setError(areaInput, areaInput.value ? '' : 'Escolhe a tua área de atuação.');
    setError(needInput, needInput.value ? '' : 'Escolhe o que tu quer resolver primeiro.');

    [nameInput, whatsInput, areaInput, needInput].forEach((el) => {
      if (el.getAttribute('aria-invalid') === 'true') errors.push(el);
    });
    return errors;
  };

  [nameInput, whatsInput, areaInput, needInput].forEach((el) => {
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setError(el, ''); });
    el.addEventListener('change', () => { if (el.getAttribute('aria-invalid') === 'true') setError(el, ''); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if ($('#empresa').value) return; // campo-isca: robôs preenchem, pessoas não

    const errors = validate();
    if (errors.length) {
      errors[0].focus();
      return;
    }

    const data = {
      nome: nameInput.value.trim(),
      whatsapp: whatsInput.value.trim(),
      area: areaInput.value,
      necessidade: needInput.value,
      pagina: location.href,
    };

    const message = [
      'Olá, Matheus! Vim pelo site do Studio Saldanha e quero agendar o diagnóstico gratuito.',
      '',
      `Nome: ${data.nome}`,
      `WhatsApp: ${data.whatsapp}`,
      `Área de atuação: ${data.area}`,
      `O que quero resolver primeiro: ${data.necessidade}`,
    ].join('\n');

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }

    successLink.href = url;
    form.hidden = true;
    success.hidden = false;
    success.focus();

    // Obs.: com 'noopener' o navegador sempre devolve null e a página atual também seguiria para o WhatsApp.
    const opened = window.open(url, '_blank');
    if (opened) {
      try { opened.opener = null; } catch (_) { /* sem problema */ }
    } else {
      window.location.href = url; // navegador bloqueou a nova aba
    }
  });
})();
