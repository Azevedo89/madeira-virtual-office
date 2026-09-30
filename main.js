// Preloader: barra determinada que só chega a 100% quando a página carrega,
// com um mínimo visível para a animação não piscar em ligações rápidas.
(() => {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  const bar = pre.querySelector('.pl-bar span');
  const pct = pre.querySelector('.pl-pct');
  const MIN = 1900, MAX = 8000, t0 = performance.now();
  let ready = false;

  const finish = () => { ready = true; };
  addEventListener('load', finish);
  setTimeout(finish, MAX); // rede lenta: nunca prender o visitante

  (function tick() {
    const e = (performance.now() - t0) / MIN;
    const p = Math.min(e * 100, ready ? 100 : 92);
    bar.style.width = p + '%';
    pct.textContent = Math.round(p) + '%';
    if (ready && e >= 1) return document.body.classList.add('loaded');
    requestAnimationFrame(tick);
  })();
})();

// Formulário via FormSubmit.co — sem back-end, sem base de dados.
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const msg = form.querySelector('.form-msg');
  const btn = form.querySelector('button');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    btn.disabled = true;
    msg.textContent = 'A enviar…';
    msg.className = 'form-msg';
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!r.ok) throw new Error(r.status);
      form.reset();
      msg.textContent = 'Recebido. Respondemos no mesmo dia útil.';
      msg.className = 'form-msg ok';
    } catch {
      msg.innerHTML = 'Não foi possível enviar. Escreva para <a href="mailto:info@madeiravirtualoffice.com">info@madeiravirtualoffice.com</a>.';
      msg.className = 'form-msg err';
    } finally {
      btn.disabled = false;
    }
  });
})();

// Revelação ao scroll — sem biblioteca, IntersectionObserver nativo.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const alvos = document.querySelectorAll(
    '.section h2, .section .lead, .card, .gallery figure, .steps li, #faq details, .split > *, .form, .section .muted'
  );
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  alvos.forEach((el) => {
    el.classList.add('reveal');
    // escalona os irmãos diretos para entrarem em cascata
    const irmaos = [...el.parentElement.children].indexOf(el);
    el.style.transitionDelay = Math.min(irmaos, 4) * 80 + 'ms';
    io.observe(el);
  });
})();
