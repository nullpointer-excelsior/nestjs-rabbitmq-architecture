import { RabbitmqQueueModule } from '@app/shared';
import { NestFactory } from '@nestjs/core';
import { RecoveryModule } from './recovery.module';

async function bootstrap() {

  const options = {
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
  }

  const microservice = await RabbitmqQueueModule.createRecoveryMicroserviceOptions(options)
  const app = await NestFactory.createMicroservice(RecoveryModule, microservice);
  app.listen()
  
}
bootstrap();
