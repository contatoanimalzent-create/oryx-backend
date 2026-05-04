import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { loadEnv } from './config/env';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { PositionsModule } from './modules/positions/positions.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SquadsModule } from './modules/squads/squads.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ZonesModule } from './modules/zones/zones.module';
import { PrismaModule } from './shared/database/prisma.module';
import { RedisModule } from './shared/redis/redis.module';

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
    // BullMQ shares the Redis already provisioned by RedisModule. Each queue
    // is registered by its feature module (PositionsModule -> positions:ingest).
    BullModule.forRoot({ connection: { url: env.REDIS_URL } }),
    PrismaModule,
    RedisModule,
    AuthModule,
    OperatorsModule,
    EventsModule,
    TeamsModule,
    SquadsModule,
    MqttModule,
    PositionsModule,
    RealtimeModule,
    ZonesModule,
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
