import logging
import threading
import config
import glob
import os
import time
import tornado.web
import tornado.template as template
import boto3
import oss2
aliyun_auth = oss2.Auth('Lx9RJ90JpE9dvatH', 'vUrtgWOdmUzhGjXBMcJhwX2aZhoqls')

class InnerUploadHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.logger = logging.getLogger('websocket')
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", 'OPTIONS, HEAD, GET, POST, DELETE')
        self.set_header("Access-Control-Allow-Headers", 'Content-Type, Content-Range, Content-Disposition')

    def get(self):
        self.room_name = self.get_argument('room', '')
        loader = template.Loader(config.ROOT_DIR)
        return_str = 'something you wanna get'#loader.load(os.path.join(config.HTML_ROOT, "upload.html")).generate(room=self.room_name)
        self.logger.info("UploadHandler Room name is %s" % self.room_name)
        self.finish(return_str)

    def options(self):
        # self.logger.warn("upload handler options requested")
        pass

    # @tornado.web.authenticated
    def post(self):
        self.logger.info("inner upload %s" % self.request)
        fname = self.get_argument('fname', '')
        fbody = self.get_argument('fbody', '')
        fbody=fbody.encode(encoding='latin-1')
        self.logger.info("inner upload %s" % fname)
        if fname == '' or fbody == '':
            self.logger.error("data null")
            self.finish("fail")
            return
        try:
            s3 = boto3.resource('s3')
            s3.Bucket(config.S3_BUCKET).put_object(Key=fname, Body=fbody, ContentType='image')
            bucket = oss2.Bucket(aliyun_auth, 'oss-cn-shanghai.aliyuncs.com', 'whiteboard-image')
            bucket.put_object(fname, fbody)
        except:
            self.finish("fail")
            return
        self.finish("succ")
