import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubPagesBase = '/gameminiapp-/';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Для локальной разработки нужен корень, а для GitHub Pages нужен base репозитория.
  base: command === 'build' ? githubPagesBase : '/',
}));
