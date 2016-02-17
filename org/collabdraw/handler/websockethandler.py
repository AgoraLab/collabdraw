import logging
import json
from zlib import compress
from urllib.parse import quote
import config

import os
from base64 import b64encode
import time
from datetime import datetime
import tornado.websocket
import tornado.web
from pystacia import read
from .joinhandler import JoinHandler

from ..dbclient.dbclientfactory import DbClientFactory
from ..pubsub.pubsubclientfactory import PubSubClientFactory
from ..tools.videomaker import make_video


class RealtimeHandler(tornado.websocket.WebSocketHandler):
    # @Override
    def open(self):
        self.room_name = ''
        self.paths = []
        self.db_client = None
        self.page_no = 1
        self.num_pages = 1
        self.vid=0
        self.verified=False
        self.logger = logging.getLogger('websocket')
        self.db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
        self.pubsub_client = PubSubClientFactory.getPubSubClient(config.PUBSUB_CLIENT_TYPE)

        self.send_message(self.construct_message("ready"))

    # @Override
    def on_message(self, message):
        m = json.loads(message)
        fromUid = m.get('uid', '').strip()
        event = m.get('event', '').strip()
        data = m.get('data', {})
        fromTs=time.time()

        self.logger.debug("Processing event %s from uid %s @%s" % (event, fromUid, self.request.remote_ip))

        if event == "init" :
            sid = data.get('sid', '')
            cookie=JoinHandler.get_cookie(sid)
            if cookie and cookie['room'] == data['room'] and cookie['expiredTs'] >= fromTs:
                self.verified=True
                self.vid=cookie['vid']

        if not self.verified:
            self.logger.error("sid not verified［ cookie:%s msg:%s ］" % (cookie, data))
            return

        if event == "init":
            self.logger.info("Initializing with room name %s" % self.room_name)
            room_name = data.get('room', '')
            page_no = data.get('page', '1')

            if not room_name:
                self.logger.error("Room name not provided. Can't initialize")
                return

            if self.room_name and self.room_name != '':
                self.leave_room(self.room_name, True)

            self.init(room_name, page_no)

        elif event == "draw-click":
            self.logger.debug("Received draw-click")
            single_path = data['singlePath']

            self.paths.extend(single_path)
            self.broadcast_message(self.construct_broadcast_message(fromUid, "draw", {'singlePath': single_path}))
            self.db_client.set(self.path_key(), self.paths)

        elif event == "clear":
            self.broadcast_message(self.construct_broadcast_message(fromUid, "clear"))
            self.db_client.delete(self.path_key())

        elif event == "get-image":
            if self.room_name != data['room'] or self.page_no != data['page']:
                self.logger.warning("Room name %s and/or page no. %s doesn't match with current room name %s and/or",
                                    "page no. %s. Ignoring" % (
                                    data['room'], data['page'], self.room_name, self.page_no))
            image_url, width, height = self.get_image_data(self.room_name, self.page_no)
            self.send_message(self.construct_message("image", {'url': image_url,
                                                               'width': width, 'height': height}))
        elif event == "video":
            make_video(self.path_key())

        elif event == "new-page":
            self.logger.info("num_pages was %d" % self.num_pages)
            self.num_pages += 1
            self.db_client.set(self.npages_key(),str(self.num_pages))
            self.init(self.room_name, self.num_pages)

        self.logger.info("%s takes %.4f sec" %(event,(time.time() - fromTs)))

    # @Override
    def on_close(self):
        self.leave_room(self.room_name)

    ## Higher lever methods
    def init(self, room_name, page_no):
        self.logger.info("Initializing %s and %s" % (room_name, page_no))

        self.room_name = room_name
        self.page_no = page_no
        self.join_room(self.room_name)

        n_pages = self.db_client.get(self.npages_key())
        if n_pages:
            self.num_pages = int(n_pages)
        # First send the image if it exists
        image_url, width, height = self.get_image_data(self.room_name, self.page_no)
        self.send_message(self.construct_message("image", {'url': image_url,
                                                           'width': width, 'height': height}))
        # Then send the paths
        p = self.db_client.get(self.path_key())
        if p:
            self.paths = json.loads(p)

        self.send_message(self.construct_message("draw-many",
                                                 {'datas': self.paths, 'npages': self.num_pages}))

    def leave_room(self, room_name, clear_paths=True):
        self.logger.info("Leaving room %s" % room_name)
        self.pubsub_client.unsubscribe(self.path_key(), self)
        if clear_paths:
            self.paths = []

    def join_room(self, room_name):
        self.logger.info("Joining room %s" % room_name)
        self.pubsub_client.subscribe(self.path_key(), self)

    ## Messaging related methods
    def construct_key(self, namespace, key, *keys):
        return ":".join([str(namespace), str(key)] + list(map(str, keys)))

    def path_key(self):
        return "%d:%s:%s:path"%(self.vid, self.room_name, self.page_no)

    def npages_key(self):
        return "%d:%s:npages"%(self.vid, self.room_name)

    def construct_message(self, event, data={}):
        m = json.dumps({"event": event, "data": data})
        return m

    def construct_broadcast_message(self, fromUid, event, data={}):
        m = json.dumps({"fromUid": fromUid, "event": event, "data": data})
        return m

    def broadcast_message(self, message):
        self.pubsub_client.publish(self.path_key(), message, self)

    def send_message(self, message):
        message = b64encode(compress(bytes(quote(str(message)), 'utf-8'), 9))
        self.write_message(message)

    def get_image_data(self, room_name, page_no):
        image_url = os.path.join("files", room_name, str(page_no) + "_image.png")
        image_path = os.path.join(config.ROOT_DIR, image_url)
        try:
            image = read(image_path)
        except IOError as e:
            self.logger.error("Error %s while reading image at location %s" % (e,
                                                                               image_path))
            return '', -1, -1
        width, height = image.size
        return image_url, width, height
