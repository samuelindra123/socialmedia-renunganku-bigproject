import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getMyProfile(@Request() req) {
    return this.usersService.getMyProfile(req.user.id);
  }

  @Put('profile')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'backgroundImage', maxCount: 1 },
    ]),
  )
  updateProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
    @UploadedFiles()
    files?: {
      profileImage?: Express.Multer.File[];
      backgroundImage?: Express.Multer.File[];
    },
  ) {
    return this.usersService.updateProfile(req.user.id, dto, files);
  }

  @Get('search')
  searchUsers(@Query() dto: SearchUsersDto) {
    return this.usersService.searchUsers(dto);
  }

  @Get(':username')
  getUserByUsername(@Param('username') username: string, @Request() req) {
    return this.usersService.getUserByUsername(username, req.user?.id);
  }
}
