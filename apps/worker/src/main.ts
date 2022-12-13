import { RabbitmqQueueModule } from '@app/shared';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

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

  const workerMicroservice = await RabbitmqQueueModule.createWorkerMicroserviceOptions(options)
  const app = await NestFactory.createMicroservice(WorkerModule, workerMicroservice);
  
  await app.listen()

}
bootstrap();
