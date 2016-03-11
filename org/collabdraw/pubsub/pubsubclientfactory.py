__author__ = 'anand'

import logging

from .redispubsubclient import RedisPubSubClient
from .pubsubclienttypes import PubSubClientTypes
from .pubsubinterface import PubSubInterface


class PubSubClientFactory:
    @staticmethod
    def getPubSubClient(pubsub_client_type_str, db):
        """
        @param pubsub_client_type_str:
        @rtype : PubSubInterface
        """
        logger = logging.getLogger('websocket')
        logger.debug("Initializing with pubsub client type %s" % pubsub_client_type_str)
        if pubsub_client_type_str == PubSubClientTypes.redis:
            return RedisPubSubClient(db)
        else:
            raise RuntimeError("Unknown pubsub type %s" % pubsub_client_type_str)
