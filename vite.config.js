import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    // o DOM dos testes não deve ir à rede buscar css nem js
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          disableJavaScriptFileLoading: true,
          disableIframePageLoading: true,
        },
      },
    },
  },
});
