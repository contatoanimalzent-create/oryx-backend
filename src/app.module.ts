import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { loadEnv } from './config/env';
import { HealthController } from './health/health.controller';

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
          paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
          censor: '[REDACTED]',
        },
        customProps: () => ({ service: 'oryx-backend' }),
      },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
