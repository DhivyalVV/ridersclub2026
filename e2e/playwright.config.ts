/**
 * Playwright End-to-End Configuration for RidersClub Micro-Frontend Platform
 * Verifies Shell (:5000) + Federated Remotes (:5001–:5006) + NestJS API (:4000).
 */
export default {
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
};

