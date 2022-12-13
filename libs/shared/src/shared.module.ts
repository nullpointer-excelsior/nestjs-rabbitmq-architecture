import { Module } from '@nestjs/common';
import { RabbitmqQueueModule } from './rabbitmq-queue/rabbitmq-queue.module';

@Module({
  imports: [
    RabbitmqQueueModule
  ],
})
export class SharedModule {}
