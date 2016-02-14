__author__ = 'yurun'

import logging
import pymysql

VENDOR_HOST = '221.228.202.134'
VENDOR_PORT = 3313
VENDOR_USER = 'webquery'
VENDOR_PASSWORD = 'bestvoip'
VENDOR_DB = 'vendors'

class MysqlClient:
    def __init__(self):
        self.logger = logging.getLogger('websocket')
        self.vendorKeys = {}
        self.vendorInfos = {}
        self.onTimer()

    def onTimer(self):
        self.loadVendors()

    def loadVendors(self):
        conn = pymysql.connect(host=VENDOR_HOST, port=VENDOR_PORT, user=VENDOR_USER, passwd=VENDOR_PASSWORD, db=VENDOR_DB)
        cur = conn.cursor()
        cur.execute("SELECT vendor_id, name, `key`, signkey, status  FROM vendor_info")
        for (vid, name, key, signkey, status) in cur:
            self.vendorKeys[key] = vid
            self.vendorInfos[vid] = {'vid': vid, 'name': name, 'key': key, 'signkey': signkey, 'status': status}

        self.logger.info('update %u vendor info from mysql' % len(self.vendorKeys))
        cur.close()
        conn.close()
