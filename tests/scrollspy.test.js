import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seccaoActiva, initNav } from '../src/main.js';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

const seccoes = [
  { id: 'service', topo: 1000 },
  { id: 'connections', topo: 3000 },
  { id: 'faq', topo: 5000 },
  { id: 'contact', topo: 7000 },
];

describe('qual a secção activa', () => {
  it('nenhuma antes da primeira — é aí que o Home manda', () => {
    expect(seccaoActiva(seccoes, 0)).toBeNull();
    expect(seccaoActiva(seccoes, 999)).toBeNull();
  });

  it('a secção muda exatamente quando o topo cruza a linha', () => {
    expect(seccaoActiva(seccoes, 1000)).toBe('service');
    expect(seccaoActiva(seccoes, 2999)).toBe('service');
    expect(seccaoActiva(seccoes, 3000)).toBe('connections');
  });

  it('mantém a última secção cujo topo já passou, não a mais próxima', () => {
    expect(seccaoActiva(seccoes, 6999)).toBe('faq');
    expect(seccaoActiva(seccoes, 99999)).toBe('contact');
  });

  it('é simétrica: descer e subir até à mesma linha dá o mesmo resultado', () => {
    const descida = [0, 1500, 3500, 5500, 7500].map((y) => seccaoActiva(seccoes, y));
    const subida = [7500, 5500, 3500, 1500, 0].map((y) => seccaoActiva(seccoes, y));
    expect(descida).toEqual([...subida].reverse());
  });
});

describe('ligação ao menu', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html.replace(/<!doctype html>/i, '');
    initNav(document);
  });

  it('o Home aponta para <main>, que envolve as outras secções', () => {
    // é esta a razão de não se usar IntersectionObserver aqui
    const topo = document.getElementById('top');
    expect(topo?.tagName).toBe('MAIN');
    for (const id of ['service', 'connections', 'faq', 'contact']) {
      expect(topo?.contains(document.getElementById(id))).toBe(true);
    }
  });

  it('nunca há mais do que uma âncora realçada', () => {
    expect(document.querySelectorAll('#main-nav .is-active').length).toBeLessThanOrEqual(1);
  });

  it('todas as âncoras do menu têm destino na página', () => {
    const sem = [...document.querySelectorAll('#main-nav a[href^="#"]')]
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => !document.querySelector(h));
    expect(sem).toEqual([]);
  });
});
