import os

APP_PORT = os.environ.get('PORT', 5555)

# Port in which websocket client should listen
# Usually same as APP_PORT unless some other
# port forwarding is set up (for ex. if you're using heroku)
PUBLIC_LISTEN_PORT = APP_PORT

PUBSUB_CLIENT_TYPE = 'redis' # only redis supported now
DB_CLIENT_TYPE = 'redis'  # only redis supported now

EDGE_REDIS_URL=  {'1':'redis://119.9.92.228:6301'}
CENTER_REDIS_URL = ['redis://119.9.92.228:6300']

# Full path of "collabdraw" directory
ROOT_DIR = "/".join(os.path.realpath(__file__).split('/')[:-1])

# Hash salt for storing password in database
HASH_SALT = "bollacboard"

# Enable SSL/TLS
ENABLE_SSL = False
SERVER_CERT = os.path.join(os.getcwd(), "server.crt")
SERVER_KEY = os.path.join(os.getcwd(), "server.key")

# Demo mode disables login requirement
# DEMO_MODE = False
