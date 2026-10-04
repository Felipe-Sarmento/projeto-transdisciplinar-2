import { Body, Controller, Get, Post, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LoginDto } from '../common/dto/login.dto';
import { RegisterDto } from '../common/dto/register.dto';
import { AuthService } from '../models/auth.service';

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE = 30 * 60 * 1000;

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('auth/login')
  showLogin(): { title: string } {
    return { title: 'Entrar' };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() response: Response): Promise<void> {
    const user = await this.authService.validateUser(dto.email, dto.password);

    if (user === null) {
      response.status(401).render('auth/login', {
        title: 'Entrar',
        error: 'E-mail ou senha inválidos.',
      });
      return;
    }

    this.setSession(response, await this.authService.signToken(user));
    response.redirect(user.role === 'ADMIN' ? '/admin' : '/');
  }

  @Get('cadastro')
  @Render('auth/register')
  showRegister(): { title: string } {
    return { title: 'Criar conta' };
  }

  @Post('cadastro')
  async register(
    @Body() dto: RegisterDto,
    @Res() response: Response,
  ): Promise<void> {
    const user = await this.authService.register(
      dto.name,
      dto.email,
      dto.password,
    );

    if (user === null) {
      response.status(409).render('auth/register', {
        title: 'Criar conta',
        error: 'Este e-mail já está cadastrado.',
      });
      return;
    }

    this.setSession(response, await this.authService.signToken(user));
    response.redirect('/');
  }

  @Post('logout')
  logout(@Res() response: Response): void {
    response.clearCookie(COOKIE_NAME);
    response.redirect('/login');
  }

  private setSession(response: Response, token: string): void {
    response.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });
  }
}
