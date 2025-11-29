import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SpacesModule } from './spaces/spaces.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { FollowModule } from './follow/follow.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeedModule } from './feed/feed.module';
import { StoriesModule } from './stories/stories.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MailModule,
    OnboardingModule,
    SpacesModule,
    UsersModule,
    PostsModule,
    BookmarksModule,
    LikesModule,
    CommentsModule,
    FollowModule,
    NotificationsModule,
    FeedModule,
    StoriesModule,
    MessagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
