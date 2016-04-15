import logging
import os
import config
import json
import random
import tornado.web
import time
from ..dbclient.dbclientfactory import DbClientFactory
from ..dbclient.mysqlclient import MysqlClientVendor
from ..tools.tools import hash_password
from enum import Enum
import ctypes
import hmac
from hashlib import sha1
OK_CODE = 0
VOM_SERVICE_UNAVAILABLE = 1
NO_CHANNEL_AVAILABLE_CODE = 2
TOO_MANY_USERS = 4
INVALID_VENDOR_KEY = 5
MASTER_VOCS_UNAVAILABLE = 6
INVALID_CHANNEL_NAME = 7
INTERNAL_ERROR = 8
NO_AUTHORIZED = 9
DYNAMIC_KEY_TIMEOUT = 10
NO_ACTIVE_STATUS = 11
INVALID_REDIS=12
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

COOKIE_EXPIRED_SECONDS=3600*5

MODE_MEETING='1'
MODE_PPT='0'

def unsigned_hash(v):
    return ctypes.c_ulong(hash(v)).value

class JoinHandler(tornado.web.RequestHandler):
    """
    Http request handler for join request.
    Will be created by tornado-framework evertime there's a join request
    """
    mysqlClient = MysqlClientVendor()
    cookies={}
    def clear_expired_cookies():
        now = time.time()
        l = [ticket for ticket, v in JoinHandler.cookies.items() if  v['expiredTs'] <= now]
        # logging.getLogger('websocket').debug("clear_expired_cookies %s"%l)
        for ticket in l:
            del JoinHandler.cookies[ticket]

    def get_cookie(ticket):
        now=time.time()
        if ticket in JoinHandler.cookies and now < JoinHandler.cookies[ticket]['expiredTs']:
            return  JoinHandler.cookies[ticket]
        return None


    def initialize(self):
        self.logger = logging.getLogger('web')
        self.set_header("Access-Control-Allow-Origin", "*")

    def generateTicket(self, cname, redis, vid, uinfo):
        content="%s-%s-%s-%s"%(cname, redis, vid, uinfo)
        self.logger.info(content)
        ticket = hmac.new(bytes('agorabestvoip', 'utf-8'), content.encode('utf-8'), sha1).hexdigest()
        self.logger.info(ticket)

        return ticket

    def onSdkJoinChannelReq(self, cname, uinfo, vid, redis, ticket):
        code = self.checkLoginRequest(cname, vid, redis, uinfo, ticket)
        res = {'code': code, 'cname': cname}
        return res

    # return [ErrorCode, VendorID]
    def checkLoginRequest(self,  cname, vid, redis, uinfo, ticket):
        if vid == '' :
            return INVALID_VENDOR_KEY

        if redis not in config.EDGE_REDIS_URL.keys():
            return INVALID_REDIS

        tk=self.generateTicket(cname, redis, vid, uinfo)
        if ticket != tk:
            self.logger.error("ticket error from_center:%s edge-server:%s"%(ticket ,tk))
            return NO_AUTHORIZED

        return OK_CODE

    # def generateticket(self, vid, cname):
    #     return "%.8x%x"%(unsigned_hash("%s:%s:%s:%s"%(vid,cname,config.APP_IP_ADDRESS,config.APP_PORT)),id(self))

    def generateUid(self, vid, cname, uinfo):
        if uinfo == '':
            return self.generateticket(vid, cname)
        return uinfo

    def get(self):
        # key = self.get_argument('key', '')
        cname = self.get_argument('cname', '')
        uinfo = self.get_argument('uinfo', '')
        vid = self.get_argument('vid', '')
        ticket = self.get_argument('ticket', '')
        expiredTs = self.get_argument('expired', time.time() + COOKIE_EXPIRED_SECONDS)
        redis = str(self.get_argument('redis', ''))
        mode = str(self.get_argument('mode', MODE_PPT))
        role = str(self.get_argument('role', 'guest'))
        ret = self.onSdkJoinChannelReq(cname, uinfo, vid, redis, ticket)
        self.logger.info(self.request.body)
        self.finish(ret)
        self.logger.info("[%d] JoinHandler from %s ret:%s"%(id(self), self.request.remote_ip, ret))
        if ret['code'] == OK_CODE:
            key="%s:%s:%s"%(vid,cname,uinfo)
            JoinHandler.cookies[key]={'room':cname,
                                     'expiredTs':expiredTs,
                                     'vid':vid,
                                     'host':1 if role == 'host' else 0,
                                     'mode':mode,
                                     'redis':config.EDGE_REDIS_URL[redis]
                                     }
    def post(self):
        pass
