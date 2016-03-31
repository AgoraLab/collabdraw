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

COOKIE_EXPIRED_SECONDS=3600

MODE_MEETING='1'
MODE_PPT='0'
class JoinHandler(tornado.web.RequestHandler):
    """
    Http request handler for join request.
    Will be created by tornado-framework evertime there's a join request
    """
    mysqlClient = MysqlClientVendor()
    cookies={}
    def clear_expired_cookies():
        now = time.time()
        l = [sid for sid, v in JoinHandler.cookies.items() if  v['expiredTs'] <= now]
        # logging.getLogger('websocket').debug("clear_expired_cookies %s"%l)
        for sid in l:
            del JoinHandler.cookies[sid]

    def get_cookie(sid):
        now=time.time()
        if sid in JoinHandler.cookies and now < JoinHandler.cookies[sid]['expiredTs']:
            return  JoinHandler.cookies[sid]
        return None


    def initialize(self):
        self.logger = logging.getLogger('web')
        self.set_header("Access-Control-Allow-Origin", "*")

    def onSdkJoinChannelReq(self, key, cname, uinfo, vid, redis):
        self.logger.debug('http request get: key %s cname %s uinfo %s' % (key, cname, uinfo))
        code = self.checkLoginRequest(key, cname, vid, redis)
        uid = self.generateUid(key, cname, uinfo)
        login_id = key+":"+cname+":"+uinfo
        sid=str(hash(login_id))
        res = {'code': code, 'cname': cname, 'uid': uid, 'sid':sid}
        return res

    # return [ErrorCode, VendorID]
    def checkLoginRequest(self, key, cname, vid, redis):
        if vid == '' :
            return INVALID_VENDOR_KEY
        if redis not in config.EDGE_REDIS_URL.keys():
            return INVALID_REDIS
        return OK_CODE
        if (len(key) == 0 or len(key) > 128):
            return INVALID_CHANNEL_NAME, -1
        if (len(key) == STATIC_KEY_LENGTH):
            return self.checkStaticVendorKey(key)
        if (len(key) == DYNAMIC_KEY_LENGTH):
            return self.checkDynamicVendorKey(key, cname)
        self.logger.warn('invalid vendor key %s with size %u' % (key, len(key)))
        return INVALID_VENDOR_KEY, -1

    def checkStaticVendorKey(self, staticKeyString):
        if not staticKeyString in JoinHandler.mysqlClient.vendorKeys:
            self.logger.warn('invalid login: fail to find static vendor key %s' % staticKeyString)
            return INVALID_VENDOR_KEY, -1

        vid = JoinHandler.mysqlClient.vendorKeys[staticKeyString]
        if not vid in JoinHandler.mysqlClient.vendorInfos:
            self.logger.warn('invalid login: fail to find vendor info for vendor %u' % vid)
            return INTERNAL_ERROR, -1

        vinfo = JoinHandler.mysqlClient.vendorInfos[vid]
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

    def generateUid(self, key, cname, uinfo):
        # TODO:
        # I'm not sure if we should generate the consistent uid matched with uinfo if it's not empty
        return random.randrange(1000000)

    def get(self):
        key = self.get_argument('key', '')
        cname = self.get_argument('cname', '')
        uinfo = self.get_argument('uinfo', '')
        vid = self.get_argument('vid', '')
        redis = str(self.get_argument('redis', ''))
        mode = str(self.get_argument('mode', MODE_PPT))
        host = str(self.get_argument('host', '0'))
        ret = self.onSdkJoinChannelReq(key, cname, uinfo, vid, redis)
        self.logger.info("join %s %s %s"%(cname, mode, host))
        self.finish(ret)
        if ret['code'] == OK_CODE:
            self.set_secure_cookie("loginId", ret['sid'])
            JoinHandler.cookies[ret['sid']]={'room':cname,
                                             'expiredTs':time.time() + COOKIE_EXPIRED_SECONDS,
                                             'vid':vid,
                                             'sid':ret['sid'],
                                             'host':host,
                                             'mode':mode,
                                             'redis':config.EDGE_REDIS_URL[redis]
                                             }


    def post(self):
        pass
        # key = self.get_argument('key', '')
        # cname = self.get_argument('cname', '')
        # uinfo = self.get_argument('uinfo', '')
        # ret = self.onSdkJoinChannelReq(key, cname, uinfo)
        # self.finish(ret)
        # if ret['code'] == OK_CODE:
        #     self.set_secure_cookie("loginId", ret['sid'])
        #     JoinHandler.cookies[ret['sid']]={'room':cname, 'expiredTs':time.time() + COOKIE_EXPIRED_SECONDS, 'vid':vid, 'sid':ret['sid']}
