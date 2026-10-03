import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(UnauthorizedException, ForbiddenException)
export class AuthRedirectFilter implements ExceptionFilter {
  catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    if (exception instanceof UnauthorizedException) {
      response.redirect('/login');
    } else {
      response.redirect('/');
    }
  }
}
