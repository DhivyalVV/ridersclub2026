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
  NewsArticleItem,
  NewsCommentItem,
  PaginatedResponse,
} from '@ridersclub/types';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/token.service';
import { CreateNewsCommentDto, CreateNewsDto, UpdateNewsDto } from './dto/news.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List published news articles with pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listNews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<PaginatedResponse<NewsArticleItem>> {
    return this.newsService.listNews({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      viewerId: user?.sub,
    });
  }

  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a single news article with comments and author summary' })
  async getNewsArticle(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: JwtAccessPayload | null,
  ): Promise<NewsArticleItem> {
    return this.newsService.getNewsByIdOrSlug(idOrSlug, user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a new rider news article (admin only)' })
  async createNews(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateNewsDto,
  ): Promise<NewsArticleItem> {
    return this.newsService.createNews(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a news article (admin only)' })
  async updateNews(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: UpdateNewsDto,
  ): Promise<NewsArticleItem> {
    return this.newsService.updateNews(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a news article (admin only)' })
  async deleteNews(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.newsService.deleteNews(id, user);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a news article' })
  async addComment(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateNewsCommentDto,
  ): Promise<NewsCommentItem> {
    return this.newsService.addComment(id, user.sub, dto);
  }

  @Post(':id/reactions/toggle')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like/reaction on a news article' })
  async toggleReaction(
    @Param('id') id: string,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<{ newsId: string; liked: boolean; likesCount: number }> {
    return this.newsService.toggleReaction(id, user.sub);
  }
}
