import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async getMyNotifications(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
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
            this.prisma.notification.count({ where: { userId } }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                unreadCount,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async markAsRead(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification || notification.userId !== userId) {
            throw new Error('Notification tidak ditemukan');
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        return { message: 'Semua notifikasi telah dibaca' };
    }

    async deleteNotification(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification || notification.userId !== userId) {
            throw new Error('Notification tidak ditemukan');
        }

        await this.prisma.notification.delete({
            where: { id: notificationId },
        });

        return { message: 'Notifikasi dihapus' };
    }

    async getUnreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });

        return { unreadCount: count };
    }
}
