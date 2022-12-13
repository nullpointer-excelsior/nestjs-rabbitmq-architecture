import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext, Transport } from "@nestjs/microservices";
import { RabbitmqMessage } from "@app/shared/rabbitmq-queue/model/RabbitmqMessage";


interface Data {
    name: string
    message: string
}

@Controller('consumer')
export class ConsumerController {

    count = 0 

    sendRandomError(message: RabbitmqMessage<Data>) {
        this.count++
        if (this.count % 3 === 0) {
            throw Error('Throw a random error 😓');
        }
    }

    @EventPattern('SEND_MESSAGE', Transport.RMQ)    
    consume(@Payload() data: RabbitmqMessage<Data>, @Ctx() context: RmqContext) {
        
        try {
            this.sendRandomError(data)
            context.getChannelRef().ack(context.getMessage())
            Logger.log(`Consume pattern 1: ${data.id}`, data)
        } catch (error) {
            Logger.warn(`An error occured with mnessage: ${data.id}`);
              // reject message and set reque = false
              // this will dead letter our message
              context.getChannelRef().reject(context.getMessage(), false);
        }
    }

    @EventPattern('SEND_MESSAGE2', Transport.RMQ)    
    consume2(@Payload() data: RabbitmqMessage<Data>, @Ctx() context: RmqContext) {
        
        try {
            this.sendRandomError(data)
            context.getChannelRef().ack(context.getMessage())
            Logger.log(`Consume pattern 2: ${data.id}`, data)
        } catch (error) {
            Logger.warn(`An error occured with mnessage: ${data.id}`);
              // reject message and set reque = false
              // this will dead letter our message
              context.getChannelRef().reject(context.getMessage(), false);
        }
    }
}