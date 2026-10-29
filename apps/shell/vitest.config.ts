import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'community/App': path.resolve(__dirname, '../community/src/CommunityRemoteApp.tsx'),
      'rides/App': path.resolve(__dirname, '../rides/src/RidesRemoteApp.tsx'),
      'help/App': path.resolve(__dirname, '../help/src/HelpRemoteApp.tsx'),
      'mechanics/App': path.resolve(__dirname, '../mechanics/src/MechanicsRemoteApp.tsx'),
      'garage/App': path.resolve(__dirname, '../garage/src/GarageRemoteApp.tsx'),
      'marketplace/App': path.resolve(__dirname, '../marketplace/src/MarketplaceRemoteApp.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
