# Madeira Virtual Office

Site estático (HTML/CSS/JS, sem build). Serviços: Business Address, Mail Handling,
Mail Scanning e Business Support no Funchal, Madeira.

## Correr localmente

```
python3 -m http.server 8000
```

Depois abrir http://localhost:8000

## Ficheiros

| Ficheiro | O quê |
|---|---|
| `index.html` | página única |
| `styles.css` | estilos (azul/branco + dourado do logótipo) |
| `main.js` | pré-loader e envio do formulário |
| `images/` | logótipo e fotografias |

## Formulário

Usa [FormSubmit.co](https://formsubmit.co) — sem back-end e sem base de dados.
O `action` do form em `index.html` aponta para o email de destino; o **primeiro
envio gera um email de ativação** que tem de ser confirmado uma vez.

## Por fazer

- [ ] Comprar domínio e apontar para o alojamento
- [ ] Trocar `info@madeiravirtualoffice.com` pelo email definitivo
- [ ] Definir modelo de pagamento
- [ ] Morada real na secção "O local"

## Créditos das fotografias

Wikimedia Commons: Diego Delso, Virgílio Gomes, Holger Uwe Schmitt, Dietmar Rabich (CC BY-SA 4.0);
Michael Gaylard (CC BY 2.0). A atribuição no rodapé é obrigatória pelas licenças.
