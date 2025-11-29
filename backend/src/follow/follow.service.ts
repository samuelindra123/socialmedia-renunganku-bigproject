import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
    constructor(private prisma: PrismaService) { }

    async followUser(followerId: string, username: string) {
        const targetProfile = await this.prisma.profile.findUnique({
            where: { username },
            include: { user: true },
        });

        if (!targetProfile) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const followingId = targetProfile.userId;

        if (followerId === followingId) {
            throw new BadRequestException('Tidak bisa follow diri sendiri');
        }

        const existingFollow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });

        if (existingFollow) {
            throw new ConflictException('Sudah follow user ini');
        }

        await this.prisma.follow.create({
            data: { followerId, followingId },
        });

        await this.prisma.notification.create({
            data: {
                userId: followingId,
                actorId: followerId,
                type: 'FOLLOW',
                title: 'Pengikut Baru',
                message: 'mulai mengikuti Anda',
                actionUrl: `/users/${username}`,
            },
        });

        return { message: 'Berhasil follow user' };
    }

    async unfollowUser(followerId: string, username: string) {
        const targetProfile = await this.prisma.profile.findUnique({
            where: { username },
        });

        if (!targetProfile) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const followingId = targetProfile.userId;

        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });

        if (!follow) {
            throw new NotFoundException('Belum follow user ini');
        }

        await this.prisma.follow.delete({
            where: { id: follow.id },
        });

        return { message: 'Berhasil unfollow user' };
    }

    async getFollowers(username: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const profile = await this.prisma.profile.findUnique({
            where: { username },
        });

        if (!profile) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const [followers, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: profile.userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    follower: {
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
            }),
            this.prisma.follow.count({ where: { followingId: profile.userId } }),
        ]);

        return {
            data: followers.map((f) => ({
                user: {
                    id: f.follower.id,
                    username: f.follower.profile?.username,
                    namaLengkap: f.follower.namaLengkap,
                    profileImageUrl: f.follower.profile?.profileImageUrl,
                },
                followedAt: f.createdAt,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFollowing(username: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const profile = await this.prisma.profile.findUnique({
            where: { username },
        });

        if (!profile) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const [following, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: profile.userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    following: {
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
            }),
            this.prisma.follow.count({ where: { followerId: profile.userId } }),
        ]);

        return {
            data: following.map((f) => ({
                user: {
                    id: f.following.id,
                    username: f.following.profile?.username,
                    namaLengkap: f.following.namaLengkap,
                    profileImageUrl: f.following.profile?.profileImageUrl,
                },
                followedAt: f.createdAt,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async checkFollowStatus(followerId: string, username: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { username },
        });

        if (!profile) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: profile.userId,
                },
            },
        });

        return { isFollowing: !!follow };
    }

    async getFollowStats(username: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { username },
        });

        if (!profile) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const [followersCount, followingCount] = await Promise.all([
            this.prisma.follow.count({ where: { followingId: profile.userId } }),
            this.prisma.follow.count({ where: { followerId: profile.userId } }),
        ]);

        return {
            followers: followersCount,
            following: followingCount,
        };
    }
}
