import { Module } from '@nestjs/common';
import { ConsumerController } from './controllers/consumer.controller';

@Module({
    controllers:[
        ConsumerController
    ]
})
export class QueueModule {}
