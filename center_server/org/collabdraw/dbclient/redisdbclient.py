__author__ = 'anand'

import logging
import redis
import json
import config
import traceback
from .dbinterface import DbInterface


class RedisDbClient(DbInterface):
    # redis_client = redis.from_url(config.CENTER_REDIS_URL)

    def __init__(self, url):
        self.logger = logging.getLogger('web')
        self.redis_client = redis.from_url(url)

    def exe_(self, func, *value):
        try:
            ret=func(*value)
            return ret
        except:
            traceback.print_exc()
            return None

    def get(self, key ):
        return self.exe_(self.redis_client.get, key)

    def hget(self, key, key2):
        return self.exe_(self.redis_client.hget, key, key2)

    def hset(self, key, value):
        return self.exe_(self.redis_client.hset, key, value)

    def hgetall(self, key):
        return self.exe_(self.redis_client.hgetall, key)
        # return self.redis_client.hgetall(key)

    def lrem(self, key, count, value):
        return self.exe_(self.execute_command,'lrem',key, count, value)
        # return self.redis_client.execute_command('lrem',key, count, value)

    def rpush(self, key, value):
        return self.exe_(self.redis_client.rpush, key, *value)
        # return self.redis_client.rpush(key, *value)

    def lrange(self, key, start, end):
        value = self.exe_(self.redis_client.lrange, key, start, end)
        # value=self.redis_client.lrange(key, start, end)
        if value:
            return [json.loads(v.decode('utf-8')) for v in value]
        return []

    def delete(self, key):
        self.exe_(self.redis_client.delete, key)
        # self.redis_client.delete(key)
