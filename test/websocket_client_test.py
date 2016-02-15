from ws4py.client.tornadoclient import TornadoWebSocketClient
from tornado import ioloop
import json
import time
import traceback

from ws4py.client.threadedclient import WebSocketClient

class DrawClient(WebSocketClient):
    room=''
    def opened(self):
        data={ 'event':'init' ,'data':{"room":self.room,"page":"1"}}
        self.send(json.dumps(data))

    def draw(self):
        data ={'event':'draw-click' ,
            'data':{'singlePath': [
                    {'type': 'touchstart','oldx': 705, 'oldy': 50, 'lineColor': '#000000','lineWidth': '3px'},
                    {'type': 'touchmove','oldy': 50, 'x': 808, 'oldx': 705, 'y': 50, 'lineColor': '#000000', 'lineWidth': '3px'},
                    {'type': 'touchend', 'oldy': 50, 'x': 814, 'oldx': 808, 'y': 52, 'lineColor': '#000000','lineWidth': '3px'}
                ]
            }
        }
        try:
            self.send(json.dumps(data))
        except:
            traceback.print_exc()
        ioloop.IOLoop.instance().add_timeout(ioloop.IOLoop.instance().time() + 0.1, self.draw)

    def closed(self, code, reason=None):
        print("Closed down", code, reason)

    def received_message(self, m):
        print("master recv")

class DumpyClient(TornadoWebSocketClient):
    room=''
    def opened(self):
        data={ 'event':'init' ,'data':{"room":self.room,"page":"1"}}
        self.send(json.dumps(data))

    def received_message(self, m):
        print("receive")

    def closed(self, code, reason=None):
        print("close",code, reason)
        # ioloop.IOLoop.instance().stop()

current_milli_time = lambda: int(round(time.time() * 1000))

if __name__ == '__main__':
    try:
        host=DrawClient('ws://10.203.112.133:5000/realtime/')
        host.room='one'
        host.connect()
        clients=[]
        for i in range(500):
            ws = DumpyClient('ws://10.203.112.133:5000/realtime/')
            ws.room='one'
            clients.append(ws)
            ws.connect()
        host.draw()
        ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        pass
