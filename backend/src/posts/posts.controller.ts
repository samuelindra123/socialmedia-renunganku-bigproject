import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private postsService: PostsService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
    createPost(
        @Request() req,
        @Body() dto: CreatePostDto,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        return this.postsService.createPost(req.user.id, dto, files);
    }

    @Get('feed')
    getFeed(@Query() dto: GetFeedDto) {
        return this.postsService.getFeed(dto);
    }

    @Get('user/:userId')
    getUserPosts(
        @Param('userId') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.postsService.getUserPosts(userId, page, limit);
    }

    @Get(':postId')
    getPostById(@Param('postId') postId: string) {
        return this.postsService.getPostById(postId);
    }

    @Put(':postId')
    updatePost(
        @Param('postId') postId: string,
        @Request() req,
        @Body() dto: UpdatePostDto,
    ) {
        return this.postsService.updatePost(postId, req.user.id, dto);
    }

    @Delete(':postId')
    deletePost(@Param('postId') postId: string, @Request() req) {
        return this.postsService.deletePost(postId, req.user.id);
    }
}
