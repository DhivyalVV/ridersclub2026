import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DirectMessagePrivacy,
  UserRole,
  type BlogCommentItem,
  type BlogPostItem,
  type PaginatedResponse,
} from '@ridersclub/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateBlogCommentDto, CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class BlogsService {
  private seededCheckComplete = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async listBlogs(params: {
    search?: string;
    tag?: string;
    page?: number;
    limit?: number;
    viewerId?: string;
  }): Promise<PaginatedResponse<BlogPostItem>> {
    await this.ensureInitialBlogsSeeded();

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;
    const search = params.search?.trim();
    const tag = params.tag?.trim();

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { excerpt: { contains: search, mode: 'insensitive' as const } },
              { content: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const [totalItems, blogs] = await Promise.all([
      this.prisma.blog.count({ where }),
      this.prisma.blog.findMany({
        where,
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
      items: blogs.map((blog) => this.mapBlogToDto(blog, Boolean(params.viewerId))),
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

  async getBlogByIdOrSlug(
    idOrSlug: string,
    viewerId?: string,
  ): Promise<BlogPostItem> {
    await this.ensureInitialBlogsSeeded();

    const isUuid = UUID_REGEX.test(idOrSlug);
    const blog = await this.prisma.blog.findFirst({
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

    if (!blog) {
      throw new NotFoundException('Blog post not found.');
    }

    const dto = this.mapBlogToDto(blog, Boolean(viewerId));
    dto.comments = blog.comments.map((comment) => ({
      id: comment.id,
      blogId: comment.blogId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: this.profilesService.mapUserWithProfileToPublicSummary(comment.author),
    }));

    return dto;
  }

  async createBlog(authorId: string, dto: CreateBlogDto): Promise<BlogPostItem> {
    const slug = await this.generateUniqueSlug(dto.title);
    const readTimeMinutes = this.computeReadTimeMinutes(dto.content);
    const normalizedTags = (dto.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const created = await this.prisma.blog.create({
      data: {
        authorId,
        slug,
        title: dto.title.trim(),
        excerpt: dto.excerpt.trim(),
        content: dto.content.trim(),
        tags: normalizedTags,
        readTimeMinutes,
      },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return this.mapBlogToDto(created, false);
  }

  async updateBlog(
    blogId: string,
    actor: { sub: string; role: UserRole },
    dto: UpdateBlogDto,
  ): Promise<BlogPostItem> {
    const existing = await this.prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!existing) {
      throw new NotFoundException('Blog post not found.');
    }

    const isModeratorOrAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.MODERATOR;
    if (existing.authorId !== actor.sub && !isModeratorOrAdmin) {
      throw new ForbiddenException(
        'Only the blog author or a moderator can edit this blog post.',
      );
    }

    const updatedContent = dto.content !== undefined ? dto.content.trim() : existing.content;
    const readTimeMinutes = this.computeReadTimeMinutes(updatedContent);

    const updated = await this.prisma.blog.update({
      where: { id: blogId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt.trim() } : {}),
        ...(dto.content !== undefined
          ? { content: updatedContent, readTimeMinutes }
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

    return this.mapBlogToDto(updated, false);
  }

  async deleteBlog(
    blogId: string,
    actor: { sub: string; role: UserRole },
  ): Promise<{ deleted: boolean; id: string }> {
    const existing = await this.prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!existing) {
      throw new NotFoundException('Blog post not found.');
    }

    const isModeratorOrAdmin =
      actor.role === UserRole.ADMIN || actor.role === UserRole.MODERATOR;
    if (existing.authorId !== actor.sub && !isModeratorOrAdmin) {
      throw new ForbiddenException(
        'Only the blog author or a moderator can delete this blog post.',
      );
    }

    await this.prisma.blog.delete({ where: { id: blogId } });
    return { deleted: true, id: blogId };
  }

  async addComment(
    blogId: string,
    authorId: string,
    dto: CreateBlogCommentDto,
  ): Promise<BlogCommentItem> {
    const blog = await this.prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      throw new NotFoundException('Blog post not found.');
    }

    const comment = await this.prisma.blogComment.create({
      data: {
        blogId,
        authorId,
        body: dto.body.trim(),
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    return {
      id: comment.id,
      blogId: comment.blogId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: this.profilesService.mapUserWithProfileToPublicSummary(comment.author),
    };
  }

  async toggleReaction(
    blogId: string,
    userId: string,
  ): Promise<{ blogId: string; liked: boolean; likesCount: number }> {
    const blog = await this.prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      throw new NotFoundException('Blog post not found.');
    }

    const existing = await this.prisma.blogReaction.findUnique({
      where: {
        blogId_userId: {
          blogId,
          userId,
        },
      },
    });

    let liked = false;
    if (existing) {
      await this.prisma.blogReaction.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await this.prisma.blogReaction.create({
        data: { blogId, userId },
      });
      liked = true;
    }

    const likesCount = await this.prisma.blogReaction.count({
      where: { blogId },
    });

    return { blogId, liked, likesCount };
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
        .slice(0, 60) || 'rider-blog';

    const existing = await this.prisma.blog.findUnique({ where: { slug: base } });
    if (!existing) {
      return base;
    }

    return `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private mapBlogToDto(
    blog: {
      id: string;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
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
  ): BlogPostItem {
    return {
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      tags: blog.tags,
      readTimeMinutes: blog.readTimeMinutes,
      likesCount: blog._count.reactions,
      commentsCount: blog._count.comments,
      isLikedByViewer: hasViewer ? (blog.reactions?.length ?? 0) > 0 : false,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      author: this.profilesService.mapUserWithProfileToPublicSummary(blog.author),
    };
  }

  private async ensureInitialBlogsSeeded(): Promise<void> {
    if (this.seededCheckComplete) {
      return;
    }
    this.seededCheckComplete = true;

    try {
      const count = await this.prisma.blog.count();
      if (count > 0) {
        return;
      }

      const author1 = await this.prisma.user.upsert({
        where: { email: 'kabir.wrench@ridersclub.example' },
        update: {},
        create: {
          email: 'kabir.wrench@ridersclub.example',
          role: UserRole.USER,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'kabir_wrench',
              displayName: 'Kabir Sen',
              bio: '120,000 km across the Himalayas on 2 & 4 wheels',
              city: 'Chandigarh',
            },
          },
        },
      });

      const author2 = await this.prisma.user.upsert({
        where: { email: 'meera.torques@ridersclub.example' },
        update: {},
        create: {
          email: 'meera.torques@ridersclub.example',
          role: UserRole.ADMIN,
          allowDirectMessages: DirectMessagePrivacy.EVERYONE,
          profile: {
            create: {
              username: 'meera_torques',
              displayName: 'Meera Krishnan',
              bio: 'Automotive engineer & track-day coach',
              city: 'Chennai',
            },
          },
        },
      });

      await this.prisma.blog.createMany({
        data: [
          {
            authorId: author1.id,
            slug: 'high-altitude-braking-clutch-care-spiti',
            title: 'High-Altitude Braking & Clutch Care Before a Spiti Circuit',
            excerpt:
              'How DOT 4 boiling points, braided steel lines, and clutch free-play adjustments prevent fade on steep mountain descents.',
            content:
              'Long mountain descents from Kunzum La and Rohtang put extreme thermal loads on your braking system. Old hygroscopic brake fluid absorbs moisture over monsoon months, dropping its wet boiling point dramatically.\n\n1. Flush and bleed with fresh DOT 4 or DOT 5.1 fluid before any high-altitude tour.\n2. Inspect sintered brake pad thickness—ensure at least 3.5mm of friction material remains.\n3. Verify 2–3mm of clutch lever free-play at the perch so slipping the clutch in rocky hairpins does not glaze your friction plates.',
            tags: ['Brakes', 'Touring Prep', 'Safety'],
            readTimeMinutes: 6,
          },
          {
            authorId: author2.id,
            slug: 'pre-purchase-inspection-used-dual-sport-motorcycles',
            title: 'Pre-Purchase Inspection Checklist for Used Dual-Sport Motorcycles',
            excerpt:
              'Inspecting steering head bearings, swingarm play, cold-start compression, and service records before negotiating on the Marketplace.',
            content:
              'Buying a pre-owned adventure or dual-sport motorcycle requires checking components that endure off-road impacts.\n\n1. Ask the seller for a true cold start and listen for cam-chain tensioner rattle.\n2. Lift the front wheel off the ground and check steering stem bearings for center-detent notchiness.\n3. Inspect the lower frame cradle, bash-plate mounts, and wheel rims for flat spots or hairline cracks.\n4. Cross-reference every odometer milestone against workshop invoices.',
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

