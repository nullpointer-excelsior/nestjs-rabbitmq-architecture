# Mono repositorios con Nestjs para una arquitectura distribuida

El siguiente repositorio presenta un ejemplo de microservicios con RabbitMQ 

## Librería Rabbitmq-queue

Esta librería fue diseñada para funcionar con los microservicios de Nestjs y utiliza la estrategia de módulos y contiene las siguientes características:

* `Consumer de Mensajes:` Factory de creación de microservicio Worker 
* `Dead Letter Consumer de mensajes no procesados por error en el consumer:` Factory de creación de microservicio Recovery 
* `Cliente Productor de mensajes:` Servicio Nesjs Injectable importando `RabbitmqModule`

## Despliegue de aplicaciones y pruebas

Este proyecto requiere Node 14 o superior. Si tienes instalado NVM ejecuta lo siguiente:

```bash
nvm use 14;
```
Instalar dependencias

```bash
npm install
```

## Generar aplicaciones mono repo en Nestjs 
si quiere probar creando otra aplicación nestjs dentro del proyecto ejecuta los siguiente

```bash
# generate a new nestjs for a mono repository 
# the aplication will be generated in apps/ directory
nest g app $APP_NAME
# running app
nest start -w $APP_NAME
```
## Levantar RabbitMq

Debes tener instalado docker y ejecutar la siguiente instrucción:

```bash
docker run --rm -it --hostname javel-rabbit -e RABBITMQ_DEFAULT_VHOST=javel -p 15672:15672 -p 5672:5672 rabbitmq:3-management
```

## Configuracíon de Aplicaciones 

Para configurar las aplicaciones que estarán en la misma cola rabbitmq escuchando los eventos introduciré 3 conceptos:
* `Producer:` aplicación encargada de enviar mensajes a una cola
* `Worker:` aplicación encargada de realizar una tarea especifica dependiendo del mensjae. Será quien consuma los mensajes de una cola
* `Recovery:` "Dead Letter Queue" aplicación encargada de consumir mensajes que no pudieron ser procesados por algún error en la aplicación `Worker`


Estas 3 aplicaciones deben compartir una configuración en comúm para que puedan funcionar en conjunto. Y esta es definida por la interface `RabbitmqQueueModuleOptions`

Ejemplo de configuración Base:

```typescript
const options: RabbitmqQueueModuleOptions = {
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
        patterns: ['SEND_MESSAGE'] // dead-letter for specific message pattern
      }
    }
  }

```

También deben compartir la estructura del mensaje que serán enviados a rabbitmq. Esta estructura puede ser definida de acuerdo a tus necesidades.

Ejemplo de una estructura de mensaje
```typescript
interface Data {
    name: string
    message: string
}
```

Ya definida nuestra configuración y estructura de mensaje, Podemos empezar a levantar nuestras aplicaciones

### Iniciar Worker

Para iniciar una aplicaión `Worker` debes ir a tu proyecto Nestjs en este caso sería apps/worker y en el archivo `apps/worker/main.ts` debes invocar la función `createWorkerMicroserviceOptions` el cual devolverá un objeto `ClientProviderOptions` el cual es necesario para iniciar un microservicio de Nestjs

Ejemplo main.ts
```typescript

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
  // Build ClientProviderOptions for Worker Microservice
  const workerMicroservice = await RabbitmqQueueModule.createWorkerMicroserviceOptions(options)
  // Init Microservice
  const app = await NestFactory.createMicroservice(WorkerModule, workerMicroservice);
  
  await app.listen()

}
bootstrap();

```
### Definir Worker controller para obtener mensajes.

Ahora para definir los controladores que consumirán los mensajes es de igual forma, manera que nos indica la documentación de Nestjs. El valor de `MessagePattern` debe coincidir con las configuraciones base si se necesita usar una Dead letter desde la App `Recovery`.

```typescript
@Controller('consumer')
export class ConsumerController {

    @EventPattern('SEND_MESSAGE', Transport.RMQ)    
    consume(@Payload() data: RabbitmqMessage<Data>, @Ctx() context: RmqContext) {
        
        try {
            // Make some operations with message
            context.getChannelRef().ack(context.getMessage())
        } catch (error) {
            Logger.warn(`An error occured with mnessage: ${data.id}`);
              // reject message and set reque = false
              // this will dead letter our message
              context.getChannelRef().reject(context.getMessage(), false);
        }
    }

}
```

Nuestro controlador debe recibir el siguiente `@Payload()`. donde el Tipo Data es nuestra estructura de mensaje definida.

```typescript
@Payload() data: RabbitmqMessage<Data>
```

la interface RabbitmqMessage es la siguiente:
```typescript
interface RabbitmqMessage<T> {
    id: string;
    pattern: string;
    timestamp: Date;
    data: T;
}
```
Nosotros nos debemos preocupar por solo el tipo de data los otros valores son definidos por la librería RabbitmqQueue.


### Iniciar Recovery

Lo mismo para iniciar la aplicaión `Recovery` debes ir a tu proyecto Nestjs en este caso sería apps/recovery y en el archivo `apps/recovery/main.ts` debes invocar la función `createRecoveryMicroserviceOptions` el cual devolverá un objeto `ClientProviderOptions` el cual es necesario para iniciar un microservicio de Nestjs

```typescript
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
```
### Definir Recovery controller para obtener mensajes que no pudieron ser procesados por `Worker`.

Ahora para definir los controladores que consumirán los mensajes fallidos es de igual manera que nos indica la documentación de Nestjs. El valor de MessagePattern debe estar incluido en los valores de `queue.deadLetter.patterns`


```typescript
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
```
### Iniciar Producer 
Para iniciar nuestra aplicación solo debemos hacer un registro del RabbitmqQueueModule proporcionando nuestra configuración base en el módulo Nestjs que necesitemos producir mensajes

```typescript
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

```

Ahora solo debemos injectar nuestro servicio productor de mensajes:

```typescript
import { RabbitmqProducerClient } from '@app/shared/rabbitmq-queue/services/rabbitmq-producer-client.service';

@Injectable()
export class MyService {
  
  constructor(private rabbitmq: RabbitmqProducerClient) { }

}

```
Ahora para enviar mensajes lo hacemos de la siguiente manera

```typescript
 const data: Data = {
    name: 'rabbitmq-message',
    message: 'Simple message for testing'
  }
  const payload = this.rabbitmq.emitTo<Data>('SEND_MESSAGE', data)

```
el metódo `emitTo()` nos devolverá el mensaje que enviará a Rabbitmq

```json
{
  "id": "bb322090-578d-4717-9d12-a38eadbd0311",
  "pattern": "SEND_MESSAGE",
  "timestamp": "2022-11-09T13:18:45.704Z",
  "data": {
    "name": "rabbitmq-message",
    "message": "Simple message for testing"
  }
}
```
Generamos un controlador de pruebas para probar nuestra arquitectura orientada a eventos

```typescript
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

```
Y generamos la siguiente instrucción en curl para realizar la petición:

```bash
curl -s -X POST -d '{"name": "rabbitmq-message","message": "testing message on event architecture"}' -H 'Content-type: application/json' http://localhost:3001/producer | jq
```
Adicional a este comando puedes hacer uso de Make para realizar las siguientes operaciones:



```bash
# start a fucking rabbitmq server
make rabbit
# start worker
make worker
# start recovery
make recovery
# start producer
make producer
# send a request
make produce
# testing dead-letter
make produce; sleep 1; make produce; sleep 1; make produce
```

