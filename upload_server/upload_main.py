import logging
import uuid
import os
import json
import tornado.httpserver
import tornado.ioloop
import tornado.web
import time
import urllib
import boto3
import oss2
import traceback
from tornado import gen
from concurrent.futures import ThreadPoolExecutor,as_completed

FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
logging.basicConfig(format=FORMAT)
logger = logging.getLogger('web')
logger.setLevel(logging.INFO)

aliyun_auth = oss2.Auth('Lx9RJ90JpE9dvatH', 'vUrtgWOdmUzhGjXBMcJhwX2aZhoqls')

def upload_aliyun(fname, fbody):
    bucket = oss2.Bucket(aliyun_auth, 'oss-cn-shanghai.aliyuncs.com', 'whiteboard-image')
    bucket.put_object(fname, fbody)

def upload_s3(fname, fbody):
    s3 = boto3.resource('s3')
    s3.Bucket('whiteboard.image').put_object(Key=fname, Body=fbody, ContentType='image')

class InnerUploadHandler(tornado.web.RequestHandler):

    def initialize(self):
        # self.logger = logging.getLogger('websocket')
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header(
            "Access-Control-Allow-Methods",
            'OPTIONS, HEAD, GET, POST, DELETE')
        self.set_header("Access-Control-Allow-Headers",
                        'Content-Type, Content-Range, Content-Disposition')

    def options(self):
        # self.logger.warn("upload handler options requested")
        pass

    @gen.coroutine
    def post(self):
        logger.info("inner upload %s" % self.request)
        startTs=time.time()
        r=json.loads(str(self.request.body, encoding='utf-8'))
        fbody = r['fbody'].encode(encoding='latin-1')
        fname=r['fname']
        # logger.info("inner upload %s " % (fbody))
        if fname == '' or fbody == '':
            logger.error("data null")
            self.finish("fail")
            return
        try:
            with ThreadPoolExecutor(max_workers=2) as executor:
                f1=executor.submit(upload_aliyun, fname, fbody)
                f2=executor.submit(upload_s3, fname, fbody)
                try:
                    f1.result()
                    f2.result()
                except:
                    self.finish("fail")
                    return
        except:
            traceback.print_exc()
            self.finish("fail")
            return
        logger.info("upload take %d ms"%(int((time.time()-startTs)*1000)))
        self.finish("succ")

class Application(tornado.web.Application):

    def __init__(self):
        handlers = [
            (r'/innerupload', InnerUploadHandler),
        ]
        settings = dict(
            auto_reload=True,
            gzip=True,
            cookie_secret=str(uuid.uuid4()),
        )
        tornado.web.Application.__init__(self, handlers, **settings)

if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(Application())
    logger.info("Listening on port %s" % os.environ.get('PORT', 5100))
    http_server.listen(os.environ.get('PORT', 5100))
    tornado.ioloop.IOLoop.instance().start()
