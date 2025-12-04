import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const redirect =
      typeof request.query.redirect === 'string'
        ? request.query.redirect
        : '/feed';

    const modeParam =
      typeof request.query.mode === 'string' ? request.query.mode : 'login';

    const state = JSON.stringify({ redirect, mode: modeParam });
    return { state };
  }
}
