import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: {
    port: 5004,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5004',
  },
  preview: {
    port: 5004,
    strictPort: true,
    cors: true,
  },
  plugins: [
    react(),
    federation({
      name: 'mechanics',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/MechanicsRemoteApp.tsx',
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

