import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    async createComment(userId: string, postId: string, dto: CreateCommentDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: { author: true },
        });

        if (!post) {
            throw new NotFoundException('Post tidak ditemukan');
        }

        if (dto.parentId) {
            const parentComment = await this.prisma.comment.findUnique({
                where: { id: dto.parentId },
            });

            if (!parentComment || parentComment.postId !== postId) {
                throw new NotFoundException('Parent comment tidak valid');
            }
        }

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content,
                userId,
                postId,
                parentId: dto.parentId,
            },
            include: {
                user: {
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
            },
        });

        if (post.authorId !== userId) {
            await this.prisma.notification.create({
                data: {
                    userId: post.authorId,
                    actorId: userId,
                    type: 'COMMENT',
                    title: 'Komentar Baru',
                    message: 'mengomentari post Anda',
                    actionUrl: `/posts/${postId}`,
                },
            });
        }

        return comment;
    }

    async getPostComments(postId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: {
                    postId,
                    parentId: null,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
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
                    replies: {
                        include: {
                            user: {
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
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                    _count: {
                        select: { replies: true },
                    },
                },
            }),
            this.prisma.comment.count({ where: { postId, parentId: null } }),
        ]);

        return {
            data: comments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateComment(userId: string, commentId: string, dto: UpdateCommentDto) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment tidak ditemukan');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('Tidak punya akses untuk edit comment ini');
        }

        return this.prisma.comment.update({
            where: { id: commentId },
            data: { content: dto.content },
            include: {
                user: {
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
            },
        });
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment tidak ditemukan');
        }

        if (comment.userId !== userId) {
            throw new ForbiddenException('Tidak punya akses untuk delete comment ini');
        }

        await this.prisma.comment.delete({
            where: { id: commentId },
        });

        return { message: 'Comment berhasil dihapus' };
    }
}
