// Recarregar devolve sempre o topo, em vez de repor a posição anterior.
// Uma âncora escrita no link (#faq) continua a valer na primeira visita.
history.scrollRestoration = 'manual';
if (performance.getEntriesByType('navigation')[0]?.type === 'reload' && location.hash) {
  history.replaceState(null, '', location.pathname);
}
if (!location.hash) scrollTo(0, 0);

// Barra flutuante: sólida a partir do momento em que se sai do topo.
const barra = document.getElementById('site-header');
const menu = document.getElementById('main-nav');
const botao = document.querySelector('.nav-toggle');

const aoScroll = () => barra.classList.toggle('is-scrolled', scrollY > 24);
addEventListener('scroll', aoScroll, { passive: true });
aoScroll();

// Menu em ecrãs estreitos. aria-expanded é a fonte de verdade: o CSS do
// hamburger e os leitores de ecrã leem-no, por isso não há segundo estado.
const fechar = () => {
  botao.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
  barra.classList.remove('is-open');
};
botao.addEventListener('click', () => {
  const aberto = botao.getAttribute('aria-expanded') === 'true';
  if (aberto) return fechar();
  botao.setAttribute('aria-expanded', 'true');
  menu.classList.add('is-open');
  barra.classList.add('is-open');
});
menu.addEventListener('click', (ev) => { if (ev.target.closest('a')) fechar(); });
addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fechar(); });

// Secção visível realçada no menu.
const seccoes = [...menu.querySelectorAll('a[href^="#"]')]
  .map((a) => [a, document.querySelector(a.getAttribute('href'))])
  .filter(([, alvo]) => alvo);
const io = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (!e.isIntersecting) continue;
    for (const [a, alvo] of seccoes) a.classList.toggle('is-active', alvo === e.target);
  }
}, { rootMargin: '-45% 0px -50% 0px' });
seccoes.forEach(([, alvo]) => io.observe(alvo));
