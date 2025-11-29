import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    getMyNotifications(
        @Request() req,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        return this.notificationsService.getMyNotifications(
            req.user.id,
            parseInt(page),
            parseInt(limit),
        );
    }

    @Get('unread-count')
    getUnreadCount(@Request() req) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    @Put(':notificationId/read')
    markAsRead(@Request() req, @Param('notificationId') notificationId: string) {
        return this.notificationsService.markAsRead(req.user.id, notificationId);
    }

    @Put('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Delete(':notificationId')
    deleteNotification(@Request() req, @Param('notificationId') notificationId: string) {
        return this.notificationsService.deleteNotification(req.user.id, notificationId);
    }
}
