import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initForm } from '../src/main.js';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

/** Todos os blocos JSON-LD da página, já analisados. */
function schemas() {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );
}

describe('dados estruturados', () => {
  it('todos os blocos são JSON válido', () => {
    expect(schemas().length).toBeGreaterThanOrEqual(2);
  });

  it('o FAQPage cobre exatamente as perguntas que estão na página', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const naPagina = [...doc.querySelectorAll('.faq-list summary')].map((s) =>
      (s.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    const faq = schemas().find((s) => s['@type'] === 'FAQPage');
    const noSchema = faq.mainEntity.map((/** @type {{name:string}} */ q) => q.name);
    expect(noSchema).toEqual(naPagina);
    expect(naPagina.length).toBeGreaterThan(5);
  });

  it('cada pergunta do FAQPage traz resposta com texto', () => {
    const faq = schemas().find((s) => s['@type'] === 'FAQPage');
    for (const q of faq.mainEntity) {
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(10);
    }
  });

  it('o preço anunciado no schema é o mesmo que está na página', () => {
    const servico = schemas().find((s) => s['@type'] === 'ProfessionalService');
    expect(servico.makesOffer.price).toBe('300');
    expect(html).toMatch(/€300/);
  });
});

describe('formulário', () => {
  /** @type {HTMLFormElement} */
  let form;

  beforeEach(() => {
    document.documentElement.innerHTML = html.replace(/<!doctype html>/i, '');
    initForm(document);
    form = /** @type {HTMLFormElement} */ (document.getElementById('contact-form'));
  });
  afterEach(() => vi.unstubAllGlobals());

  const enviar = () => form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

  it('o honeypot está escondido dos leitores de ecrã', () => {
    const mel = form.querySelector('[name="_honey"]');
    expect(mel?.getAttribute('aria-hidden')).toBe('true');
    expect((mel?.getAttribute('style') ?? '').replace(/\s/g, '')).toContain('display:none');
  });

  it('todos os campos visíveis têm rótulo', () => {
    const soltos = [...form.querySelectorAll('input, select, textarea')].filter(
      (c) =>
        c.getAttribute('type') !== 'hidden' &&
        c.getAttribute('aria-hidden') !== 'true' &&
        !c.closest('label'),
    );
    expect(soltos).toEqual([]);
  });

  it('envia para o FormSubmit sem recarregar a página', async () => {
    /** @type {string[]} */
    const chamadas = [];
    vi.stubGlobal('fetch', async (/** @type {string} */ url) => {
      chamadas.push(url);
      return { ok: true };
    });
    expect(enviar()).toBe(false); // preventDefault
    await vi.waitFor(() => expect(chamadas.length).toBe(1));
    expect(chamadas[0]).toContain('formsubmit.co');
  });

  it('se o envio falhar, mostra o email em vez de deixar o visitante sem saída', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500 }));
    enviar();
    const aviso = /** @type {HTMLElement} */ (form.querySelector('.form-msg'));
    await vi.waitFor(() => expect(aviso.className).toContain('is-err'));
    expect(aviso.innerHTML).toContain('info@madeiravirtualoffice.com');
  });

  it('reabilita o botão depois de falhar, para se poder tentar outra vez', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('rede');
    });
    const botao = /** @type {HTMLButtonElement} */ (form.querySelector('button'));
    enviar();
    await vi.waitFor(() => expect(botao.disabled).toBe(false));
  });
});
