import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserRole } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      phone: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: UserRole;
    },
  ) {
    return this.authService.register(
      body.phone,
      body.password,
      body.firstName,
      body.lastName,
      body.role,
    );
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { phone: string; otpCode: string }) {
    return this.authService.verifyOtp(body.phone, body.otpCode);
  }

  @Post('login')
  login(@Body() body: { phone: string; password: string }) {
    return this.authService.login(body.phone, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }
}
