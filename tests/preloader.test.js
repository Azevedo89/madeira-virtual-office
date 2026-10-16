import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initPreloader, initReveal } from '../src/main.js';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');

beforeEach(() => {
  document.documentElement.innerHTML = html.replace(/<!doctype html>/i, '');
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('pré-loader', () => {
  it('existe na marcação e anuncia-se como estado', () => {
    const el = document.getElementById('preloader');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-label')).toBeTruthy();
  });

  it('não trava o scroll do body, para o site não ficar preso sem JS', () => {
    expect(css).not.toMatch(/body:not\(\.loaded\)\{overflow:hidden\}/);
  });

  it('tem salvaguarda em CSS que o retira sem JS nenhum', () => {
    expect(css).toMatch(/animation:pl-salvaguarda/);
    expect(css).toMatch(/@keyframes pl-salvaguarda\{to\{visibility:hidden/);
  });

  it('desaparece ao fim do teto mesmo que a página nunca carregue', () => {
    initPreloader(document, { minimo: 10, teto: 50 });
    expect(document.getElementById('preloader')?.classList.contains('is-done')).toBe(false);
    vi.advanceTimersByTime(60);
    // o teto marca pronto; o passo seguinte do rAF conclui
    vi.advanceTimersByTime(60);
    expect(document.getElementById('preloader')?.classList.contains('is-done')).toBe(true);
  });

  it('não rebenta se a marcação não existir', () => {
    document.getElementById('preloader')?.remove();
    expect(() => initPreloader(document)).not.toThrow();
  });
});

describe('revelação ao scroll', () => {
  it('a classe .reveal é posta pelo JS, nunca vem no HTML', () => {
    expect(html).not.toMatch(/class="[^"]*\breveal\b/);
  });

  it('marca os blocos e observa-os', () => {
    const observados = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        /** @param {IntersectionObserverCallback} cb */
        constructor(cb) {
          this.cb = cb;
        }
        observe(/** @type {Element} */ el) {
          observados.push(el);
        }
        unobserve() {}
      },
    );
    initReveal(document);
    expect(observados.length).toBeGreaterThan(10);
    expect(document.querySelectorAll('.reveal').length).toBe(observados.length);
    vi.unstubAllGlobals();
  });

  it('o estado visível tem regra própria no css', () => {
    expect(css).toMatch(/\.reveal\.is-in\{opacity:1/);
  });
});
