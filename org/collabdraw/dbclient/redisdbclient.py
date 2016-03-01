__author__ = 'anand'

import logging

import redis
import json
import config
from .dbinterface import DbInterface


class RedisDbClient(DbInterface):
    redis_client = redis.from_url(config.REDIS_URL)

    def __init__(self):
        self.logger = logging.getLogger('web')

    def set(self, key, value):
        self.redis_client.set(key, value)

    def hset(self, key, value):
        self.redis_client.hset(key, value)

    def hgetall(self, key):
        self.redis_client.hgetall(key)

    def rpush(self, key, value):
        self.redis_client.rpush(key, *value)

    def lrange(self, key, start, end):
        value=self.redis_client.lrange(key, start, end)
        if value:
            return [json.loads(v.decode('utf-8')) for v in value]
        return []

    def get(self, key):
        value = self.redis_client.get(key)
        if value:
            return value.decode('utf-8').replace("'", '"')

    def delete(self, key):
        self.redis_client.delete(key)
