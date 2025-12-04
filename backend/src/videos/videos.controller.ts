import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VideosService } from './videos.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ListVideosDto } from './dto/list-videos.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { VideoResponseDto } from './dto/video-response.dto';

@Controller('videos')
@ApiTags('Videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('videos', 5))
  @ApiOperation({
    summary: 'Unggah video dan jalankan proses kompresi di background.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        videos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Job pemrosesan dimasukkan ke antrean.' })
  async uploadVideos(
    @GetUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadVideoDto,
  ) {
    return this.videosService.enqueueUploads(userId, files, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail video milik pengguna.' })
  @ApiOkResponse({ type: VideoResponseDto })
  async getVideo(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.videosService.getVideo(userId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar video dengan pagination.' })
  @ApiOkResponse({ description: 'Daftar video berhasil diambil.' })
  async listVideos(
    @GetUser('id') userId: string,
    @Query() query: ListVideosDto,
  ) {
    return this.videosService.listVideos(userId, query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete video dan hapus aset di storage.' })
  @ApiOkResponse({ description: 'Video berhasil ditandai sebagai terhapus.' })
  async deleteVideo(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.videosService.deleteVideo(userId, id);
  }
}
