#!/usr/bin/env python3
"""Verifica o site estático: HTML equilibrado, ficheiros referenciados existentes,
âncoras com destino e sintaxe do JS. Corre com `python3 check.py`."""
import html.parser, pathlib, re, subprocess, sys
from urllib.parse import urldefrag

RAIZ = pathlib.Path(__file__).parent
VAZIAS = {'img', 'br', 'meta', 'link', 'input', 'hr', 'source', 'area', 'col', 'embed', 'track', 'wbr'}
# tags cujo fecho é opcional em HTML: deixá-las na pilha gerava erros em cascata
OPCIONAIS = {'p', 'li', 'dt', 'dd', 'td', 'th', 'tr', 'option', 'thead', 'tbody', 'tfoot'}
erros = []


class Analisador(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.pilha, self.ids, self.refs, self.ficheiros = [], set(), [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if (i := a.get('id')):
            self.ids.add(i)
        for chave in ('href', 'src'):
            if not (v := a.get(chave)):
                continue
            if v.startswith('#'):
                self.refs.append(v[1:])
            elif not re.match(r'[a-z]+:|//', v):
                self.ficheiros.append(urldefrag(v)[0])
        if tag not in VAZIAS:
            self.pilha.append((tag, self.getpos()[0]))

    def handle_endtag(self, tag):
        while self.pilha and self.pilha[-1][0] in OPCIONAIS and self.pilha[-1][0] != tag:
            self.pilha.pop()
        if self.pilha and self.pilha[-1][0] == tag:
            self.pilha.pop()
        elif tag not in VAZIAS:
            erros.append(f'{self.nome}: </{tag}> na linha {self.getpos()[0]} não fecha '
                         f'{"<" + self.pilha[-1][0] + "> da linha " + str(self.pilha[-1][1]) if self.pilha else "nada"}')


for pagina in sorted(RAIZ.rglob('*.html')):
    rel = pagina.relative_to(RAIZ)
    p = Analisador()
    p.nome = str(rel)
    p.feed(pagina.read_text())
    for tag, linha in p.pilha:
        if tag not in OPCIONAIS:
            erros.append(f'{rel}: <{tag}> aberta na linha {linha} e nunca fechada')
    for alvo in p.refs:
        if alvo and alvo not in p.ids:
            erros.append(f'{rel}: âncora #{alvo} não corresponde a nenhum id')
    for f in p.ficheiros:
        if not (pagina.parent / f).exists():
            erros.append(f'{rel}: referencia {f}, que não existe')

for js in sorted(RAIZ.rglob('*.js')):
    r = subprocess.run(['node', '--check', str(js)], capture_output=True, text=True)
    if r.returncode:
        # o stderr do node termina com a versão; a razão está nas primeiras linhas
        razao = next((l for l in r.stderr.splitlines() if 'Error' in l), r.stderr.strip()[:200])
        erros.append(f'{js.relative_to(RAIZ)}: {razao.strip()}')

for e in erros:
    print('✗', e)
print(f'\n{len(erros)} problema(s).' if erros else '\nSem problemas.')
sys.exit(1 if erros else 0)
