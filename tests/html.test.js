import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');

/** @type {Document} */
let doc;
beforeAll(() => {
  doc = new DOMParser().parseFromString(html, 'text/html');
});

/**
 * Resolve um caminho absoluto da página para o ficheiro em disco.
 * @param {string} url
 */
function emDisco(url) {
  return url.startsWith('/src/') ? join(RAIZ, url.slice(1)) : join(RAIZ, 'public', url);
}

describe('estrutura', () => {
  it('tem exatamente um h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it('declara o idioma', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
  });

  it('tem title, description e canonical', () => {
    expect(doc.title.trim()).not.toBe('');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBeTruthy();
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://madeiravirtualoffice.com/',
    );
  });

  it('usa sempre o domínio sem hífen', () => {
    expect(html).not.toMatch(/madeira-virtualoffice/);
  });
});

describe('acessibilidade', () => {
  it('todas as imagens têm alt', () => {
    const sem = [...doc.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt'));
    expect(sem.map((i) => i.getAttribute('src'))).toEqual([]);
  });

  it('todo o campo de formulário visível tem rótulo', () => {
    const campos = [...doc.querySelectorAll('input, select, textarea')].filter(
      (c) =>
        c.getAttribute('type') !== 'hidden' &&
        c.getAttribute('aria-hidden') !== 'true' &&
        !(c.getAttribute('style') ?? '').includes('display:none'),
    );
    const soltos = campos.filter(
      (c) => !c.closest('label') && !doc.querySelector(`label[for="${c.id}"]`),
    );
    expect(soltos).toEqual([]);
  });

  it('links para outro separador trazem rel=noopener', () => {
    const maus = [...doc.querySelectorAll('[target="_blank"]')].filter(
      (a) => !(a.getAttribute('rel') ?? '').includes('noopener'),
    );
    expect(maus.map((a) => a.getAttribute('href'))).toEqual([]);
  });

  it('o menu principal é navegável e identificado', () => {
    const nav = doc.querySelector('nav.main-nav');
    expect(nav?.getAttribute('aria-label')).toBeTruthy();
    const botao = doc.querySelector('.nav-toggle');
    expect(botao?.getAttribute('aria-expanded')).toBe('false');
    expect(botao?.getAttribute('aria-controls')).toBe(nav?.id);
  });
});

describe('referências', () => {
  it('todos os ficheiros referenciados existem', () => {
    const urls = [...doc.querySelectorAll('[src], [href]')]
      .map((e) => e.getAttribute('src') ?? e.getAttribute('href') ?? '')
      .filter((u) => u.startsWith('/'));
    expect(urls.length).toBeGreaterThan(3);
    expect(urls.filter((u) => !existsSync(emDisco(u)))).toEqual([]);
  });

  it('todas as âncoras apontam para um id existente', () => {
    const alvos = [...doc.querySelectorAll('a[href^="#"]')]
      .map((a) => (a.getAttribute('href') ?? '').slice(1))
      .filter(Boolean);
    expect(alvos.length).toBeGreaterThan(3);
    expect(alvos.filter((t) => !doc.getElementById(t))).toEqual([]);
  });
});

describe('regras do briefing V15', () => {
  it('o preço não aparece no hero', () => {
    const hero = doc.querySelector('.hero');
    expect(hero?.textContent).not.toMatch(/€|\bIVA\b/);
  });

  it('o preço aparece na secção de membership', () => {
    expect(doc.querySelector('.price-card')?.textContent).toMatch(/€300/);
  });

  it('não há mapa embebido', () => {
    expect(doc.querySelector('iframe')).toBeNull();
  });

  it('não reintroduz serviço de atendimento de chamadas', () => {
    expect(html).not.toMatch(/receptionist|call answering|call-answering/i);
  });
});
