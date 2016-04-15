import os
import socket
import fcntl
import struct

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
# APP_IP_ADDRESS = get_ip_address("eth0")

APP_PORT = os.environ.get('PORT', 5000)

# Port in which websocket client should listen
# Usually same as APP_PORT unless some other
# port forwarding is set up (for ex. if you're using heroku)
PUBLIC_LISTEN_PORT = APP_PORT

PUBSUB_CLIENT_TYPE = 'redis' # only redis supported now
DB_CLIENT_TYPE = 'redis'  # only redis supported now

EDGE_REDIS_URL= {}
AWS_ACCESS_KEY=os.environ.get('AWS_ACCESS_KEY', 'AKIAJO5BOGR5LEAHSECA')
AWS_SECRET_KEY=os.environ.get('AWS_SECRET_KEY','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')
S3_BUCKET=os.environ.get('S3_BUCKET','whiteboard.image')
# Full path of "collabdraw" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])
RESOURCE_DIR = os.path.join(ROOT_DIR, 'client')
FILES_DIR = os.path.join(ROOT_DIR, 'files')
HTML_ROOT = os.path.join(RESOURCE_DIR, 'html')

# Hash salt for storing password in database
HASH_SALT = "bollacboard"

# Enable SSL/TLS
ENABLE_SSL = False
SERVER_CERT = os.path.join(os.getcwd(), "agorabeckon.com.chained.crt")
SERVER_KEY = os.path.join(os.getcwd(), "agorabeckon-com.nopass.key")
# Demo mode disables login requirement
# DEMO_MODE = False
