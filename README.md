# MV OFFICE — Madeira Virtual Office

Site estático (HTML/CSS/JS, sem build e sem dependências). Endereço comercial
no Funchal, com receção e digitalização de correio, coworking e ligações
locais.

Segue a direção **V15 final** entregue pelo designer
(`MV_OFFICE_FINAL_WEB_DESIGNER_PRESENTATION`). A sequência das secções, o
preço e a identidade vêm de lá e não devem ser alterados sem nova entrega.

## Correr localmente

```
python3 -m http.server 8000
```

Depois abrir http://localhost:8000

## Verificar antes de commit

```
python3 check.py
```

Verifica HTML equilibrado, ficheiros referenciados, âncoras com destino,
sintaxe do JS e sete regras de acessibilidade e SEO. Corre igual no GitHub
Actions e é obrigatório estar verde para fazer merge.

## Ficheiros

| Ficheiro | O quê |
|---|---|
| `index.html` | página única |
| `styles.css` | estilos (navy #071F3B + dourado #D8B663) |
| `main.js` | devolve o topo ao recarregar; mais nada |
| `check.py` | verificador, também usado pelo CI |
| `images/` | o que a página serve |
| `brand/` | masters vetoriais do logótipo |

## Contactos publicados

Morada, telefone, WhatsApp e email estão no fim do `index.html` e repetidos no
JSON-LD. Mudar num sítio obriga a mudar no outro.

## Por fazer

- [x] Domínio: madeiravirtualoffice.com (sem hífen — o antigo, com hífen, saiu)
- [ ] Apontar DNS para o alojamento
- [ ] Confirmar que a caixa info@madeiravirtualoffice.com recebe
- [ ] Substituir a fotografia provisória por fotografia licenciada

## Fotografias

**Provisórias.** O hero é do Caniçal, de Asurnipal, CC BY-SA 4.0, cortado e
redimensionado — a atribuição no rodapé é obrigatória pela licença. A
`madeira-flower.jpg` veio da entrega do designer **sem indicação de autor nem
de licença**, e tem de ser substituída ou licenciada antes de ir para o ar.
