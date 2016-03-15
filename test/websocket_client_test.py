from tornado import ioloop
import json
import time
import traceback
import base64
from ws4py.client.threadedclient import WebSocketClient
import zlib
import urllib

class DrawClient(WebSocketClient):
    room=''
    page_id=1457938521266021
    def opened(self):
        data={ 'event':'init' ,'data':{"room":self.room,"page":"1"}}
        print('DrawClient open',self)
        self.send(json.dumps(data))

    def draw(self):
        data ={'event':'draw-click' ,
            'data':{'singlePath': [
                    {'type': 'touchstart','oldx': 705, 'oldy': 50, 'lineColor': '#000000','lineWidth': '3px'},
                    {'type': 'touchmove','oldy': 50, 'x': 808, 'oldx': 705, 'y': 50, 'lineColor': '#000000', 'lineWidth': '3px'},
                    {'type': 'touchend', 'oldy': 50, 'x': 814, 'oldx': 808, 'y': 52, 'lineColor': '#000000','lineWidth': '3px'}
                ],
                'room':self.room,
                't':int(round(time.time() * 1000)),
            }
        }
        try:
            self.send(json.dumps(data))
        except:
            traceback.print_exc()
        # ioloop.IOLoop.instance().add_timeout(ioloop.IOLoop.instance().time() + 0.1, self.draw)

    def closed(self, code, reason=None):
        # pass
        print("DrawClient Closed down",self, code, reason)

    def received_message(self, m):
        if m.is_text:
            recvStr = m.data.decode("utf-8")
            x=json.loads(urllib.parse.unquote(str(zlib.decompress(base64.b64decode(recvStr)), encoding = "utf-8")))
            print(x)
            if x['event']=='draw-many':
                print("master recv",x['data']['t'])
                self.page_id=x['data']['pages'][0]

class DumpyClient(WebSocketClient):
    room=''
    def opened(self):
        self.delay=[]
        data={ 'event':'init' ,'data':{"room":self.room,"page":"1"}}
        print('DumpyClient open',self)
        self.send(json.dumps(data))

    def received_message(self, m):
        if m.is_text:
            recvStr = m.data.decode("utf-8")
            x=json.loads(urllib.parse.unquote(str(zlib.decompress(base64.b64decode(recvStr)), encoding = "utf-8")))
            if 't' in x['data']:
                print("dummpy recv",x['data']['t'])
                self.delay.append(int(round(time.time() * 1000)-x['data']['t']))

    def closed(self, code, reason=None):
        # pass
        print("DumpyClient close",self, code, reason)

def draw():
    for x in host:
        x.draw()

current_milli_time = lambda: int(round(time.time() * 1000))

if __name__ == '__main__':
    try:
        DrawClient.room='onreadystatechange'
        DumpyClient.room='onreadystatechange'
        global host
        host=[]
        for i in range(1):
            ws=DrawClient('ws://collabdraw.agoralab.co:5000/realtime/')
            ws.connect()
            host.append(ws)
        clients=[]
        for i in range(2):
            ws = DumpyClient('ws://collabdraw.agoralab.co:5000/realtime/')
            clients.append(ws)
            ws.connect()
        ioloop.PeriodicCallback(draw,200).start()
        ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        print("----------------------")
        delay=[]
        for x in clients:
            delay.extend(x.delay)
        delay.sort()
        l=len(delay)
        print("delay",delay[int(l*0.5)],delay[int(l*0.8)],delay[int(l*0.9)],delay[int(l*0.95)],delay[int(l*0.99)])
        print("----------------------")
