import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { MISSION_PROGRESS_QUEUE_NAME } from '../mission-engine/dto/mission-engine.dto';
import { AuthModule } from '../auth/auth.module';
import { POSITIONS_QUEUE_NAME } from './dto/positions.dto';
import { PositionsController } from './positions.controller';
import { PositionsProcessor } from './positions.processor';
import { PositionsService } from './positions.service';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue(
      { name: POSITIONS_QUEUE_NAME },
      // Producer-side registration: PositionsProcessor injects this Queue at
      // the end of process() to fan a job to mission-engine. The actual
      // worker (consumer) lives in MissionEngineModule.
      { name: MISSION_PROGRESS_QUEUE_NAME },
    ),
  ],
  controllers: [PositionsController],
  providers: [PositionsService, PositionsProcessor],
  exports: [PositionsService],
})
export class PositionsModule {}
