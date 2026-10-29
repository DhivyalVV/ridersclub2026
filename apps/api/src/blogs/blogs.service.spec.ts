import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@ridersclub/types';
import { BlogsService } from './blogs.service';

describe('BlogsService', () => {
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

  it('rejects blog update when actor is neither the author nor a moderator/admin', async () => {
    const mockPrisma = {
      blog: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'blog-123',
          authorId: 'author-owner-1',
          content: 'Original content body with enough words.',
        }),
        update: jest.fn(),
      },
    };

    const service = new BlogsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.updateBlog(
        'blog-123',
        { sub: 'other-user-2', role: UserRole.USER },
        { title: 'Unauthorized Edit Attempt' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockPrisma.blog.update).not.toHaveBeenCalled();
  });

  it('allows blog author to update their own blog and recalculates readTimeMinutes', async () => {
    const now = new Date();
    const mockPrisma = {
      blog: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'blog-123',
          authorId: 'author-owner-1',
          content: 'Original content.',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'blog-123',
          slug: 'high-altitude-braking',
          title: 'Updated Title',
          excerpt: 'Updated excerpt for braking guide.',
          content: 'Updated detailed content for mountain descents.',
          tags: ['Brakes', 'Safety'],
          readTimeMinutes: 1,
          createdAt: now,
          updatedAt: now,
          author: {
            id: 'author-owner-1',
            role: UserRole.USER,
            phoneNumber: null,
            allowDirectMessages: 'EVERYONE',
            profile: null,
          },
          _count: { comments: 2, reactions: 5 },
        }),
      },
    };

    const service = new BlogsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const updated = await service.updateBlog(
      'blog-123',
      { sub: 'author-owner-1', role: UserRole.USER },
      { title: 'Updated Title' },
    );

    expect(updated.title).toBe('Updated Title');
    expect(updated.likesCount).toBe(5);
    expect(updated.commentsCount).toBe(2);
  });

  it('toggles blog reaction on and off accurately', async () => {
    const mockPrisma = {
      blog: {
        findUnique: jest.fn().mockResolvedValue({ id: 'blog-123' }),
      },
      blogReaction: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'react-1' }),
        create: jest.fn().mockResolvedValue({ id: 'react-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'react-1' }),
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
      },
    };

    const service = new BlogsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    const firstToggle = await service.toggleReaction('blog-123', 'user-1');
    expect(firstToggle).toEqual({ blogId: 'blog-123', liked: true, likesCount: 1 });

    const secondToggle = await service.toggleReaction('blog-123', 'user-1');
    expect(secondToggle).toEqual({ blogId: 'blog-123', liked: false, likesCount: 0 });
  });

  it('throws NotFoundException when adding a comment to a non-existent blog', async () => {
    const mockPrisma = {
      blog: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new BlogsService(
      mockPrisma as never,
      mockProfilesService as never,
    );

    await expect(
      service.addComment('missing-blog', 'user-1', { body: 'Great writeup!' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

