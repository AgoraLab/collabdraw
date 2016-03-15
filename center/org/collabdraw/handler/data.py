import config
import json
import random
import tornado.web
import time
import redis

from ..dbclient.dbclientfactory import DbClientFactory
from ..dbclient.mysqlclient import MysqlClientVendor

class CommonData(object):
    """
    Http request handler for join request.
    Will be created by tornado-framework evertime there's a join request
    """
    mysqlClient = MysqlClientVendor()
    redisClient=None
    allRedisClients=[]
    allocEdges={}
    edgeRedis=config.EDGE_REDIS_URL
    edgeRedisUpdateTs=time.time()
    edge_servers={}

    def isEdgeServerValid(addr):
        now=time.time()
        if addr in CommonData.edge_servers :
            if now-CommonData.edge_servers[addr]['ts'] <= 10 and \
                CommonData.edge_servers[addr]['load']<200:
                return True
        return False

    def loadEdgeRedisServers():
        servers=CommonData.redisClient['client'].hgetall("global:edgeRedisServer")
        if servers:
            CommonData.edgeRedis={}
            CommonData.edgeRedisUpdateTs=time.time()
            for k,v in servers.items():
                k=str(k, encoding = "utf-8")
                v=str(v, encoding = "utf-8")
                CommonData.edgeRedis[k]=v

    def init():
        CommonData.allRedisClients=[]
        for url in config.CENTER_REDIS_URL:
            CommonData.allRedisClients.append({'client':DbClientFactory.getDbClient(config.DB_CLIENT_TYPE, url), 'url':url, 'status':0})
        CommonData.redisClient=CommonData.allRedisClients[0]
        CommonData.loadEdgeRedisServers()

    def redis_keep_alive():
        for x in CommonData.allRedisClients:
            try:
                x['client'].get('a')  # getting None returns None or throws an exception
                x['status']=0
            except (redis.exceptions.ConnectionError):
                x['status']=1
        if CommonData.redisClient['status'] > 10:
            for x in CommonData.allRedisClients:
                if x['status'] == 0:
                    CommonData.redisClient=x
