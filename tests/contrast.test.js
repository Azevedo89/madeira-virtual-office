import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');

/**
 * Lê um token de cor do :root.
 * @param {string} nome
 * @returns {string}
 */
function token(nome) {
  const m = css.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${nome} não encontrado`);
  return m[1];
}

/** @param {number} v */
const linear = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);

/** @param {string} hex */
function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * linear((n >> 16) & 255) + 0.7152 * linear((n >> 8) & 255) + 0.0722 * linear(n & 255)
  );
}

/**
 * Rácio de contraste WCAG entre duas cores.
 * @param {string} a
 * @param {string} b
 */
function razao(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

const BRANCO = '#ffffff';

describe('contraste WCAG AA (4.5:1 para texto normal)', () => {
  it('o dourado de texto passa em branco e no fundo suave', () => {
    expect(razao(token('gold-text'), BRANCO)).toBeGreaterThanOrEqual(4.5);
    expect(razao(token('gold-text'), token('soft'))).toBeGreaterThanOrEqual(4.5);
  });

  it('o texto secundário passa em branco e no fundo suave', () => {
    expect(razao(token('muted'), BRANCO)).toBeGreaterThanOrEqual(4.5);
    expect(razao(token('muted'), token('soft'))).toBeGreaterThanOrEqual(4.5);
  });

  it('o corpo de texto passa em branco', () => {
    expect(razao(token('ink'), BRANCO)).toBeGreaterThanOrEqual(4.5);
  });

  it('o botão dourado usa navy, porque branco sobre dourado não chega', () => {
    expect(razao(token('navy'), token('gold'))).toBeGreaterThanOrEqual(4.5);
    expect(razao(BRANCO, token('gold'))).toBeLessThan(4.5);
    expect(css).toMatch(/\.btn\.gold\{[^}]*color:var\(--navy\)/);
  });

  it('o dourado claro passa sobre os dois navies', () => {
    expect(razao(token('gold2'), token('navy'))).toBeGreaterThanOrEqual(4.5);
    expect(razao(token('gold2'), token('navy2'))).toBeGreaterThanOrEqual(4.5);
  });
});
