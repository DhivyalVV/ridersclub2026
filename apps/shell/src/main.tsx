import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@ridersclub/ui/styles.css';
import { ShellApp } from './ShellApp.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find #root element in apps/shell');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ShellApp />
    </BrowserRouter>
  </React.StrictMode>,
);

