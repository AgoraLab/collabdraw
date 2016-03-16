import logging
import uuid
import config
from os.path import join
import json
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.template as template
from tornado.httputil import url_concat
from tornado.httpclient import AsyncHTTPClient
import time
import socket
import fcntl
import struct
from org.collabdraw.handler.centerhandler import CenterHandler
from org.collabdraw.handler.edgehandler import EdgeHandler
from org.collabdraw.handler.data import CommonData

from org.collabdraw.dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.dbclient.mysqlclient import MysqlClientVendor

FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
logging.basicConfig(format=FORMAT)
logger = logging.getLogger('web')
logger.setLevel(logging.INFO)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            # (r'/realtime/', RealtimeHandler),
            # (r'/upload', UploadHandler),
            # (r'/join', JoinHandler),
            (r'/getEdgeServer', CenterHandler),
            (r'/registerEdgeServer', EdgeHandler),

        ]

        settings = dict(
            auto_reload=True,
            gzip=True,
            # login_url="login.html",
            cookie_secret=str(uuid.uuid4()),
        )

        tornado.web.Application.__init__(self, handlers, **settings)

if __name__ == "__main__":
    if not config.ENABLE_SSL:
        http_server = tornado.httpserver.HTTPServer(Application())
    else:
        http_server = tornado.httpserver.HTTPServer(Application(), ssl_options={
            "certfile": config.SERVER_CERT,
            "keyfile": config.SERVER_KEY,
        })
    CommonData.init()
    MysqlClientVendor.loadVendors()
    logger.info("Listening on port %s" % config.APP_PORT)
    http_server.listen(config.APP_PORT)
    tornado.ioloop.PeriodicCallback(CommonData.loadEdgeRedisServers,60*1000).start()
    tornado.ioloop.PeriodicCallback(MysqlClientVendor.onTimer,60*1000).start()
    tornado.ioloop.PeriodicCallback(CommonData.redis_keep_alive,10*1000).start()
    tornado.ioloop.IOLoop.instance().start()
