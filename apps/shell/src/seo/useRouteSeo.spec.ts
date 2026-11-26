import { describe, expect, it } from 'vitest';
import {
  applyDocumentSeo,
  resolveRouteSeo,
} from './useRouteSeo.js';

describe('useRouteSeo / resolveRouteSeo', () => {
  it('marks public community, news, rides, mechanics, help, and marketplace routes as index, follow', () => {
    const publicPaths = [
      '/',
      '/communities',
      '/news',
      '/rides',
      '/help',
      '/mechanics',
      '/marketplace',
    ];

    for (const path of publicPaths) {
      const seo = resolveRouteSeo(path);
      expect(seo.robots).toBe('index, follow');
      expect(seo.canonicalPath).toBe(path);
      expect(seo.title).toContain('RidersClub');
      expect(seo.description.length).toBeGreaterThan(20);
    }
  });

  it('marks private and unknown routes as noindex, nofollow', () => {
    const privatePaths = ['/garage', '/profile', '/auth', '/admin', '/does-not-exist'];

    for (const path of privatePaths) {
      const seo = resolveRouteSeo(path);
      expect(seo.robots).toBe('noindex, nofollow');
    }
  });

  it('updates document title, meta tags, and canonical link via applyDocumentSeo', () => {
    applyDocumentSeo(resolveRouteSeo('/mechanics'));

    expect(document.title).toBe('Verified Mechanics & Workshops Directory — RidersClub');
    expect(
      document.head.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('index, follow');
    expect(
      document.head.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ).toBe('Verified Mechanics & Workshops Directory — RidersClub');
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toContain('/mechanics');
  });
});
