import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly userRooms = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      client.data.userId = userId;
      client.join(`user:${userId}`);
      const rooms = this.userRooms.get(userId) ?? new Set<string>();
      rooms.add(client.id);
      this.userRooms.set(userId, rooms);

      this.logger.log(
        `Messages socket connected ${client.id} (user: ${userId})`,
      );
    } catch (error) {
      this.logger.error('Messages gateway connection error', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }

    const rooms = this.userRooms.get(userId);
    if (rooms) {
      rooms.delete(client.id);
      if (rooms.size === 0) {
        this.userRooms.delete(userId);
      } else {
        this.userRooms.set(userId, rooms);
      }
    }

    this.logger.log(
      `Messages socket disconnected ${client.id} (user: ${userId})`,
    );
  }

  emitMessageToUser(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('message:new', payload);
  }
}
