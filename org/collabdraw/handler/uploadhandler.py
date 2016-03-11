import logging
import threading
import config
import glob
import os
import time
import tornado.web
import tornado.template as template
from .joinhandler import JoinHandler
from ..dbclient.dbclientfactory import DbClientFactory
from ..tools.uploadprocessor import process_uploaded_file_pdf
from ..tools.uploadprocessor import process_uploaded_file_png
from ..tools.uploadprocessor import process_uploaded_file_other


class UploadHandler(tornado.web.RequestHandler):
    def initialize(self):
        self.logger = logging.getLogger('websocket')
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", 'OPTIONS, HEAD, GET, POST, DELETE')
        self.set_header("Access-Control-Allow-Headers", 'Content-Type, Content-Range, Content-Disposition')
        self.db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)


    def get_current_user(self):
        return self.get_secure_cookie("loginId")

    # @tornado.web.authenticated
    def get(self):
        self.room_name = self.get_argument('room', '')
        loader = template.Loader(config.ROOT_DIR)
        return_str = 'something you wanna get'#loader.load(os.path.join(config.HTML_ROOT, "upload.html")).generate(room=self.room_name)
        self.logger.info("UploadHandler Room name is %s" % self.room_name)
        self.finish(return_str)

    def options(self):
        self.logger.warn("upload handler options requested")
        pass

    # @tornado.web.authenticated
    def post(self):
        # return_str = "<html><head><meta http-equiv='REFRESH'\
        #     content='5;url=http://" + config.APP_IP_ADDRESS + ":" + str(config.PUBLIC_LISTEN_PORT) + \
        #              "/upload.html#room=%s'></head><body>%s. Will redirect back to the upload page in 5\
        #              seconds</body></html>"
        self.room_name = self.get_argument('room', '')
        self.logger.info("Room name is %s" % self.room_name)
        if not self.room_name:
            self.logger.error("Unknown room name. Ignoring upload")
            response_str = "Room name not provided"
            self.finish(return_str % (self.room_name, response_str))
            return

        cookie=JoinHandler.get_cookie(self.get_argument('sid', ''))
        self.logger.info(self.get_secure_cookie("loginId"))
        now = time.time()
        if not (cookie and cookie['room'] == self.room_name and cookie['expiredTs'] >= now):
            self.logger.error("Not joined cookie. Ignoring upload %s", cookie)
            response_str = "Cookie Not Joined"
            self.finish(return_str % (self.room_name, response_str))
            return

        fileinfo = self.request.files['myfile'][0]
        fname = fileinfo['filename']
        fext = os.path.splitext(fname)[1]
        if fext.lower() not in ['.pdf','.png','.jpeg','.jpg']:
            self.logger.error("Extension is not pdf or png. It is %s" % fext)
            response_str = "Only pdf files are allowed"
            self.finish(return_str % (self.room_name, response_str))
            return

        # write file
        dir_path = os.path.join(config.ROOT_DIR, "files", self.room_name)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, fname)
        fh = open(file_path, 'wb')
        fh.write(fileinfo['body'])
        fh.close()

        db_key = "%s:%s:page_list" % (cookie['vid'], self.room_name)
        # split and convert pdf to png
        if fext.lower() == '.pdf':
            threading.Thread(target=process_uploaded_file_pdf, args=(dir_path, fname, db_key, cookie)).start()
        elif fext.lower() == '.png':
            threading.Thread(target=process_uploaded_file_png, args=(dir_path, fname, db_key, cookie)).start()
        else:
            threading.Thread(target=process_uploaded_file_other, args=(dir_path, fname, db_key, cookie)).start()

        response_str = "Upload finished successfully"
        self.finish(response_str)
        # self.finish(return_str % (self.room_name, response_str))
