import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../common/constants';
import { type EnvironmentVariables, NodeEnv } from '../config/env.validation';
import type { User } from '../users/entities/user.entity';
import { AuthDocs } from './auth.docs';
import { Auth, CurrentUser } from './auth.decorators';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@AuthDocs.controller()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuthDocs.login()
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const { user, token } = await this.auth.login(dto);

    const maxAge =
      this.config.get('JWT_EXPIRES_IN_SECONDS', { infer: true }) * 1000;
    res.cookie(ACCESS_TOKEN_COOKIE, token, { ...this.cookieOptions(), maxAge });

    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthDocs.logout()
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
  }

  @Get('me')
  @Auth()
  @AuthDocs.me()
  me(@CurrentUser() user: User): User {
    return user;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure:
        this.config.get('NODE_ENV', { infer: true }) === NodeEnv.Production,
    };
  }
}
