import { Body, Controller, Logger, Post } from '@nestjs/common';
import { RabbitmqProducerClient } from '@app/shared/rabbitmq-queue/services/rabbitmq-producer-client.service';

interface Data {
  name: string
  message: string
}

@Controller('producer')
export class ProducerController {

  constructor(private rabbitmq: RabbitmqProducerClient) { }


  @Post()
  emitMessage(@Body() data: any) {

    const payload = this.rabbitmq.emitTo<Data>('SEND_MESSAGE2', data)
    Logger.log(`Producer: message sent ${payload.id}`)

    return {
      message: 'OK',
      messageSent: payload
    }
  }
}
