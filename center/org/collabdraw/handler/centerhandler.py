import logging
import os
import config
import json
import random
import tornado.web
import time
import redis
from ..dbclient.dbclientfactory import DbClientFactory
from ..dbclient.mysqlclient import MysqlClientVendor
from .data import CommonData
from .ipip import IP
from enum import Enum

OK_CODE = 0
VOM_SERVICE_UNAVAILABLE = 1
NO_CHANNEL_AVAILABLE_CODE = 2
TOO_MANY_USERS = 4
INVALID_VENDOR_KEY = 5
MASTER_VOCS_UNAVAILABLE = 6

INTERNAL_ERROR = 8
NO_AUTHORIZED = 9
DYNAMIC_KEY_TIMEOUT = 10
NO_ACTIVE_STATUS = 11
TIMEOUT_CODE = -1
CANCELED_CODE = -2

HMAC_LENGTH = 20
SIGNATURE_LENGTH = 40
STATIC_KEY_LENGTH = 32
UNIX_TS_LENGTH = 10
RANDOM_INT_LENGTH = 8
DYNAMIC_KEY_LENGTH = SIGNATURE_LENGTH + STATIC_KEY_LENGTH + UNIX_TS_LENGTH + RANDOM_INT_LENGTH

SIGNATURE_OFFSET = 0
STATIC_KEY_OFFSET = SIGNATURE_LENGTH
UNIX_TS_OFFSET = SIGNATURE_LENGTH+STATIC_KEY_LENGTH
RANDOM_INT_OFFSET = SIGNATURE_LENGTH+STATIC_KEY_LENGTH+UNIX_TS_LENGTH
SIGNATURE_TIMEOUT_SECOND = 300
SIGNATURE_MAX_DEVIATION_SECOND = 300

VENDOR_STATUS_ACTIVE = 1
VENDOR_STATUS_SUSPEND = 2
VENDOR_STATUS_DEPRECATED = 3

COOKIE_EXPIRED_SECONDS=3600

def getCountry(ip):
    loc=IP.find(ip)
    return loc.split('  ')[0]

class CenterHandler(tornado.web.RequestHandler):
    """
    Http request handler for join request.
    Will be created by tornado-framework evertime there's a join request
    """

    def getRedisServer(self, vendor_id, cname):
        key="%d:%s"%(vendor_id ,cname)
        redis_id=CommonData.redisClient['client'].hget("redis_alloc:%d"%vendor_id, key)
        if redis_id :
            redis_id=str(redis_id,  encoding = "utf-8")
            return redis_id
        else:
            servers = list(CommonData.edgeRedis.keys())
            idx = hash(key) % len(servers)
            ret=servers[idx]
            CommonData.redisClient['client'].redis_client.hset("redis_alloc:%d"%vendor_id, key, ret)
            return ret

    def getEdgeServer(self, vendor_id, cname):
        servers,servers2=[],[]
        self.logger.info(self.request.remote_ip)
        client_country=getCountry(self.request.remote_ip)
        for addr, info in CommonData.edge_servers.items():
            if  CommonData.isEdgeServerValid(addr):
                if client_country == getCountry(info['ip']):
                    servers.append(addr)
                else:
                    servers2.append(addr)
        servers.extend(servers2)
        if len(servers)>0:
            return servers[0]
        return None

    def initialize(self):
        self.logger = logging.getLogger('web')
        self.set_header("Access-Control-Allow-Origin", "*")

    def onSdkJoinChannelReq(self, key, cname, uinfo=None):
        self.logger.debug('http request get: key %s cname %s uinfo %s' % (key, cname, uinfo))
        code, vid = self.checkLoginRequest(key, cname)
        addr=self.getEdgeServer(vid, cname)
        redis=self.getRedisServer(vid, cname)
        res = {'code': code, 'server':addr, 'redis':redis, 'vid':vid}
        return res, vid;

    # return [ErrorCode, VendorID]
    def checkLoginRequest(self, key, cname):
        if (len(key) == 0 or len(key) > 128):
            return INVALID_CHANNEL_NAME, -1
        if (len(key) == STATIC_KEY_LENGTH):
            return self.checkStaticVendorKey(key)
        if (len(key) == DYNAMIC_KEY_LENGTH):
            return self.checkDynamicVendorKey(key, cname)

        self.logger.warn('invalid vendor key %s with size %u' % (key, len(key)))
        return INVALID_VENDOR_KEY, -1

    def checkStaticVendorKey(self, staticKeyString):
        vendorInfos=CommonData.mysqlClient.getVendorInfos()
        vendorKeys=CommonData.mysqlClient.getVendorKeys()
        # self.logger.info(vendorInfos)
        if not staticKeyString in vendorKeys:
            self.logger.warn('invalid login: fail to find static vendor key %s' % staticKeyString)
            return INVALID_VENDOR_KEY, -1

        vid = vendorKeys[staticKeyString]
        if not vid in vendorInfos:
            self.logger.warn('invalid login: fail to find vendor info for vendor %u' % vid)
            return INTERNAL_ERROR, -1
        vinfo = vendorInfos[vid]
        if (len(vinfo['signkey']) > 0):
            self.logger.warn('invalid login: dynamic key is expected for vendor %u' % vid)
            return NO_AUTHORIZED, -1
        if (vinfo['status'] != VENDOR_STATUS_ACTIVE):
            self.logger.warn('invalid login: status %u found for vendor %u' % (vinfo['status'], vid))
            return NO_ACTIVE_STATUS, -1

        self.logger.info('login succeed. static key %s vid %u ' % (staticKeyString, vid))
        return OK_CODE, vid

    def checkDynamicVendorKey(self, key, cname):
        return -100, -1

    def get(self):
        key = self.get_argument('key', '')
        cname = self.get_argument('cname', '')
        ret, vid = self.onSdkJoinChannelReq(key, cname)
        self.finish(ret)
        self.logger.info(ret)

    def post(self):
        key = self.get_argument('key', '')
        cname = self.get_argument('cname', '')
        ret = self.onSdkJoinChannelReq(key, cname)
        self.finish(ret)
