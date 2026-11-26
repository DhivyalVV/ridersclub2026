import { Controller, Get, Header, Req } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SeoService } from './seo.service';

@ApiTags('SEO')
@Controller('sitemap.xml')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiProduces('application/xml')
  @ApiOperation({ summary: 'Generate dynamic XML sitemap for public RidersClub routes and entities' })
  @ApiResponse({ status: 200, description: 'Returns XML sitemap' })
  async getSitemap(@Req() req: Request): Promise<string> {
    const host = req.get('host');
    const requestOrigin = host ? `${req.protocol}://${host}` : undefined;
    return this.seoService.generateSitemapXml(requestOrigin);
  }
}
