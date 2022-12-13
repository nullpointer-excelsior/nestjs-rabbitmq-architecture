import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext, Transport } from "@nestjs/microservices";
import { RabbitmqMessage } from "@app/shared/rabbitmq-queue/model/RabbitmqMessage";

interface Data {
    name: string
    message: string
}

@Controller('dead-letter-queue')
export class DeadLetterController {

    @EventPattern('SEND_MESSAGE', Transport.RMQ)
    async consume1(@Payload() data: RabbitmqMessage<Data>, @Ctx() context: RmqContext) {
        Logger.log('Dead-letter SEND_MESSAGE 1: ', data)
    }

    @EventPattern('SEND_MESSAGE2', Transport.RMQ)
    async consume2(@Payload() data: RabbitmqMessage<Data>, @Ctx() context: RmqContext) {
        Logger.log('Dead-letter SEND_MESSAGE 2: ', data)
    }

}