import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

const STATIC_PUBLIC_ROUTES: Array<Omit<SitemapEntry, 'lastmod'>> = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/communities', changefreq: 'daily', priority: '0.9' },
  { loc: '/news', changefreq: 'daily', priority: '0.9' },
  { loc: '/rides', changefreq: 'daily', priority: '0.8' },
  { loc: '/mechanics', changefreq: 'weekly', priority: '0.8' },
  { loc: '/marketplace', changefreq: 'daily', priority: '0.8' },
  { loc: '/help', changefreq: 'daily', priority: '0.7' },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  resolveSiteBaseUrl(requestOrigin?: string): string {
    const configured = this.configService.get<string>('SITE_URL')?.trim();
    const raw = configured || requestOrigin || 'http://localhost:5000';
    return raw.replace(/\/+$/, '');
  }

  async generateSitemapXml(requestOrigin?: string): Promise<string> {
    const baseUrl = this.resolveSiteBaseUrl(requestOrigin);
    const entries: SitemapEntry[] = STATIC_PUBLIC_ROUTES.map((route) => ({
      ...route,
      loc: `${baseUrl}${route.loc}`,
    }));

    try {
      const [articles, communities, rides, mechanics, listings] = await Promise.all([
        this.prisma.newsArticle.findMany({
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 500,
        }),
        this.prisma.community.findMany({
          where: { visibility: 'PUBLIC' },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 500,
        }),
        this.prisma.ride.findMany({
          where: { status: 'UPCOMING' },
          select: { id: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 500,
        }),
        this.prisma.mechanicProfile.findMany({
          where: { verificationStatus: 'VERIFIED' },
          select: { id: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 500,
        }),
        this.prisma.marketplaceListing.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 500,
        }),
      ]);

      for (const article of articles) {
        entries.push({
          loc: `${baseUrl}/news/${encodeURIComponent(article.slug)}`,
          lastmod: article.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: '0.8',
        });
      }

      for (const community of communities) {
        entries.push({
          loc: `${baseUrl}/communities?invite=${encodeURIComponent(community.slug)}`,
          lastmod: community.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: '0.7',
        });
      }

      for (const ride of rides) {
        entries.push({
          loc: `${baseUrl}/rides/${encodeURIComponent(ride.id)}`,
          lastmod: ride.updatedAt.toISOString(),
          changefreq: 'daily',
          priority: '0.7',
        });
      }

      for (const mechanic of mechanics) {
        entries.push({
          loc: `${baseUrl}/mechanics/${encodeURIComponent(mechanic.id)}`,
          lastmod: mechanic.updatedAt.toISOString(),
          changefreq: 'monthly',
          priority: '0.7',
        });
      }

      for (const listing of listings) {
        entries.push({
          loc: `${baseUrl}/marketplace/${encodeURIComponent(listing.id)}`,
          lastmod: listing.updatedAt.toISOString(),
          changefreq: 'daily',
          priority: '0.7',
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to query dynamic records for sitemap.xml; serving static routes only (${
          error instanceof Error ? error.message : 'unknown error'
        })`,
      );
    }

    const urlNodes = entries
      .map((entry) => {
        const lastmodNode = entry.lastmod
          ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
          : '';
        return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodNode}\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
  }
}
