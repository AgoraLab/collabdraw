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
from collections import defaultdict

from ..dbclient.dbclientfactory import DbClientFactory
from ..pubsub.pubsubclientfactory import PubSubClientFactory
from ..tools.videomaker import make_video


class RealtimeHandler(tornado.websocket.WebSocketHandler):

    logger = logging.getLogger('websocket')
    pubsub_static =PubSubClientFactory.getPubSubClient(config.PUBSUB_CLIENT_TYPE)
    paths_cache = defaultdict(list)
    images_cache = {}

    def clear_expired_data():
        RealtimeHandler.logger.debug("clear_expired_data")
        l = []
        cli= DbClientFactory.getDbClient(config.DB_CLIENT_TYPE).redis_client
        for k in RealtimeHandler.paths_cache.keys():
            value= cli.execute_command('pubsub', 'numsub', k)
            if value and len(value)==2:
                num=value[1]
            else:
                num=None
            # RealtimeHandler.logger.info("monitor %s"%num)
            if num == 0:
                l.append(k)

        for topic in l:
            del RealtimeHandler.paths_cache[topic]
            if topic in RealtimeHandler.images_cache:
                del RealtimeHandler.images_cache[topic]

    # @Override
    def open(self):
        self.room_name = ''
        self.page_no = 1
        self.num_pages = 1
        self.vid=0
        self.verified=False
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

        # if event == "init" :
        #     sid = data.get('sid', '')
        #     cookie=JoinHandler.get_cookie(sid)
        #     if cookie and cookie['room'] == data['room'] and cookie['expiredTs'] >= fromTs:
        #         self.verified=True
        #         self.vid=cookie['vid']
        #
        # if not self.verified:
        #     self.close()
        #     self.logger.error("sid not verified［ cookie:%s msg:%s ］" % (cookie, data))
        #     return

        if event == "init":
            room_name = data.get('room', '')
            page_no = data.get('page', '1')
            self.logger.info("Initializing with room name %s" % room_name)
            if not room_name:
                self.logger.error("Room name not provided. Can't initialize")
                return

            if self.room_name and self.room_name != '':
                self.leave_room(self.room_name, True)

            self.init(room_name, page_no)

        elif event == "draw-click":
            single_path = data['singlePath']
            self.logger.info("Received draw-click %s",single_path)
            self.paths_cache[self.path_key()].extend(single_path)
            msg={'singlePath': single_path}
            if 't' in data:
                msg['t']=data['t']
            self.broadcast_message(self.construct_broadcast_message(fromUid, "draw",msg))
            self.db_client.rpush(self.path_key(), [json.dumps(v) for v in single_path])

        elif event == "clear":
            self.broadcast_message(self.construct_broadcast_message(fromUid, "clear"))
            self.paths_cache[self.path_key()]=[]
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
        # p = self.db_client.get(self.path_key())
        if self.path_key() in self.paths_cache and self.paths_cache[self.path_key()] and len(self.paths_cache[self.path_key()])>0:
            path=self.paths_cache[self.path_key()]
        else:
            path=self.db_client.lrange(self.path_key(), 0, -1)
            self.paths_cache[self.path_key()] = path
        self.send_message(self.construct_message("draw-many",
                                                 {'datas': path, 'npages': self.num_pages}))

    def leave_room(self, room_name, clear_paths=True):
        self.logger.info("Leaving room %s" % room_name)
        self.pubsub_client.unsubscribe(self.path_key(), self)
        if clear_paths:
            self.paths_cache[self.path_key()] = []

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
        if self.path_key() in self.images_cache:
            image =  self.images_cache[self.path_key()]
        else:
            try:
                image = read(image_path)
                self.images_cache[self.path_key()]=image
            except IOError as e:
                return '', -1, -1
        width, height = image.size
        return image_url, width, height
