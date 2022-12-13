import { RabbitmqQueueModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { ProducerController } from './producer.controller';

@Module({
  imports: [
    RabbitmqQueueModule.register({
      credentials: {
        host: 'localhost',
        password: 'guest',
        port: 5672,
        vhost: 'javel',
        user: 'guest'
      },
      queue: {
        name: 'my-queue',
        deadLetter: {
          exchange: 'dlx',
          patterns: ['SEND_MESSAGE']
        }
      }
    })
  ],
  controllers: [ProducerController],
})
export class ProducerModule { }
