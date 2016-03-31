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
from .joinhandler import MODE_PPT
from collections import defaultdict
from ..dbclient.dbclientfactory import DbClientFactory
from ..pubsub.pubsubclientfactory import PubSubClientFactory
from ..tools.videomaker import make_video
from ..tools.svg import gen_svg
from ..tools.svg import gen_list_svg
from tornado import ioloop
import threading
logger = logging.getLogger('websocket')

class RoomData(object):
    def __init__(self):
        self.page_path=defaultdict(list)
        self.page_image={}
        self.page_update_ts={}
        self.pubsub_client=None
        self.db_client=None
        self.topic=None
        self.room=None
        self.host_page_id=0

    def load_room_data(self):
        page_list = self.db_client.lrange("%s:page_list"%self.topic, 0, -1)
        for page_id in page_list:
            image=self.db_client.get("%s:%d:page_image"%(self.topic, page_id))
            path=self.db_client.lrange("%s:%d:page_path"%(self.topic, page_id), 0, -1)
            if image:
                self.page_image[page_id]=image
            if path:
                self.page_path[page_id]=path

    def load_image(self,page_id):
        if page_id not in self.page_image:
            image=self.db_client.get("%s:%d:page_image"%(self.topic, page_id))
            if image :
                self.page_image[page_id]=image
                self.page_update_ts[page_id]=time.time()


    def load_path(self,page_id):
        if page_id not in self.page_path:
            path=self.db_client.lrange("%s:%d:page_path"%(self.topic, page_id), 0, -1)
            if path :
                self.page_path[page_id]=path
                self.page_update_ts[page_id]=time.time()


    def timer_thumbnail(self):
        logger.info("timer_thumbnail topic :%s users:%d"%(self.topic, len(RealtimeHandler.topics[self.topic])))
        if len(RealtimeHandler.topics[self.topic])>0:
            page_list = self.db_client.lrange("%s:page_list"%self.topic, 0, -1)
            now=time.time()
            plist=[]
            for k in page_list:
                self.load_image(k)
                self.load_path(k)
                image=None if k not in  self.page_image else self.page_image[k]
                if now-self.page_update_ts[k]<20:
                    plist.append((self.room, k, self.page_path[k],image))
                    # gen_svg(self.room, k, self.page_path[k],image)
                threading.Thread(target=gen_list_svg, args=(plist,)).start()
            ioloop.IOLoop.instance().add_timeout(time.time()+20,self.timer_thumbnail)

    def init_room(self, url, topic, room):
        if not self.pubsub_client:
            self.db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE, url)
            self.pubsub_client = PubSubClientFactory.getPubSubClient(config.PUBSUB_CLIENT_TYPE,self.db_client)
            self.pubsub_client.subscribe(topic, self, RealtimeHandler.on_broadcast_message)
            self.topic=topic
            self.room=room
            ioloop.IOLoop.instance().add_timeout(time.time(),self.timer_thumbnail)

    def publish(self, m):
        self.pubsub_client.publish(self.topic, m, self)

    def update_page_path(self, page_id, path):
        self.page_path[page_id].extend(path)
        self.page_update_ts[page_id]=time.time()

    def set_page_path(self, page_id, path):
        self.page_path[page_id]=path
        self.page_update_ts[page_id]=time.time()

    def get_page_path(self, page_id):
        return self.page_path[page_id]

    def delete_page(self, page_id):
        if page_id in self.page_path:
            del self.page_path[page_id]
        if page_id in self.page_image:
            del self.page_image[page_id]

    def get_page_image(self, page_id):
        if page_id in self.page_image:
            return self.page_image[page_id]
        return None

    def set_page_image(self, page_id, image):
        self.page_image[page_id]=image
        self.page_update_ts[page_id]=time.time()

    def destroy(self):
        if self.topic and self.pubsub_client:
            self.pubsub_client.unsubscribe(topic, self)
        self.page_path=None
        self.page_image=None
        self.pubsub_client=None
        self.topic=None

