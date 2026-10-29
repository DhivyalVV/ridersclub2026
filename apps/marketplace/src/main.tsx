import * as React from 'react';
import { createRoot } from 'react-dom/client';
import '@ridersclub/ui/styles.css';
import { MarketplaceRemoteApp } from './MarketplaceRemoteApp.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find #root element in apps/marketplace');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <MarketplaceRemoteApp />
      </div>
    </div>
  </React.StrictMode>,
);

