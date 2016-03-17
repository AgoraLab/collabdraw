from tornado import ioloop
import json
import time
import traceback
import base64
from ws4py.client.threadedclient import WebSocketClient
import zlib
import urllib
from tornado.httpclient import HTTPClient
class DrawClient(WebSocketClient):
    room=''
    sid=''
    page_id=1458035619912679
    def opened(self):
        data={'event':'init' ,'data':{"room":self.room,"page":"1",'sid':self.sid}}
        print('DrawClient open',self)
        self.send(json.dumps(data))

    def draw(self):
        data ={'event':'draw-click' ,
            'data':{'singlePath': [{"drawingItem":"circle","oldx":368,"oldy":404,"lineWidth":"3px","type":"touchmovement","lineColor":"black","path":[[368,404],[641,493]]}],
                'room':self.room,
                'page_id':self.page_id,
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
            pass
            # recvStr = m.data.decode("utf-8")
            # x=json.loads(urllib.parse.unquote(str(zlib.decompress(base64.b64decode(recvStr)), encoding = "utf-8")))
            # print(x)
            # if x['event']=='draw-many':
            #     print("master recv",x['data']['t'])
            #     self.page_id=x['data']['pages'][0]

class DumpyClient(WebSocketClient):
    room=''
    sid=''
    def opened(self):
        self.delay=[]
        data={ 'event':'init' ,'data':{"room":self.room,'sid':self.sid}}
        print('DumpyClient open',self)
        self.send(json.dumps(data))

    def received_message(self, m):
        if m.is_text:
            pass
            # recvStr = m.data.decode("utf-8")
            # x=json.loads(urllib.parse.unquote(str(zlib.decompress(base64.b64decode(recvStr)), encoding = "utf-8")))
            # print(x)


    def closed(self, code, reason=None):
        # pass
        print("DumpyClient close",self, code, reason)

def draw():
    for x in host:
        x.draw()

current_milli_time = lambda: int(round(time.time() * 1000))

if __name__ == '__main__':
    try:
        addr='119.9.75.121:5001'
        DrawClient.room='PES-2017'
        DumpyClient.room='PES-2017'
        http_client = HTTPClient()
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        url = "http://%s/join?key=f4637604af81440596a54254d53ade20&cname=PES-2017&uinfo=Demba+Ba&redis=1&vid=218"%(addr)
        response=http_client.fetch(url, headers=headers)
        msg=json.loads(str(response.body,encoding='utf-8'))
        DumpyClient.sid=msg['sid']
        DrawClient.sid=msg['sid']
        global host
        host=[]
        for i in range(1):
            ws=DrawClient("ws://%s/realtime/"%addr)
            ws.connect()
            host.append(ws)
        clients=[]
        for i in range(100):
            ws = DumpyClient("ws://%s/realtime/"%addr)
            clients.append(ws)
            ws.connect()
        ioloop.PeriodicCallback(draw,500).start()
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
