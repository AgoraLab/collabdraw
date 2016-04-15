import logging
import os
import config
import json
import random
import tornado.web
import time
from ..dbclient.dbclientfactory import DbClientFactory
from .data import CommonData

class EdgeHandler(tornado.web.RequestHandler):
    """
    Http request handler for join request.
    Will be created by tornado-framework evertime there's a join request
    """
    def initialize(self):
        self.logger = logging.getLogger('web')
        self.set_header("Access-Control-Allow-Origin", "*")

    def get(self):
        self.logger.info("get")

    def post(self):
        key = self.get_argument('key', '')
        port = self.get_argument('port', 0)
        load = self.get_argument('load', 0)
        ret={'ret':0}
        if key != 'bestvoip':
            ret['ret']=1
            self.finish(json.dumps(ret))
            return

        remote_ip = self.request.headers.get("X-Real-IP") or self.request.remote_ip
        addr="%s:%s"%(remote_ip, port)
        self.logger.info("register edge %s load:%s"%(addr, str(load)))
        now= time.time()
        CommonData.edge_servers[addr]={'ts':now,'load':int(load),"ip":remote_ip,"port":port}
        ret['redis']=CommonData.edgeRedis
        ret['ip']=remote_ip
        self.finish(json.dumps(ret))
