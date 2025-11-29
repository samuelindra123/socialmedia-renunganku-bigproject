import { Controller, Post, Delete, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowService } from './follow.service';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
    constructor(private followService: FollowService) { }

    @Post(':username')
    followUser(@Request() req, @Param('username') username: string) {
        return this.followService.followUser(req.user.id, username);
    }

    @Delete(':username')
    unfollowUser(@Request() req, @Param('username') username: string) {
        return this.followService.unfollowUser(req.user.id, username);
    }

    @Get(':username/followers')
    getFollowers(
        @Param('username') username: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        return this.followService.getFollowers(username, parseInt(page), parseInt(limit));
    }

    @Get(':username/following')
    getFollowing(
        @Param('username') username: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
    ) {
        return this.followService.getFollowing(username, parseInt(page), parseInt(limit));
    }

    @Get('check/:username')
    checkFollowStatus(@Request() req, @Param('username') username: string) {
        return this.followService.checkFollowStatus(req.user.id, username);
    }

    @Get('stats/:username')
    getFollowStats(@Param('username') username: string) {
        return this.followService.getFollowStats(username);
    }
}
