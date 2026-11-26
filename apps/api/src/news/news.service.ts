import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagePrivacy,
  UserRole,
  type NewsArticleItem,
  type NewsCommentItem,
  type PaginatedResponse,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateNewsCommentDto, CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class NewsService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async listNews(params: {
    page?: number;
    limit?: number;
    viewerId?: string;
  }): Promise<PaginatedResponse<NewsArticleItem>> {
    await this.ensureInitialNewsSeeded();

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const [totalItems, articles] = await Promise.all([
      this.prisma.newsArticle.count(),
      this.prisma.newsArticle.findMany({
        include: {
          author: { include: { profile: true } },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
          reactions: params.viewerId
            ? {
                where: { userId: params.viewerId },
                select: { id: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      items: articles.map((article) => this.mapNewsToDto(article, Boolean(params.viewerId))),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getNewsByIdOrSlug(
    idOrSlug: string,
    viewerId?: string,
  ): Promise<NewsArticleItem> {
    await this.ensureInitialNewsSeeded();

    const isUuid = UUID_REGEX.test(idOrSlug);
    const article = await this.prisma.newsArticle.findFirst({
      where: isUuid
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      include: {
        author: { include: { profile: true } },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
        reactions: viewerId
          ? {
              where: { userId: viewerId },
              select: { id: true },
            }
          : false,
        comments: {
          include: {
            author: { include: { profile: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('News article not found.');
    }

    const dto = this.mapNewsToDto(article, Boolean(viewerId));
    dto.comments = article.comments.map((comment) => ({
      id: comment.id,
      newsId: comment.newsId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: this.profilesService.mapUserWithProfileToPublicSummary(comment.author),
    }));

    return dto;
  }

  async createNews(
    actor: { sub: string; role: UserRole },
    dto: CreateNewsDto,
  ): Promise<NewsArticleItem> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can publish news articles.');
    }

    const slug = await this.generateUniqueSlug(dto.title);
    const readTimeMinutes = this.computeReadTimeMinutes(dto.content);
    const normalizedTags = (dto.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const trimmedImageUrl = dto.imageUrl?.trim() || null;

    const created = await this.prisma.newsArticle.create({
      data: {
        authorId: actor.sub,
        slug,
        title: dto.title.trim(),
        excerpt: dto.excerpt.trim(),
        content: dto.content.trim(),
        imageUrl: trimmedImageUrl,
        tags: normalizedTags,
        readTimeMinutes,
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return this.mapNewsToDto(created, false);
  }

  async updateNews(
    newsId: string,
    actor: { sub: string; role: UserRole },
    dto: UpdateNewsDto,
  ): Promise<NewsArticleItem> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can edit news articles.');
    }

    const existing = await this.prisma.newsArticle.findUnique({
      where: { id: newsId },
    });

    if (!existing) {
      throw new NotFoundException('News article not found.');
    }

    const updatedContent = dto.content !== undefined ? dto.content.trim() : existing.content;
    const readTimeMinutes = this.computeReadTimeMinutes(updatedContent);

    const updated = await this.prisma.newsArticle.update({
      where: { id: newsId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt.trim() } : {}),
        ...(dto.content !== undefined
          ? { content: updatedContent, readTimeMinutes }
          : {}),
        ...(dto.imageUrl !== undefined
          ? { imageUrl: dto.imageUrl.trim() || null }
          : {}),
        ...(dto.tags !== undefined
          ? {
              tags: dto.tags.map((t) => t.trim()).filter((t) => t.length > 0),
            }
          : {}),
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return this.mapNewsToDto(updated, false);
  }

  async deleteNews(
    newsId: string,
    actor: { sub: string; role: UserRole },
  ): Promise<{ deleted: boolean; id: string }> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete news articles.');
    }

    const existing = await this.prisma.newsArticle.findUnique({
      where: { id: newsId },
    });

    if (!existing) {
      throw new NotFoundException('News article not found.');
    }

    await this.prisma.newsArticle.delete({ where: { id: newsId } });
    return { deleted: true, id: newsId };
  }

  async addComment(
    newsId: string,
    authorId: string,
    dto: CreateNewsCommentDto,
  ): Promise<NewsCommentItem> {
    const article = await this.prisma.newsArticle.findUnique({ where: { id: newsId } });
    if (!article) {
      throw new NotFoundException('News article not found.');
    }

    const comment = await this.prisma.newsComment.create({
      data: {
        newsId,
        authorId,
        body: dto.body.trim(),
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    return {
      id: comment.id,
      newsId: comment.newsId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: this.profilesService.mapUserWithProfileToPublicSummary(comment.author),
    };
  }

  async toggleReaction(
    newsId: string,
    userId: string,
  ): Promise<{ newsId: string; liked: boolean; likesCount: number }> {
    const article = await this.prisma.newsArticle.findUnique({ where: { id: newsId } });
    if (!article) {
      throw new NotFoundException('News article not found.');
    }

    const existing = await this.prisma.newsReaction.findUnique({
      where: {
        newsId_userId: {
          newsId,
          userId,
        },
      },
    });

    let liked = false;
    if (existing) {
      await this.prisma.newsReaction.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await this.prisma.newsReaction.create({
        data: { newsId, userId },
      });
      liked = true;
    }

    const likesCount = await this.prisma.newsReaction.count({
      where: { newsId },
    });

    return { newsId, liked, likesCount };
  }

  private computeReadTimeMinutes(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'rider-news';

    const existing = await this.prisma.newsArticle.findUnique({ where: { slug: base } });
    if (!existing) {
      return base;
    }

    return `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private mapNewsToDto(
    article: {
      id: string;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
      imageUrl?: string | null;
      tags: string[];
      readTimeMinutes: number;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: string;
        role: string;
        phoneNumber: string | null;
        allowDirectMessages: string;
        profile: {
          userId: string;
          displayName: string;
          username: string;
          avatarUrl: string | null;
          bio: string | null;
          city: string | null;
          showPhone: boolean;
        } | null;
      };
      _count: {
        comments: number;
        reactions: number;
      };
      reactions?: Array<{ id: string }>;
    },
    hasViewer: boolean,
  ): NewsArticleItem {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      imageUrl: article.imageUrl ?? null,
      tags: article.tags,
      readTimeMinutes: article.readTimeMinutes,
      likesCount: article._count.reactions,
      commentsCount: article._count.comments,
      isLikedByViewer: hasViewer ? (article.reactions?.length ?? 0) > 0 : false,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      author: this.profilesService.mapUserWithProfileToPublicSummary(article.author),
    };
  }

  private async ensureInitialNewsSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.newsArticle.count();
      if (count > 0) {
        return;
      }

      const adminAuthor = await this.prisma.user.upsert({
        where: { email: 'meera.torques@ridersclub.example' },
        update: { role: UserRole.ADMIN },
        create: {
          email: 'meera.torques@ridersclub.example',
          role: UserRole.ADMIN,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'meera_torques',
              displayName: 'Meera Krishnan (Admin)',
              bio: 'RidersClub Editorial & Safety Admin',
              city: 'Chennai',
            },
          },
        },
      });

      await this.prisma.newsArticle.createMany({
        data: [
          {
            authorId: adminAuthor.id,
            slug: 'high-altitude-braking-clutch-care-spiti',
            title: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
            excerpt:
              'How DOT 4 boiling points, braided steel lines, and clutch free-play adjustments prevent fade on steep mountain descents.',
            content:
              'Long mountain descents from Kunzum La and Rohtang put extreme thermal loads on your braking system. Old hygroscopic brake fluid absorbs moisture over monsoon months, dropping its wet boiling point dramatically.\n\n1. Flush and bleed with fresh DOT 4 or DOT 5.1 fluid before any high-altitude tour.\n2. Inspect sintered brake pad thickness—ensure at least 3.5mm of friction material remains.\n3. Verify 2–3mm of clutch lever free-play at the perch so slipping the clutch in rocky hairpins does not glaze your friction plates.',
            imageUrl:
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
            tags: ['Brakes', 'Touring Prep', 'Safety'],
            readTimeMinutes: 6,
          },
          {
            authorId: adminAuthor.id,
            slug: 'pre-purchase-inspection-used-dual-sport-motorcycles',
            title: 'Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles',
            excerpt:
              'Inspecting steering head bearings, swingarm play, cold-start compression, and service records before negotiating on the Marketplace.',
            content:
              'Buying a pre-owned adventure or dual-sport motorcycle requires checking components that endure off-road impacts.\n\n1. Ask the seller for a true cold start and listen for cam-chain tensioner rattle.\n2. Lift the front wheel off the ground and check steering stem bearings for center-detent notchiness.\n3. Inspect the lower frame cradle, bash-plate mounts, and wheel rims for flat spots or hairline cracks.\n4. Cross-reference every odometer milestone against workshop invoices.',
            imageUrl:
              'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
            tags: ['Marketplace', 'Inspection', 'Used Bikes'],
            readTimeMinutes: 8,
          },
        ],
        skipDuplicates: true,
      });
    } catch {
      // Ignore seed race conditions
    }
  }
}
