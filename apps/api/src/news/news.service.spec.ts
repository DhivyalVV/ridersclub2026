import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@ridersclub/types';
import { NewsService } from './news.service';

describe('NewsService', () => {
  const mockProfilesService = {
    mapUserWithProfileToPublicSummary: jest.fn((user: { id: string; role: string }) => ({
      id: user.id,
      displayName: 'Test Rider',
      username: 'test_rider',
      avatarUrl: null,
      bio: null,
      city: 'Bengaluru',
      role: user.role as UserRole,
      canReceiveDirectMessage: true,
    })),
  };

  it('rejects news creation and update when actor is not an ADMIN', async () => {
    const mockPrisma = {
      newsArticle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'news-123',
          authorId: 'author-owner-1',
          content: 'Original content body with enough words.',
        }),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const service = new NewsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.createNews(
        { sub: 'normal-user-1', role: UserRole.USER },
        {
          title: 'Unauthorized News Post',
          excerpt: 'Normal user should not be able to publish news',
          content: 'Detailed body content.',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.updateNews(
        'news-123',
        { sub: 'other-user-2', role: UserRole.USER },
        { title: 'Unauthorized Edit Attempt' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockPrisma.newsArticle.create).not.toHaveBeenCalled();
    expect(mockPrisma.newsArticle.update).not.toHaveBeenCalled();
  });

  it('allows ADMIN to create and update news with header imageUrl and recalculates readTimeMinutes', async () => {
    const now = new Date();
    const mockPrisma = {
      newsArticle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'news-123',
          authorId: 'admin-owner-1',
          content: 'Original content.',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'news-123',
          slug: 'high-altitude-braking',
          title: 'Updated Title',
          excerpt: 'Updated excerpt for braking guide.',
          content: 'Updated detailed content for mountain descents.',
          imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
          tags: ['Brakes', 'Safety'],
          readTimeMinutes: 1,
          createdAt: now,
          updatedAt: now,
          author: {
            id: 'admin-owner-1',
            role: UserRole.ADMIN,
            phoneNumber: null,
            allowDirectMessages: 'EVERYONE',
            profile: null,
          },
          _count: { comments: 2, reactions: 5 },
        }),
      },
    };

    const service = new NewsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const updated = await service.updateNews(
      'news-123',
      { sub: 'admin-owner-1', role: UserRole.ADMIN },
      {
        title: 'Updated Title',
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      },
    );

    expect(updated.title).toBe('Updated Title');
    expect(updated.imageUrl).toBe('https://images.unsplash.com/photo-1558981403-c5f9899a28bc');
    expect(updated.likesCount).toBe(5);
    expect(updated.commentsCount).toBe(2);
  });

  it('toggles news reaction on and off accurately', async () => {
    const mockPrisma = {
      newsArticle: {
        findUnique: jest.fn().mockResolvedValue({ id: 'news-123' }),
      },
      newsReaction: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'react-1' }),
        create: jest.fn().mockResolvedValue({ id: 'react-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'react-1' }),
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
      },
    };

    const service = new NewsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const firstToggle = await service.toggleReaction('news-123', 'user-1');
    expect(firstToggle).toEqual({ newsId: 'news-123', liked: true, likesCount: 1 });

    const secondToggle = await service.toggleReaction('news-123', 'user-1');
    expect(secondToggle).toEqual({ newsId: 'news-123', liked: false, likesCount: 0 });
  });

  it('throws NotFoundException when adding a comment to a non-existent news article', async () => {
    const mockPrisma = {
      newsArticle: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new NewsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.addComment('missing-news', 'user-1', { body: 'Great writeup!' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
