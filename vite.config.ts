/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Set by GitHub Actions, used for the "View on GitHub" link in the header.
const repository = process.env.GITHUB_REPOSITORY;

// `base: './'` makes the build work on any GitHub Pages path (user, org or project site).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __REPO_URL__: JSON.stringify(repository ? `https://github.com/${repository}` : ''),
  },
  build: {
    rolldownOptions: {
      output: {
        // Separate vendor chunks so browsers keep them cached across app deployments.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 3,
            },
            { name: 'mantine', test: /node_modules[\\/]@mantine[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
