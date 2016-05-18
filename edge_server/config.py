import os
import socket
import fcntl
import struct
import json

def get_ip_address(ifname):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        return socket.inet_ntoa(fcntl.ioctl(
            s.fileno(),
            0x8915,  # SIOCGIFADDR
            struct.pack('256s', bytes(ifname[:15], encoding='utf-8'))
        )[20:24])
    except:
        return None
#
# # App's host and port
APP_IP_ADDRESS = get_ip_address("eth0")
APP_PORT = os.environ.get('PORT', 5000)

PUBSUB_CLIENT_TYPE = 'redis'  # only redis supported now
DB_CLIENT_TYPE = 'redis'  # only redis supported now

EDGE_REDIS_URL = {}
CENTER_ADDRESSES=[]
# Full path of "collabdraw" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])
RESOURCE_DIR = os.path.join(ROOT_DIR, 'client')
FILES_DIR = os.path.join(ROOT_DIR, 'files')
HTML_ROOT = os.path.join(RESOURCE_DIR, 'html')

# Hash salt for storing password in database
HASH_SALT = "bollacboard"

# Enable SSL/TLS
SERVER_CERT = ''
SERVER_KEY = ''
with open('config.json') as data_file:
    data = json.load(data_file)
    EDGE_REDIS_URL = data["EDGE_REDIS_URL"]
    SERVER_CERT=data["SERVER_CERT"]
    SERVER_KEY=data["SERVER_KEY"]
    CENTER_ADDRESSES=data["CENTER_ADDRESSES"]
