import { ConfigService } from '@nestjs/config';
import { SeoService } from './seo.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('SeoService', () => {
  const mockConfigService = {
    get: jest.fn((key: string) =>
      key === 'SITE_URL' ? 'https://ridersclub.example/' : undefined,
    ),
  } as unknown as ConfigService;

  it('generates XML sitemap with static routes and public database records', async () => {
    const updatedAt = new Date('2026-10-01T10:00:00.000Z');
    const mockPrisma = {
      newsArticle: {
        findMany: jest.fn().mockResolvedValue([
          { slug: 'high-altitude-braking', updatedAt },
        ]),
      },
      community: {
        findMany: jest.fn().mockResolvedValue([
          { slug: 'western-ghats-adv', updatedAt },
        ]),
      },
      ride: {
        findMany: jest.fn().mockResolvedValue([{ id: 'ride-1', updatedAt }]),
      },
      mechanicProfile: {
        findMany: jest.fn().mockResolvedValue([{ id: 'mech-1', updatedAt }]),
      },
      marketplaceListing: {
        findMany: jest.fn().mockResolvedValue([{ id: 'listing-1', updatedAt }]),
      },
    } as unknown as PrismaService;

    const service = new SeoService(mockPrisma, mockConfigService);
    const xml = await service.generateSitemapXml();

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://ridersclub.example/</loc>');
    expect(xml).toContain('<loc>https://ridersclub.example/news/high-altitude-braking</loc>');
    expect(xml).toContain(
      '<loc>https://ridersclub.example/communities?invite=western-ghats-adv</loc>',
    );
    expect(xml).toContain('<loc>https://ridersclub.example/rides/ride-1</loc>');
    expect(xml).toContain('<loc>https://ridersclub.example/mechanics/mech-1</loc>');
    expect(xml).toContain('<loc>https://ridersclub.example/marketplace/listing-1</loc>');
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/garage');
  });

  it('falls back to static routes when Prisma query fails', async () => {
    const rejectDb = () => Promise.reject(new Error('DB down'));
    const failingPrisma = {
      newsArticle: { findMany: jest.fn(rejectDb) },
      community: { findMany: jest.fn(rejectDb) },
      ride: { findMany: jest.fn(rejectDb) },
      mechanicProfile: { findMany: jest.fn(rejectDb) },
      marketplaceListing: { findMany: jest.fn(rejectDb) },
    } as unknown as PrismaService;

    const service = new SeoService(failingPrisma, mockConfigService);
    const xml = await service.generateSitemapXml();

    expect(xml).toContain('<loc>https://ridersclub.example/</loc>');
    expect(xml).toContain('<loc>https://ridersclub.example/mechanics</loc>');
  });
});
