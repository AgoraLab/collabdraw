import logging
import json
from zlib import compress
from urllib.parse import quote
import config
import traceback
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

class CacheData(object):
    def __init__(self):
        self.page_path=None
        self.image=None

class RealtimeHandler(tornado.websocket.WebSocketHandler):
    logger = logging.getLogger('websocket')
    pubsub_static = PubSubClientFactory.getPubSubClient(config.PUBSUB_CLIENT_TYPE)
    cache_data=defaultdict(CacheData)
    logger.setLevel(logging.INFO)

    def clear_expired_data():
        RealtimeHandler.logger.debug("clear_expired_data")
        l = []
        cli= DbClientFactory.getDbClient(config.DB_CLIENT_TYPE).redis_client
        for k in RealtimeHandler.cache_data.keys():
            value= cli.execute_command('pubsub', 'numsub', k)
            if value and len(value)==2:
                num=value[1]
            else:
                num=None
            # RealtimeHandler.logger.info("monitor %s"%num)
            if num == 0:
                l.append(k)

        for topic in l:
            del RealtimeHandler.cache_data[topic]

    def gen_page_id():
        return int((time.time() * 1000000))

    # @Override
    def open(self):
        self.room_name = None
        self.page_id = None
        self.vid=0
        self.verified=False
        self.fromUid=0
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

        # self.logger.debug("Processing event %s from uid %s @%s" % (event, fromUid, self.request.remote_ip))
        self.logger.info("Processing event %s %s %s %s" % (event, data['room'], data.get('page_id',None), data.get('page',None)))

        # needed when realse
        if event == "init" :
            sid = data.get('sid', '')
            cookie=JoinHandler.get_cookie(sid)
            if cookie and 'room' in data and cookie['room'] == data['room'] and cookie['expiredTs'] >= fromTs:
                self.verified=True
                self.vid=cookie['vid']
                self.fromUid= fromUid
                self.room_name=data['room']

        #
        # if not self.verified:
        #     self.close()
        #     self.logger.error("sid not verified［ cookie:%s msg:%s ］" % (cookie, data))
        #     return


        if self.room_name != data['room'] :
            self.logger.error("Room name  %s doesn't match with current %s " % (data['room'],self.room_name))
            return

        if event not in ['init', 'new-page'] and  self.page_id != data['page_id']:
            self.logger.error("Room page  %s doesn't match with current  %s " % (data['page_id'],self.page_id))
            return

        if event == "init":
            room_name = data.get('room', '')
            page_id = data.get('page_id', None)
            self.logger.info("Initializing with room name %s" % room_name)
            # if self.room_name and self.room_name != '':
            #     self.leave_room(self.room_name, True)

            page_list = self.db_client.lrange(self.page_list_key(), 0, -1)
            if len(page_list)== 0:
                page_id=RealtimeHandler.gen_page_id()
                self.db_client.rpush(self.page_list_key(), [page_id])
            else:
                if page_id not in page_list:
                    page_id = page_list[0]

            self.init_room_page(room_name, page_id)

        elif event == "draw-click":
            single_path = data['singlePath']
            path=self.get_page_path_data()
            idx_start=len(path)
            idx_end=len(path)+len(single_path)
            path.extend(single_path)
            msg={'path_start':idx_start, 'path_end':idx_end}
            if 't' in data:
                msg['t']=data['t']
            self.broadcast_message(self.construct_broadcast_message("draw", msg))
            self.db_client.rpush(self.page_path_key(), [json.dumps(v) for v in single_path])

        elif event == "delete-page":
            if self.page_path_key() in self.cache_data:
                self.broadcast_message(self.construct_broadcast_message("delete", {}))
                del self.cache_data[self.page_path_key()]
                self.db_client.lrem(self.path_list_key(), 0, self.page_id)
                self.db_client.delete(self.page_path_key())

        elif event == "clear":
            self.broadcast_message(self.construct_broadcast_message(fromUid, "clear"))
            self.cache_data[self.page_path_key()].page_path=[]
            self.db_client.delete(self.page_path_key())

        elif event == "get-image":

            image_url, width, height = self.get_page_image_data()
            self.send_message(self.construct_message("image", {'url': image_url,
                                                               'width': width, 'height': height}))
        # elif event == "video":
        #     make_video(self.path_key())

        elif event == "new-page":
            page_id = RealtimeHandler.gen_page_id()
            self.db_client.rpush(self.page_list_key(),[page_id])
            self.init_room_page(self.room_name, page_id)

        self.logger.info("%s takes %.4f sec" %(event,(time.time() - fromTs)))

    # @Override
    def on_close(self):
        self.leave_room()

    def get_page_path_data(self):
        # Then send the paths
        if self.page_path_key() in self.cache_data \
            and self.cache_data[self.page_path_key()].page_path:
            path=self.cache_data[self.page_path_key()].page_path
        else:
            path=self.db_client.lrange(self.page_path_key(), 0, -1)
            self.cache_data[self.page_path_key()].page_path = path
        return path

    ## Higher lever methods
    def init_room_page(self, room_name, page_id):
        self.logger.debug("Initializing %s and %s" % (room_name, page_id))
        page_list = self.db_client.lrange(self.page_list_key(), 0, -1)
        self.logger.info(page_list)
        page_list = [int(i) for i in page_list]
        if page_id not in page_list:
            self.logger.error("illegal page_id %s"%page_id)
            return

        self.room_name = room_name
        self.page_id = page_id
        self.join_room()


        # First send the image if it exists
        image_url, width, height = self.get_page_image_data()
        self.send_message(self.construct_message("image", {'url': image_url,
                                                           'width': width, 'height': height}))
        path=self.get_page_path_data()
        self.send_message(self.construct_message("draw-many",
                                                 {'datas': path, 'pages':page_list}))

    def leave_room(self):
        self.logger.info("Leaving room %s" % self.room_name)
        self.pubsub_client.unsubscribe(self.page_list_key(), self)


    def join_room(self):
        self.logger.info("Joining room %s" % self.room_name)
        self.pubsub_client.subscribe(self.page_list_key(), self)

    ## Messaging related methods
    def construct_key(self, namespace, key, *keys):
        return ":".join([str(namespace), str(key)] + list(map(str, keys)))

    def page_path_key(self):
        return "%d:%s:%s:page_path"%(self.vid, self.room_name, self.page_id)

    # def npages_key(self):
    #     return "%d:%s:npages"%(self.vid, self.room_name)

    def page_list_key(self):
        return "%d:%s:page_list"%(self.vid, self.room_name)

    def construct_message(self, event, data={}):
        data['room']=self.room_name
        data['page_id']=self.page_id
        m = json.dumps({"event": event, "data": data})
        return m

    def construct_broadcast_message(self, event, data={}):
        data['room']=self.room_name
        data['page_id']=self.page_id
        m = json.dumps({"fromUid": self.fromUid, "event": event, "data": data})
        return m

    def broadcast_message(self, message):
        self.pubsub_client.publish(self.page_list_key(), message, self)

    def send_message(self, message):
        message = b64encode(compress(bytes(quote(str(message)), 'utf-8'), 9))
        self.write_message(message)

    def on_broadcast_message(self, m):
        m=json.loads(m)
        if m['event'] == 'draw':
            if m['data']['page_id'] != self.page_id:
                return
            start,end=m['data']['path_start'],m['data']['path_end']
            path=self.get_page_path_data()
            if end <= len(path):
                m['data']={'singlePath':path[start:end]}
        else:
            pass
        message = b64encode(compress(bytes(quote(str(json.dumps(m))), 'utf-8'), 9))
        self.write_message(message)

    def get_page_image_data(self):
        image_url = os.path.join("files", self.room_name, "image_%s.png"%(str(self.page_id)))
        image_path = os.path.join(config.ROOT_DIR, image_url)
        if self.page_path_key() in self.cache_data and self.cache_data[self.page_path_key()].image:
            image = self.cache_data[self.page_path_key()].image
        else:
            try:
                image = read(image_path)
                self.cache_data[self.page_path_key()].image=image
            except IOError as e:
                return '', -1, -1
        width, height = image.size
        return image_url, width, height