class RealtimeHandler(tornado.websocket.WebSocketHandler):
    logger = logging.getLogger('websocket')
    room_data=defaultdict(RoomData)
    topics=defaultdict(list)
    logger.setLevel(logging.INFO)
    def clientCount():
        load=0
        for v in RealtimeHandler.topics.values():
            load+=len(v)
        return load

    def clear_expired_data():
        RealtimeHandler.logger.debug("clear_expired_data")
        rm_lst = []
        for t , clients in RealtimeHandler.topics.items():
            if clients and len(clients) == 0:
                rm_lst.append(t)
        for topic in rm_lst:
            RealtimeHandler.room_data[topic].destroy()
            del RealtimeHandler.room_data[topic]

    def gen_page_id():
        return int((time.time() * 1000000))

    def on_db_error(self):
        self.logger.error('db error')
        self.send_message(self.construct_message("dberr"))

    def get_room(self):
        return self.room_data[self.room_topic()]

    # @Override
    def open(self):
        self.room_name = None
        self.page_id = None
        self.vid=0
        self.verified=False
        self.fromUid=0
        self.cookie=None
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
                self.cookie=cookie
                self.get_room().init_room(cookie['redis'], self.room_topic(), data['room'])

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
            self.logger.info("%s")
            if self.cookie['mode'] == MODE_PPT and self.cookie['host'] != '1' and self.get_room().host_page_id != 0:
                page_id=self.get_room().host_page_id
            self.logger.info("Initializing with room name %s %s" % (room_name,self.cookie))
            page_list = self.get_room().db_client.lrange(self.page_list_key(), 0, -1)
            # if not page_list:
            #     return self.on_db_error()
            if len(page_list)== 0:
                page_id=RealtimeHandler.gen_page_id()
                self.get_room().db_client.rpush(self.page_list_key(), [page_id])
            else:
                if page_id not in page_list:
                    page_id = page_list[0]
            self.init_room_page(room_name, page_id)
            if self.cookie['host']=='1' and self.cookie['mode'] == MODE_PPT:
                self.get_room().host_page_id=page_id
                self.broadcast_message(self.room_topic(), self.construct_broadcast_message("change-page", {'page_id':page_id}))

        elif event == "draw-click":
            if self.cookie['host'] != '1':
                logger.error("user not host :%s"%(self.cookie))
                return
            single_path = data['singlePath']
            ret=self.get_room().db_client.rpush(self.page_path_key(), [json.dumps(v) for v in single_path])
            if not ret:
                return self.on_db_error()
            self.get_room().update_page_path(self.page_id, single_path)
            msg={'singlePath':single_path}
            if 't' in data:
                msg['t']=data['t']
            self.broadcast_message(self.room_topic(), self.construct_broadcast_message("draw", msg))

        elif event == "delete-page":
            if self.cookie['host'] != '1':
                logger.error("user not host :%s"%(self.cookie))
                return
            self.get_room().db_client.lrem(self.page_list_key(), 0, self.page_id)
            self.get_room().db_client.delete(self.page_path_key())
            self.get_room().db_client.delete(self.page_image_key())
            page_list = self.get_room().db_client.lrange(self.page_list_key(), 0, -1)
            page_list = [int(i) for i in page_list]
            self.broadcast_message(self.room_topic(), self.construct_broadcast_message("delete-page", {'pages':page_list}))
            self.get_room().delete_page(self.page_id)

        elif event == "clear":
            if self.cookie['host'] != '1':
                logger.error("user not host :%s"%(self.cookie))
                return
            self.get_room().db_client.delete(self.page_path_key())
            self.get_room().db_client.delete(self.page_image_key())
            self.get_room().set_page_path(self.page_id, [])
            self.get_room().set_page_image(self.page_id, None)
            self.broadcast_message(self.room_topic(), self.construct_broadcast_message("clear",{}))

        elif event == "get-image":
            image_url, width, height = self.get_page_image_data()
            self.send_message(self.construct_message("image", {'url': image_url,
                                                               'width': width, 'height': height}))
        # elif event == "video":
        #     make_video(self.path_key())

        elif event == "new-page":
            if self.cookie['host'] != '1':
                logger.error("user not host :%s"%(self.cookie))
                return
            page_id = RealtimeHandler.gen_page_id()
            ret=self.get_room().db_client.rpush(self.page_list_key(),[page_id])
            if not ret:
                return self.on_db_error()
            self.init_room_page(self.room_name, page_id)
        elif event == "laser-move":
            if self.cookie['host'] != '1':
                logger.error("user not host :%s"%(self.cookie))
                return
            self.broadcast_message(self.room_topic(), self.construct_broadcast_message(event,data))

        self.logger.info("%s takes %.4f sec" %(event,(time.time() - fromTs)))

    # @Override
    def on_close(self):
        self.leave_room()

    ## Higher lever methods
    def init_room_page(self, room_name, page_id):
        self.logger.info("Initializing %s and %s" % (room_name, page_id))
        page_list = self.get_room().db_client.lrange(self.page_list_key(), 0, -1)
        if not page_list:
            return self.on_db_error()
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
        # self.logger.info("xxxx 7777 %s"%image_url)
        self.send_message(self.construct_message("image", {'url': image_url,
                                                           'width': width, 'height': height}))
        path=self.get_page_path_data()
        self.send_message(self.construct_message("draw-many",
                                                 {'datas': path, 'pages':page_list}))

    def leave_room(self):
        self.logger.info("Leaving room %s" % self.room_name)
        # if self.pubsub_client:
        #     self.pubsub_client.unsubscribe(self.page_list_key(), self)
        if self in self.topics[self.room_topic()]:
            self.topics[self.room_topic()].remove(self)


    def join_room(self):
        self.logger.info("Joining room %s %d %s" % (self.room_name, self.page_id,self))
        # self.pubsub_client.subscribe(self.page_list_key(), self)
        # self.logger.info("before join clients:%s"%(self.topics[self.room_topic()]))
        if self not in self.topics[self.room_topic()]:
            self.topics[self.room_topic()].append(self)
        # self.logger.info("after join clients:%s"%(self.topics[self.room_topic()]))


    ## Messaging related methods
    # def construct_key(self, namespace, key, *keys):
    #     return ":".join([str(namespace), str(key)] + list(map(str, keys)))
    def page_image_key(self):
        return "%s:%s:%s:page_image"%(str(self.vid), self.room_name, self.page_id)

    def page_path_key(self):
        return "%s:%s:%s:page_path"%(str(self.vid), self.room_name, self.page_id)

    def page_list_key(self):
        return "%s:%s:page_list"%(str(self.vid), self.room_name)

    def room_topic(self):
        return "%s:%s"%(str(self.vid), self.room_name)

    def construct_message(self, event, data={}):
        data['room']=self.room_name
        data['page_id']=self.page_id
        return {"event": event, "data": data}

    def construct_broadcast_message(self, event, data={}):
        data['room']=self.room_name
        data['page_id']=self.page_id
        return {"fromUid": self.fromUid, "event": event, "data": data}


    def broadcast_message(self, topic, message):
        m=json.dumps(message)
        self.room_data[topic].publish(m)

    def on_uploadfile(room_topic, page_image_map):
        RealtimeHandler.logger.info("on_uploadfile %s"%page_image_map)
        room=RealtimeHandler.room_data[room_topic]
        page_list_key="%s:page_list"%(room_topic)
        for k in sorted(page_image_map.keys()):
            v=page_image_map[k]
            room.db_client.set("%s:%d:page_image"%(room_topic,k), "http://userimg.collabdraw.agoralab.co/%s"%(v))
        room.db_client.rpush(page_list_key, list(page_image_map.keys()))
        page_list=room.db_client.lrange(page_list_key, 0, -1)
        room.publish(json.dumps({'event':'pages', 'data':{'pages':page_list}}))

    def on_broadcast_message(topic, message):
        m=json.loads(message)
        if m['event'] == 'draw':
            pass
        elif m['event'] == 'clear':
            RealtimeHandler.room_data[topic].set_page_path(m['data']['page_id'], [])
            RealtimeHandler.room_data[topic].set_page_image(m['data']['page_id'], None)
        elif m['event'] == 'delete-page':
            RealtimeHandler.room_data[topic].delete_page(m['data']['page_id'])
        # RealtimeHandler.logger.info("broadcast %s to %d clients"%(m['event'], len(RealtimeHandler.topics[topic])))
        for client in RealtimeHandler.topics[topic]:
            if m['event'] in ['draw','clear','laser-move'] and m['data']['page_id'] != client.page_id:
                    continue
            client.send_message(m)

    def send_message(self, message):
        m=json.dumps(message)
        m = b64encode(compress(bytes(quote(str(m)), 'utf-8'), 9))
        self.write_message(m)

    def get_page_image_data(self):
        image=self.get_room().get_page_image(self.page_id)
        # self.logger.info("xxx %s"%image)
        if not image:
            # self.logger.info("xxx222 %s"%image)
            image=self.get_room().db_client.get(self.page_image_key())
            # self.logger.info("xxx333 %s %s"%(self.page_image_key(),image))
            if image :
                # self.logger.info("xxx444 %s %s"%(self.page_image_key(),image))
                # image=str(image, encoding='utf-8')
                self.get_room().set_page_image(self.page_id, image)
                # self.logger.info("xxx555 %s %s"%(self.page_image_key(),image))
                # self.logger.info("xxxxxxxxx %d %s"%(self.page_id,image))
            else:
                image=''
        # self.logger.info("xxx6666 %s %s"%(self.page_image_key(),image))
        # width, height = image.size
        return image, 100, 100

    def get_page_path_data(self):
        # Then send the paths
        path=self.get_room().page_path[self.page_id]
        if len(path) == 0:
            path=self.get_room().db_client.lrange(self.page_path_key(), 0, -1)
            self.get_room().set_page_path(self.page_id, path)
        return path
