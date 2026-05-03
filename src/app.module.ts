import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { loadEnv } from './config/env';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { SquadsModule } from './modules/squads/squads.module';
import { TeamsModule } from './modules/teams/teams.module';
import { PrismaModule } from './shared/database/prisma.module';

const env = loadEnv();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        transport:
          env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.refreshToken',
            'res.headers["set-cookie"]',
          ],
          censor: '[REDACTED]',
        },
        customProps: () => ({ service: 'oryx-backend' }),
      },
    }),
    // CLAUDE.md §3.7 — 100 req / 15 min on every public endpoint.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 15 * 60 * 1000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    OperatorsModule,
    EventsModule,
    TeamsModule,
    SquadsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
