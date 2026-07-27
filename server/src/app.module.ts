import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from '@/user/user.module';
import { TrainingModule } from '@/training/training.module';

@Module({
  imports: [UserModule, TrainingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
