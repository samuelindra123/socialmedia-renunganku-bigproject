import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Get('verify-email')
  verifyEmailByLink(@Query('token') token: string) {
    return this.authService.verifyEmailByLink(token);
  }

  @Public()
  @Post('verify-otp/:userId')
  verifyEmailByOtp(@Param('userId') userId: string, @Body() dto: VerifyOtpDto) {
    return this.authService.verifyEmailByOtp(userId, dto.otp);
  }

  @Public()
  @Post('resend-verification')
  resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
