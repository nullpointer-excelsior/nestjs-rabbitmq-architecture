
rabbitmq: clear
	docker run --rm -it --hostname javel-rabbit -e RABBITMQ_DEFAULT_VHOST=javel -p 15672:15672 -p 5672:5672 rabbitmq:3-management

worker:
	nest start -w worker

recovery:
	nest start -w recovery

producer:
	nest start -w producer

produce: clear
	curl -s -X POST -d '{"name": "rabbitmq-message","message": "testing message on event architecture"}' -H 'Content-type: application/json' http://localhost:3001/producer | jq

clear:
	clear
