import os
import json
APP_PORT = os.environ.get('PORT', 5555)

PUBSUB_CLIENT_TYPE = 'redis' # only redis supported now
DB_CLIENT_TYPE = 'redis'  # only redis supported now

EDGE_REDIS_URL = {}

# Full path of "collabdraw" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])

# Hash salt for storing password in database
# HASH_SALT = "bollacboard"

# Enable SSL/TLS
SERVER_CERT = ''
SERVER_KEY = ''
VENDOR_HOST = ''
VENDOR_PORT = 0
VENDOR_USER = ''
VENDOR_PASSWORD = ''
VENDOR_DB = ''
with open('config.json') as data_file:
    data = json.load(data_file)
    EDGE_REDIS_URL = data["EDGE_REDIS_URL"]
    SERVER_CERT=data["SERVER_CERT"]
    SERVER_KEY=data["SERVER_KEY"]
    VENDOR_HOST = data["VENDOR_HOST"]
    VENDOR_PORT = data["VENDOR_PORT"]
    VENDOR_USER = data['VENDOR_USER']
    VENDOR_PASSWORD = data['VENDOR_PASSWORD']
    VENDOR_DB = data['VENDOR_DB']
