/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Set by GitHub Actions, used for the "View on GitHub" link in the header.
const repository = process.env.GITHUB_REPOSITORY;

// The version is managed by release-please (see docs/releasing.md) and shown in the header.
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};

// `base: './'` makes the build work on any GitHub Pages path (user, org or project site).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __REPO_URL__: JSON.stringify(repository ? `https://github.com/${repository}` : ''),
  },
  build: {
    rolldownOptions: {
      output: {
        // Separate vendor chunks so browsers keep them cached across app deployments.
        // JSZip stays out of "vendor" so it is only loaded when a zip is downloaded.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 3,
            },
            { name: 'mantine', test: /node_modules[\\/]@mantine[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/](?!jszip[\\/])/, priority: 1 },
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
