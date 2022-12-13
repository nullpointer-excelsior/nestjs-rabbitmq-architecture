import { NestFactory } from '@nestjs/core';
import { ProducerModule } from './producer.module';

async function bootstrap() {
  const app = await NestFactory.create(ProducerModule, { bufferLogs: true});
  await app.listen(3001)

}
bootstrap();
