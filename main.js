// Recarregar devolve sempre o topo, em vez de repor a posição anterior.
// Uma âncora escrita no link (#faq) continua a valer na primeira visita.
history.scrollRestoration = 'manual';
if (performance.getEntriesByType('navigation')[0]?.type === 'reload' && location.hash) {
  history.replaceState(null, '', location.pathname);
}
if (!location.hash) scrollTo(0, 0);
