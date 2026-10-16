import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { valorContado } from '../src/main.js';

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');

describe('contagem do preço', () => {
  it('começa em zero e acaba no valor exacto', () => {
    expect(valorContado(0, 300)).toBe(0);
    expect(valorContado(1, 300)).toBe(300);
  });

  it('nunca passa do valor, mesmo com fracções fora do intervalo', () => {
    expect(valorContado(2, 300)).toBe(300);
    expect(valorContado(-1, 300)).toBe(0);
  });

  it('trava no fim, em vez de ser linear', () => {
    expect(valorContado(0.5, 300)).toBeGreaterThan(150);
    expect(valorContado(0.9, 300)).toBeGreaterThan(290);
  });

  it('nunca recua', () => {
    let anterior = -1;
    for (let f = 0; f <= 1; f += 0.05) {
      const v = valorContado(f, 300);
      expect(v).toBeGreaterThanOrEqual(anterior);
      anterior = v;
    }
  });

  it('o valor final já está no HTML, para quem não corre JS o ver na mesma', () => {
    expect(html).toMatch(/data-contar="300"[^>]*>€300</);
  });
});

describe('movimento é decoração, não conteúdo', () => {
  it('todas as animações caem em prefers-reduced-motion', () => {
    const bloco = css.slice(css.lastIndexOf('@media(prefers-reduced-motion:reduce)'));
    for (const regra of ['hero-image::before', 'hero-cue span', 'read-bar', 'faq-list p']) {
      expect(bloco).toContain(regra);
    }
  });

  it('o indicador do hero é um link para a secção seguinte, não um enfeite', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const cue = doc.querySelector('.hero-cue');
    expect(cue?.tagName).toBe('A');
    expect(cue?.getAttribute('href')).toBe('#service');
    expect(cue?.getAttribute('aria-label')).toBeTruthy();
  });

  it('a barra de progresso está escondida dos leitores de ecrã', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.getElementById('read-bar')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('formulário obrigatório', () => {
  it('todos os campos visíveis são obrigatórios', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const campos = [
      ...doc.querySelectorAll('#contact-form input, #contact-form select, #contact-form textarea'),
    ].filter(
      (c) => c.getAttribute('type') !== 'hidden' && c.getAttribute('aria-hidden') !== 'true',
    );
    expect(campos.length).toBe(4);
    expect(campos.filter((c) => !c.hasAttribute('required'))).toEqual([]);
  });

  it('o select abre numa opção vazia, senão required não exigia escolha nenhuma', () => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const primeira = doc.querySelector('#contact-form select option');
    expect(primeira?.getAttribute('value')).toBe('');
  });
});
