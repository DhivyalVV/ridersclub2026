import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: {
    port: 5001,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5001',
  },
  preview: {
    port: 5001,
    strictPort: true,
    cors: true,
  },
  plugins: [
    react(),
    federation({
      name: 'community',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/CommunityRemoteApp.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.28.0' },
      },
    }),
  ],
  build: {
    target: 'chrome89',
    modulePreload: false,
    minify: true,
    cssCodeSplit: false,
  },
});

