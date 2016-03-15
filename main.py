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
import urllib
import hmac
import base64
from org.collabdraw.handler.websockethandler import RealtimeHandler
from org.collabdraw.handler.uploadhandler import UploadHandler
from org.collabdraw.handler.joinhandler import JoinHandler
# from org.collabdraw.handler.centerhandler import CenterHandler
from org.collabdraw.dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.dbclient.mysqlclient import MysqlClientVendor

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
            (r'/files/(.*)', tornado.web.StaticFileHandler, dict(path=config.FILES_DIR)),
            (r'/join', JoinHandler),
            (r'/upload', UploadHandler),
            # (r'/getEdgeServer', CenterHandler),
        ]

        settings = dict(
            auto_reload=True,
            gzip=True,
            # login_url="login.html",
            cookie_secret=str(uuid.uuid4()),
        )

        tornado.web.Application.__init__(self, handlers, **settings)


def serverKeepAliveCallBack(response):
    if response.error:
        logger.error(response.error)
    else:
        msg=json.loads(str(bytes.decode(response.body, 'utf-8')))
        if msg["ret"] != 0:
            logger.error('serverKeepAlive return error')
            return
        config.EDGE_REDIS_URL=msg['redis']
        logger.info('update redis %s' , config.EDGE_REDIS_URL)

http_client = AsyncHTTPClient()

def serverKeepAlive():
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    msg={"port":config.PUBLIC_LISTEN_PORT, "load":RealtimeHandler.clientCount(), "key":"bestvoip"}
    body = urllib.parse.urlencode(msg) #Make it into a post request
    try :
        for x in socket.gethostbyname_ex('collabdraw.agoralab.co')[2]:
            url = "http://%s:5555/registerEdgeServer"%(x)
            http_client.fetch(url, serverKeepAliveCallBack, method='POST', headers=headers, body=body)
    except:
        logger.info("gethostbyname error")

if __name__ == "__main__":
    if not config.ENABLE_SSL:
        http_server = tornado.httpserver.HTTPServer(Application())
    else:
        http_server = tornado.httpserver.HTTPServer(Application(), ssl_options={
            "certfile": config.SERVER_CERT,
            "keyfile": config.SERVER_KEY,
        })

    logger.info("Listening on port %s" % config.APP_PORT)
    http_server.listen(config.APP_PORT)
    tornado.ioloop.PeriodicCallback(JoinHandler.clear_expired_cookies,60*1000).start()
    tornado.ioloop.PeriodicCallback(RealtimeHandler.clear_expired_data,60*1000).start()
    tornado.ioloop.PeriodicCallback(serverKeepAlive,7*1000).start()

    tornado.ioloop.IOLoop.instance().start()
