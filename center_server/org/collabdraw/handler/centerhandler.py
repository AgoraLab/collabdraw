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
import hmac
from hashlib import sha1
from urllib.parse import quote
import ctypes

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
    return loc.split('	')[0]

def getState(ip):
    loc=IP.find(ip)
    return loc.split('	')[1]


def unsigned_hash(v):
    return ctypes.c_ulong(hash(v)).value

class CenterHandler(tornado.web.RequestHandler):
    """
    Http request handler for join request.
    Will be created by tornado-framework evertime there's a join request
    """

    def getRedisServer(self, vendor_id, cname):
        # key="%d:%s"%(vendor_id ,cname)
        # redis_id=CommonData.redisClient['client'].hget("redis_alloc:%d"%vendor_id, key)
        # if redis_id :
        #     redis_id=str(redis_id,  encoding = "utf-8")
        #     return redis_id
        # else:
        servers = list(CommonData.edgeRedis.keys())
        idx = unsigned_hash(cname) % len(servers)
        ret=servers[idx]
        # CommonData.redisClient['client'].redis_client.hset("redis_alloc:%d"%vendor_id, key, ret)
        return ret

    def getEdgeServer(self, vendor_id, cname):
        servers,servers2=[],[]
        client_country=getCountry(self.request.remote_ip)
        self.logger.info(client_country)
        for addr, info in CommonData.edge_servers.items():
            if  CommonData.isEdgeServerValid(addr):
                server_country=getCountry(info['ip'])
                server_state=getState(info['ip'])
                if client_country == "China":
                    if server_country=="China":
                        if server_state != 'Hong Kong':
                            servers.insert(-1,addr)
                        else:
                            servers.append(addr)
                elif client_country == "United States":
                    if server_country == client_country:
                        servers.append(addr)
                else:
                    if server_state == 'Hong Kong':
                        servers.append(addr)
                servers2.append(addr)
        if len(servers) == 0:
            servers=servers2
        self.logger.info("allocEdges:%s"%servers)
        if len(servers)>0:
            return servers[0]
        return None

    def initialize(self):
        self.logger = logging.getLogger('web')
        self.set_header("Access-Control-Allow-Origin", "*")

    def generateTicket(self ,cname, redis, vid, uinfo):
        content="%s-%s-%s-%s"%(cname, redis, vid, uinfo)
        self.logger.info(content)
        ticket = hmac.new(bytes('agorabestvoip', 'utf-8'), content.encode('utf-8'), sha1).hexdigest()
        self.logger.info(ticket)

        # ticket = unsigned_hash(content)
        return ticket

    def generateUid(self, vid, cname, uinfo):
        if uinfo == '':
            return "%x%x"%(unsigned_hash("%s:%s"%(vid,cname)),int(time.time()*10000000))
        else:
            return uinfo

    def onSdkJoinChannelReq(self, key, cname, uinfo):
        # self.logger.debug('http request get: key %s cname %s uinfo %s' % (key, cname, uinfo))
        code, vid = self.checkLoginRequest(key, cname)
        addr=self.getEdgeServer(vid, cname)
        redis=self.getRedisServer(vid, cname)
        uinfo = self.generateUid(vid, cname, uinfo)
        res = {'code': code, 'server':addr, 'redis':redis, 'vid':vid,'uinfo':uinfo,'ticket': self.generateTicket(cname, redis, vid, uinfo)}
        return res;

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
        uinfo = self.get_argument('uinfo', '')
        ret = self.onSdkJoinChannelReq(key, cname, uinfo)
        self.finish(ret)
        self.logger.info("CenterHandler from %s ret %s"%(self.request.remote_ip,ret))

    def post(self):
        key = self.get_argument('key', '')
        cname = self.get_argument('cname', '')
        uinfo = self.get_argument('uinfo', '')
        ret = self.onSdkJoinChannelReq(key, cname, uinfo)
        self.finish(ret)
        self.logger.info("CenterHandler from %s ret %s"%(self.request.remote_ip,ret))
