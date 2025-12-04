/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL:
        configService.get<string>('GOOGLE_OAUTH_REDIRECT') ||
        `${configService.get<string>('API_URL')}/auth/google/callback`,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    });
  }

  validate(
    _req: unknown,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        throw new UnauthorizedException('Email Google tidak tersedia');
      }
      const payload = {
        googleId: profile.id,
        email,
        displayName: profile.displayName ?? '',
      };

      done(null, payload);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
