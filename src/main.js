/**
 * Devolve o topo ao recarregar, em vez de repor a posição anterior.
 * Uma âncora escrita no link (#faq) continua a valer na primeira visita.
 */
export function initScrollTop() {
  history.scrollRestoration = 'manual';
  const entrada = /** @type {PerformanceNavigationTiming | undefined} */ (
    performance.getEntriesByType('navigation')[0]
  );
  if (entrada?.type === 'reload' && location.hash) {
    history.replaceState(null, '', location.pathname);
  }
  if (!location.hash) scrollTo(0, 0);
}

/**
 * Barra flutuante: sólida fora do topo, com menu em ecrãs estreitos.
 * `aria-expanded` é a única fonte de verdade do estado — o CSS do hamburger e
 * os leitores de ecrã leem-no, por isso não existe um segundo estado a par.
 * @param {Document} doc
 */
export function initNav(doc) {
  const barra = doc.getElementById('site-header');
  const menu = doc.getElementById('main-nav');
  const botao = /** @type {HTMLButtonElement | null} */ (doc.querySelector('.nav-toggle'));
  if (!barra || !menu || !botao) return;

  const aoScroll = () => barra.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', aoScroll, { passive: true });
  aoScroll();

  const fechar = () => {
    botao.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    barra.classList.remove('is-open');
  };
  botao.addEventListener('click', () => {
    if (botao.getAttribute('aria-expanded') === 'true') return fechar();
    botao.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    barra.classList.add('is-open');
  });
  menu.addEventListener('click', (ev) => {
    if (ev.target instanceof Element && ev.target.closest('a')) fechar();
  });
  doc.defaultView?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') fechar();
  });

  realcarSeccaoVisivel(doc, menu);
}

/**
 * Realça no menu a secção visível.
 * @param {Document} doc
 * @param {HTMLElement} menu
 */
function realcarSeccaoVisivel(doc, menu) {
  if (typeof IntersectionObserver === 'undefined') return;
  const pares = [...menu.querySelectorAll('a[href^="#"]')]
    .map((a) => /** @type {const} */ ([a, doc.querySelector(a.getAttribute('href') ?? '')]))
    .filter(([, alvo]) => alvo !== null);
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        for (const [a, alvo] of pares) a.classList.toggle('is-active', alvo === e.target);
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const [, alvo] of pares) if (alvo) io.observe(alvo);
}

// Sob o Vitest o módulo é importado só para testar as funções; arrancar aqui
// correria contra um DOM que o teste ainda não montou.
/**
 * Pré-loader: a barra só chega a 100% quando a página carrega, com um mínimo
 * visível para não piscar em ligações rápidas e um teto para nunca prender
 * ninguém numa ligação má.
 * @param {Document} doc
 * @param {{ minimo?: number, teto?: number }} [opcoes]
 */
export function initPreloader(doc, opcoes = {}) {
  const { minimo = 1200, teto = 6000 } = opcoes;
  const caixa = doc.getElementById('preloader');
  if (!caixa) return;
  const barra = /** @type {HTMLElement | null} */ (caixa.querySelector('.pl-bar span'));
  const pct = caixa.querySelector('.pl-pct');
  const vista = doc.defaultView ?? window;

  const terminar = () => {
    caixa.classList.add('is-done');
    if (!location.hash) vista.scrollTo(0, 0);
  };

  // sem animação declarada, não se faz esperar ninguém
  if (vista.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    vista.addEventListener('load', terminar);
    vista.setTimeout(terminar, teto);
    return;
  }

  const t0 = performance.now();
  let pronto = false;
  const marcar = () => {
    pronto = true;
  };
  vista.addEventListener('load', marcar);
  vista.setTimeout(marcar, teto);

  const passo = () => {
    const decorrido = (performance.now() - t0) / minimo;
    const p = Math.min(decorrido * 100, pronto ? 100 : 92);
    if (barra) barra.style.width = `${p}%`;
    if (pct) pct.textContent = `${Math.round(p)}%`;
    if (pronto && decorrido >= 1) return terminar();
    vista.requestAnimationFrame(passo);
  };
  passo();
}

/**
 * Revela os blocos à medida que entram no ecrã. A classe é posta aqui e não
 * no HTML, para que sem JS nada fique escondido.
 * @param {Document} doc
 */
export function initReveal(doc) {
  const vista = doc.defaultView ?? window;
  if (vista.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof IntersectionObserver === 'undefined') return;

  const alvos = doc.querySelectorAll(
    [
      '.section-title',
      '.section-lead',
      '.micro',
      '.feature',
      '.price-card',
      '.network-card',
      '.network-note',
      '.editorial-grid > *',
      '.step',
      '.faq-list details',
      '.contact-box',
      '.hero-actions',
    ].join(','),
  );
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );

  for (const el of alvos) {
    el.classList.add('reveal');
    // irmãos diretos entram em cascata, até um limite para não arrastar
    const ordem = [...(el.parentElement?.children ?? [])].indexOf(el);
    /** @type {HTMLElement} */ (el).style.transitionDelay = `${Math.min(ordem, 4) * 80}ms`;
    io.observe(el);
  }
}

if (!import.meta.env?.VITEST) {
  initScrollTop();
  initNav(document);
  initPreloader(document);
  initReveal(document);
}
