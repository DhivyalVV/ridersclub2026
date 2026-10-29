import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const remotesConfig = {
    community: env.VITE_COMMUNITY_REMOTE_URL || 'http://localhost:5001/remoteEntry.js',
    rides: env.VITE_RIDES_REMOTE_URL || 'http://localhost:5002/remoteEntry.js',
    help: env.VITE_HELP_REMOTE_URL || 'http://localhost:5003/remoteEntry.js',
    mechanics: env.VITE_MECHANICS_REMOTE_URL || 'http://localhost:5004/remoteEntry.js',
    garage: env.VITE_GARAGE_REMOTE_URL || 'http://localhost:5005/remoteEntry.js',
    marketplace: env.VITE_MARKETPLACE_REMOTE_URL || 'http://localhost:5006/remoteEntry.js',
  };

  return {
    server: {
      port: 5000,
      strictPort: true,
      cors: true,
      origin: 'http://localhost:5000',
    },
    preview: {
      port: 5000,
      strictPort: true,
      cors: true,
    },
    plugins: [
      react(),
      federation({
        name: 'shell',
        remotes: {
          community: {
            type: 'module',
            name: 'community',
            entry: remotesConfig.community,
            entryGlobalName: 'community',
            shareScope: 'default',
          },
          rides: {
            type: 'module',
            name: 'rides',
            entry: remotesConfig.rides,
            entryGlobalName: 'rides',
            shareScope: 'default',
          },
          help: {
            type: 'module',
            name: 'help',
            entry: remotesConfig.help,
            entryGlobalName: 'help',
            shareScope: 'default',
          },
          mechanics: {
            type: 'module',
            name: 'mechanics',
            entry: remotesConfig.mechanics,
            entryGlobalName: 'mechanics',
            shareScope: 'default',
          },
          garage: {
            type: 'module',
            name: 'garage',
            entry: remotesConfig.garage,
            entryGlobalName: 'garage',
            shareScope: 'default',
          },
          marketplace: {
            type: 'module',
            name: 'marketplace',
            entry: remotesConfig.marketplace,
            entryGlobalName: 'marketplace',
            shareScope: 'default',
          },
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
  };
});
