import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { extractHashtags, extractMentions } from '../common/utils/hashtag-parser';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async createPost(userId: string, dto: CreatePostDto, files?: Express.Multer.File[]) {
    // Extract hashtags & mentions
    const hashtagNames = extractHashtags(dto.content);
    const mentionUsernames = extractMentions(dto.content);

    // Upload images first if provided
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await this.spacesService.uploadFile(file, 'posts');
        imageUrls.push(url);
      }
    }

    // Create post with transaction
    const post = await this.prisma.$transaction(async (tx) => {
      // Create post
      const newPost = await tx.post.create({
        data: {
          content: dto.content,
          authorId: userId,
          images: {
            create: imageUrls.map((url) => ({ url })),
          },
        },
      });

      // Handle hashtags
      if (hashtagNames.length > 0) {
        for (const tagName of hashtagNames) {
          // Find or create hashtag
          const hashtag = await tx.hashtag.upsert({
            where: { name: tagName },
            update: { postCount: { increment: 1 } },
            create: { name: tagName, postCount: 1 },
          });

          // Link to post
          await tx.postHashtag.create({
            data: {
              postId: newPost.id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      // Handle mentions
      if (mentionUsernames.length > 0) {
        for (const username of mentionUsernames) {
          const profile = await tx.profile.findUnique({
            where: { username },
            select: { userId: true },
          });

          if (profile) {
            await tx.mention.create({
              data: {
                postId: newPost.id,
                userId: profile.userId,
              },
            });
          }
        }
      }

      return newPost;
    });

    return this.getPostById(post.id);
  }

    async getFeed(dto: GetFeedDto) {
        const { page = 1, limit = 10, userId } = dto;
        const skip = (page - 1) * limit;

        const whereClause = userId ? { authorId: userId } : {};

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            namaLengkap: true,
                            profile: {
                                select: {
                                    username: true,
                                    profileImageUrl: true,
                                },
                            },
                        },
                    },
                    images: {
                        select: {
                            id: true,
                            url: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.post.count({ where: whereClause }),
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPostById(postId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        namaLengkap: true,
                        profile: {
                            select: {
                                username: true,
                                profileImageUrl: true,
                            },
                        },
                    },
                },
                images: {
                    select: {
                        id: true,
                        url: true,
                    },
                },
            },
        });

        if (!post) {
            throw new NotFoundException('Post tidak ditemukan');
        }

        return post;
    }

    async updatePost(postId: string, userId: string, dto: UpdatePostDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post tidak ditemukan');
        }

        if (post.authorId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses untuk mengupdate post ini');
        }

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: {
                content: dto.content || post.content,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        namaLengkap: true,
                        profile: {
                            select: {
                                username: true,
                                profileImageUrl: true,
                            },
                        },
                    },
                },
                images: true,
            },
        });

        return updatedPost;
    }

    async deletePost(postId: string, userId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { images: true },
        });

        if (!post) {
            throw new NotFoundException('Post tidak ditemukan');
        }

        if (post.authorId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus post ini');
        }

        // Delete images from storage
        for (const image of post.images) {
            try {
                await this.spacesService.deleteFile(image.url);
            } catch (error) {
                // Continue even if delete fails
            }
        }

        // Delete post (cascade will delete images from DB)
        await this.prisma.post.delete({
            where: { id: postId },
        });

        return { message: 'Post berhasil dihapus' };
    }

    async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
        return this.getFeed({ userId, page, limit });
    }
}
