import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ClassesController } from './classes.controller';
import { ExercisesController } from './exercises.controller';
import { InstructorsController } from './instructors.controller';
import { TacticalService } from './tactical.service';
import { UnitsController } from './units.controller';

@Module({
  imports: [AuthModule],
  controllers: [UnitsController, InstructorsController, ClassesController, ExercisesController],
  providers: [TacticalService],
  exports: [TacticalService],
})
export class TacticalModule {}
