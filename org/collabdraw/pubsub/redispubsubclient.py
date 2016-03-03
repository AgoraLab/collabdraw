__author__ = 'anand'

import logging
import threading

import redis
import json
import config
import traceback
from .pubsubinterface import PubSubInterface


# TODOS
## Thread pooling

class RedisPubSubClient(PubSubInterface):

    redis_client = redis.from_url(config.REDIS_URL)

    def __init__(self):
        self.logger = logging.getLogger('web')
        self.pubsub_client = self.redis_client.pubsub()
        self.t=None
        # self.logger.info("Initialized redis pubsub client")

    def subscribe(self, topic, listener):
        if not self.t:
            self.logger.debug("Subscribing to topic %s" % topic)
            self.pubsub_client.subscribe(topic)
            self.t = threading.Thread(target=self._redis_listener, args=(topic, listener, self.pubsub_client))
            self.t.start()

    def numsub(self, topic):
        value=self.redis_client.execute_command('pubsub', 'numsub', topic)
        if value and len(value)==2:
            return value[1]
        return None

    def unsubscribe(self, topic, listener):
        self.logger.debug("Unsubscribing from topic %s" % topic)
        if self.t:
            self.pubsub_client.unsubscribe(topic)
            self.t.join(60)

    def publish(self, topic, message, publisher):
        self.logger.debug("Publishing to topic %s" % topic)
        # TODO If publisher is subscribed to topic
        self.redis_client.publish(topic, message)

    def _redis_listener(self, topic, listener, pubsub_client):
        self.logger.debug("Starting listener thread for topic %s" % topic)
        try:
            for message in pubsub_client.listen():
                self.logger.debug("Sending message to topic %s" % topic)
                if message['type'] == 'message':
                    listener.on_broadcast_message(message['data'].decode('utf-8'))
        except:
            traceback.print_exc()
