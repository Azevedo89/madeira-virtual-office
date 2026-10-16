// Vercel Analytics: sem cookies e sem dados pessoais.
import { inject } from '@vercel/analytics';

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
 * Qual a secção activa, dadas as posições do topo de cada uma e a linha de
 * leitura. Separada do DOM para poder ser testada com números.
 * @param {{id: string, topo: number}[]} seccoes ordenadas por topo
 * @param {number} linha
 * @returns {string | null} null quando ainda se está acima da primeira
 */
export function seccaoActiva(seccoes, linha) {
  let activa = null;
  for (const s of seccoes) if (s.topo <= linha) activa = s.id;
  return activa;
}

/**
 * Realça no menu a secção em que o visitante está.
 *
 * Não usa IntersectionObserver: o link "Home" aponta para <main>, que contém
 * todas as outras secções e está quase sempre a intersetar, pelo que roubava
 * o realce permanentemente. A posição do scroll é inequívoca.
 * @param {Document} doc
 * @param {HTMLElement} menu
 */
function realcarSeccaoVisivel(doc, menu) {
  const vista = doc.defaultView ?? window;
  const ligacoes = [...menu.querySelectorAll('a[href^="#"]')]
    .map((a) => ({ a, alvo: doc.querySelector(a.getAttribute('href') ?? '') }))
    .filter((p) => p.alvo !== null);
  const inicio = ligacoes.find((p) => p.alvo?.id === 'top');
  const seccoes = ligacoes.filter((p) => p.alvo?.id !== 'top');
  if (!seccoes.length) return;

  const calcular = () => {
    const barra = doc.getElementById('site-header');
    const linha = vista.scrollY + (barra?.offsetHeight ?? 72) + 48;
    const posicoes = seccoes.map((p) => ({
      id: /** @type {Element} */ (p.alvo).id,
      topo: /** @type {Element} */ (p.alvo).getBoundingClientRect().top + vista.scrollY,
    }));

    let id = seccaoActiva(posicoes, linha);
    // chegado ao fim, a última secção manda, mesmo que não cruze a linha
    const fundo = vista.scrollY + vista.innerHeight >= doc.documentElement.scrollHeight - 4;
    if (fundo) id = posicoes[posicoes.length - 1]?.id ?? id;

    const activa = id ? seccoes.find((p) => p.alvo?.id === id) : inicio;
    for (const p of ligacoes) p.a.classList.toggle('is-active', p === activa);
  };

  let agendado = false;
  const aoScroll = () => {
    if (agendado) return;
    agendado = true;
    vista.requestAnimationFrame(() => {
      agendado = false;
      calcular();
    });
  };
  vista.addEventListener('scroll', aoScroll, { passive: true });
  vista.addEventListener('resize', aoScroll);
  calcular();
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
      '.hero-points li',
      '.feature',
      '.price-card',
      '.network-card',
      '.carousel-ui',
      '.network-note',
      '.editorial-grid > *',
      '.step',
      '.faq-list details',
      '.contact-box',
      '.form',
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

/**
 * Liga os botões e os pontos de um carrossel. O arrastar já funciona sem JS,
 * por scroll-snap; isto é só o extra, e só aparece quando há mais do que um
 * ecrã de conteúdo para percorrer.
 * @param {Document} doc
 */
export function initCarousels(doc) {
  for (const caixa of doc.querySelectorAll('[data-carousel]')) {
    const via = /** @type {HTMLElement | null} */ (caixa.querySelector('.carousel-track'));
    const anterior = /** @type {HTMLButtonElement | null} */ (
      caixa.querySelector('[data-carousel-prev]')
    );
    const seguinte = /** @type {HTMLButtonElement | null} */ (
      caixa.querySelector('[data-carousel-next]')
    );
    const pontos = caixa.querySelector('[data-carousel-dots]');
    if (!via) continue;

    const itens = /** @type {HTMLElement[]} */ ([...via.children]);
    const transborda = () => via.scrollWidth - via.clientWidth > 4;

    /** @param {number} i */
    const irPara = (i) => {
      const alvo = itens[Math.max(0, Math.min(i, itens.length - 1))];
      if (alvo) via.scrollTo({ left: alvo.offsetLeft - via.offsetLeft });
    };
    const atual = () => {
      let melhor = 0;
      let menor = Infinity;
      itens.forEach((el, i) => {
        const d = Math.abs(el.offsetLeft - via.offsetLeft - via.scrollLeft);
        if (d < menor) {
          menor = d;
          melhor = i;
        }
      });
      return melhor;
    };

    if (pontos && !pontos.childElementCount) {
      itens.forEach((_, i) => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to item ${i + 1}`);
        b.addEventListener('click', () => irPara(i));
        pontos.append(b);
      });
    }
    anterior?.addEventListener('click', () => irPara(atual() - 1));
    seguinte?.addEventListener('click', () => irPara(atual() + 1));

    const sincronizar = () => {
      caixa.classList.toggle('is-ativo', transborda());
      const i = atual();
      if (anterior) anterior.disabled = via.scrollLeft <= 2;
      if (seguinte) seguinte.disabled = via.scrollLeft + via.clientWidth >= via.scrollWidth - 2;
      pontos
        ?.querySelectorAll('button')
        .forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
    };
    via.addEventListener('scroll', sincronizar, { passive: true });
    doc.defaultView?.addEventListener('resize', sincronizar);
    sincronizar();
  }
}

/**
 * Envio do formulário sem back-end, via FormSubmit. O envio é assíncrono para
 * o visitante não sair da página; se falhar, mostra o email para ele não
 * ficar sem caminho.
 * @param {Document} doc
 */
export function initForm(doc) {
  const form = /** @type {HTMLFormElement | null} */ (doc.getElementById('contact-form'));
  if (!form) return;
  const aviso = form.querySelector('.form-msg');
  const botao = /** @type {HTMLButtonElement | null} */ (form.querySelector('button'));

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (botao) botao.disabled = true;
    if (aviso) {
      aviso.textContent = 'Sending…';
      aviso.className = 'form-msg';
    }
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      if (aviso) {
        aviso.textContent = 'Thank you. We will reply within one working day.';
        aviso.className = 'form-msg is-ok';
      }
    } catch {
      if (aviso) {
        aviso.innerHTML =
          'Could not send. Please write to ' +
          '<a href="mailto:info@madeiravirtualoffice.com">info@madeiravirtualoffice.com</a>.';
        aviso.className = 'form-msg is-err';
      }
    } finally {
      if (botao) botao.disabled = false;
    }
  });
}

/**
 * Barra de progresso de leitura na barra flutuante.
 * @param {Document} doc
 */
export function initProgresso(doc) {
  const barra = doc.getElementById('read-bar');
  if (!barra) return;
  const vista = doc.defaultView ?? window;
  let agendado = false;
  const pintar = () => {
    agendado = false;
    const total = doc.documentElement.scrollHeight - vista.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, vista.scrollY / total)) : 0;
    barra.style.width = `${(p * 100).toFixed(1)}%`;
  };
  const aoScroll = () => {
    if (agendado) return;
    agendado = true;
    vista.requestAnimationFrame(pintar);
  };
  vista.addEventListener('scroll', aoScroll, { passive: true });
  vista.addEventListener('resize', aoScroll);
  pintar();
}

/**
 * Passo de uma contagem com travagem no fim.
 * Separado para ser testável sem relógio nem DOM.
 * @param {number} fracao 0 a 1
 * @param {number} fim
 * @returns {number}
 */
export function valorContado(fracao, fim) {
  const f = Math.min(1, Math.max(0, fracao));
  return Math.round(fim * (1 - Math.pow(1 - f, 3)));
}

/**
 * Faz o preço contar até ao valor quando entra no ecrã. Uma vez só.
 * @param {Document} doc
 */
export function initContagem(doc) {
  const vista = doc.defaultView ?? window;
  const alvos = doc.querySelectorAll('[data-contar]');
  if (!alvos.length) return;
  if (
    typeof IntersectionObserver === 'undefined' ||
    vista.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return; // fica o valor que já está escrito no HTML
  }

  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = /** @type {HTMLElement} */ (e.target);
        const fim = Number(el.dataset.contar);
        const texto = el.textContent ?? '';
        const prefixo = texto.replace(/[\d\s].*$/, '');
        const t0 = performance.now();
        const passo = () => {
          const f = (performance.now() - t0) / 900;
          el.textContent = prefixo + valorContado(f, fim);
          if (f < 1) vista.requestAnimationFrame(passo);
        };
        passo();
      }
    },
    { threshold: 0.6 },
  );
  for (const el of alvos) io.observe(el);
}

if (!import.meta.env?.VITEST) {
  initScrollTop();
  initNav(document);
  initPreloader(document);
  initReveal(document);
  initCarousels(document);
  initForm(document);
  initProgresso(document);
  initContagem(document);
  // o script do analytics só existe quando servido pela Vercel; em local dava
  // 404 e um erro de consola que o Lighthouse penaliza
  if (!['localhost', '127.0.0.1', ''].includes(location.hostname)) inject();
}
