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
if (!import.meta.env?.VITEST) {
  initScrollTop();
  initNav(document);
}
