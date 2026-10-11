import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initNav } from '../src/main.js';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');

/** @type {Document} */
let doc;
/** @type {HTMLButtonElement} */
let botao;

beforeEach(() => {
  document.documentElement.innerHTML = html.replace(/<!doctype html>/i, '');
  doc = document;
  initNav(doc);
  botao = /** @type {HTMLButtonElement} */ (doc.querySelector('.nav-toggle'));
});

const aberto = () => botao.getAttribute('aria-expanded') === 'true';

describe('menu em ecrã estreito', () => {
  it('começa fechado', () => {
    expect(aberto()).toBe(false);
    expect(doc.getElementById('main-nav')?.classList.contains('is-open')).toBe(false);
  });

  it('abre e fecha ao clicar no botão', () => {
    botao.click();
    expect(aberto()).toBe(true);
    expect(doc.getElementById('main-nav')?.classList.contains('is-open')).toBe(true);
    expect(doc.getElementById('site-header')?.classList.contains('is-open')).toBe(true);
    botao.click();
    expect(aberto()).toBe(false);
  });

  it('fecha ao escolher um link, para não tapar o destino', () => {
    botao.click();
    /** @type {HTMLAnchorElement | null} */ (doc.querySelector('#main-nav a'))?.click();
    expect(aberto()).toBe(false);
  });

  it('fecha com Escape', () => {
    botao.click();
    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(aberto()).toBe(false);
  });

  it('não deixa o estado do botão dessincronizado da classe', () => {
    for (let i = 0; i < 5; i++) botao.click();
    expect(aberto()).toBe(doc.getElementById('main-nav')?.classList.contains('is-open'));
  });
});
