import logging
import uuid
import config
from os.path import join
import json
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.template as template
import time
import socket
import fcntl
import struct
from org.collabdraw.handler.websockethandler import RealtimeHandler
from org.collabdraw.handler.uploadhandler import UploadHandler
from org.collabdraw.handler.joinhandler import JoinHandler
from org.collabdraw.handler.centerhandler import CenterHandler
from org.collabdraw.dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.dbclient.mysqlclient import MysqlClient



FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
logging.basicConfig(format=FORMAT)
logger = logging.getLogger('web')
logger.setLevel(logging.INFO)

# class IndexHandler(tornado.web.RequestHandler):
#     def initialize(self):
#         self.set_header("Access-Control-Allow-Origin", "*")
#
#     def get_current_user(self):
#         if not config.DEMO_MODE:
#             return self.get_secure_cookie("loginId")
#         else:
#             return True
#
#     @tornado.web.authenticated
#     def get(self):
#         loader = template.Loader(config.ROOT_DIR)
#         return_str = loader.load(join(config.HTML_ROOT, "index.html")).generate(app_ip_address=config.APP_IP_ADDRESS,
#                                                         app_port=config.PUBLIC_LISTEN_PORT)
#         self.finish(return_str)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/realtime/', RealtimeHandler),
            (r'/client/(.*)', tornado.web.StaticFileHandler, dict(path=config.RESOURCE_DIR)),
            # (r'/resources/(.*)', tornado.web.StaticFileHandler, dict(path=config.I18N_DIR)),
            (r'/upload', UploadHandler),
            (r'/join', JoinHandler),
            (r'/getEdgeServer', CenterHandler),
        ]

        settings = dict(
            auto_reload=True,
            gzip=True,
            # login_url="login.html",
            cookie_secret=str(uuid.uuid4()),
        )

        tornado.web.Application.__init__(self, handlers, **settings)


def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        return socket.inet_ntoa(fcntl.ioctl(
            s.fileno(),
            0x8915,  # SIOCGIFADDR
            struct.pack('256s', bytes(ifname[:15], encoding='utf-8'))
        )[20:24])
    except:
        return ret

def serverKeepAlive():
    redisClient=DbClientFactory.getDbClient(config.DB_CLIENT_TYPE).redis_client
    now=time.time()+60
    if get_ip_address('eth0'):
        msg={'expiredTs':now, "addr":"%s:%d"%(get_ip_address('eth0'),config.PUBLIC_LISTEN_PORT)}
        redisClient.hset("edgeServer",msg['addr'], json.dumps(msg))

def onTimer():
    JoinHandler.clear_expired_cookies()
    RealtimeHandler.clear_expired_data()
    CenterHandler.loadEdgeServer()
    MysqlClient.loadVendors()
    serverKeepAlive()

if __name__ == "__main__":
    if not config.ENABLE_SSL:
        http_server = tornado.httpserver.HTTPServer(Application())
    else:
        http_server = tornado.httpserver.HTTPServer(Application(), ssl_options={
            "certfile": config.SERVER_CERT,
            "keyfile": config.SERVER_KEY,
        })

    serverKeepAlive()
    CenterHandler.loadEdgeServer()

    logger.info("Listening on port %s" % config.APP_PORT)
    http_server.listen(config.APP_PORT)

    tornado.ioloop.PeriodicCallback(onTimer,60*1000).start()
    tornado.ioloop.IOLoop.instance().start()
