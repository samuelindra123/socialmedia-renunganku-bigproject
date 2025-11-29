import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string> = new Map();

  constructor(private jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      client.join(`user:${userId}`);
    } catch (error) {
      this.logger.error('Connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user: ${userId}`);
  }

  broadcastNotification(notification: any) {
    this.server.emit('broadcast', notification);
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(@ConnectedSocket() client: Socket, notificationId: string) {
    const userId = client.data.userId;
    this.logger.log(`User ${userId} marked notification ${notificationId} as read`);
    client.emit('notificationRead', { notificationId });
  }
}
