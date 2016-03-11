__author__ = 'anand'

import logging
from .redisdbclient import RedisDbClient
from .dbclienttypes import DbClientTypes
from .dbinterface import DbInterface

class DbClientFactory:
    redis_clients={}

    @staticmethod
    def getDbClient(db_client_type_str, url):
        """
        @param db_client_type_str:
        @rtype : DbInterface
        """
        logger = logging.getLogger('websocket')
        # logger.debug("Initializing with db client type %s" % db_client_type_str)
        if db_client_type_str == DbClientTypes.redis:
            if url not in DbClientFactory.redis_clients:
                DbClientFactory.redis_clients[url]=RedisDbClient(url)
            return DbClientFactory.redis_clients[url]
        # elif db_client_type_str == DbClientTypes.in_memory:
        #     pass
        else:
            raise RuntimeError("Unknown db client type %s" % db_client_type_str)
