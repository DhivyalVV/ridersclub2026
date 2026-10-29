import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type {
  BlogCommentItem,
  BlogPostItem,
  PaginatedResponse,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import { BlogsService } from './blogs.service';
import { CreateBlogCommentDto, CreateBlogDto, UpdateBlogDto } from './dto/blog.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List and search published rider blogs with pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listBlogs(
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<PaginatedResponse<BlogPostItem>> {
    return this.blogsService.listBlogs({
      search,
      tag,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      viewerId: user?.sub,
    });
  }

  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a single blog post with comments and author summary' })
  async getBlog(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<BlogPostItem> {
    return this.blogsService.getBlogByIdOrSlug(idOrSlug, user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a new rider blog post' })
  async createBlog(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateBlogDto,
  ): Promise<BlogPostItem> {
    return this.blogsService.createBlog(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a blog post (author or moderator/admin only)' })
  async updateBlog(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateBlogDto,
  ): Promise<BlogPostItem> {
    return this.blogsService.updateBlog(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a blog post (author or moderator/admin only)' })
  async deleteBlog(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.blogsService.deleteBlog(id, user);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a blog post' })
  async addComment(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateBlogCommentDto,
  ): Promise<BlogCommentItem> {
    return this.blogsService.addComment(id, user.sub, dto);
  }

  @Post(':id/reactions/toggle')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like/reaction on a blog post' })
  async toggleReaction(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ blogId: string; liked: boolean; likesCount: number }> {
    return this.blogsService.toggleReaction(id, user.sub);
  }
}

