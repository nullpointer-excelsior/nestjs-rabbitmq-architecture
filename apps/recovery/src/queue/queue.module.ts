import { Module } from '@nestjs/common';
import { DeadLetterController } from './controllers/dead-letter.controller';

@Module({
    controllers: [
        DeadLetterController
    ]
})
export class QueueModule {}
