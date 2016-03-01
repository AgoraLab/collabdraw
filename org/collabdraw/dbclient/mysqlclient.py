__author__ = 'yurun'

import logging
import pymysql

VENDOR_HOST = '119.9.92.49'
VENDOR_PORT = 3313
VENDOR_USER = 'webquery'
VENDOR_PASSWORD = 'bestvoip'
VENDOR_DB = 'vendors'

class MysqlClient:
    vendorKeys = {}
    vendorInfos = {}
    logger = logging.getLogger('websocket')

    def __init__(self):
        pass
        # self.vendorKeys = {}
        # self.vendorInfos = {}
        # self.onTimer()

    def onTimer():
        MysqlClient.loadVendors()

    def loadVendors():
        conn = pymysql.connect(host=VENDOR_HOST, port=VENDOR_PORT, user=VENDOR_USER, passwd=VENDOR_PASSWORD, db=VENDOR_DB)
        cur = conn.cursor()
        cur.execute("SELECT vendor_id, name, `key`, signkey, status  FROM vendor_info")
        for (vid, name, key, signkey, status) in cur:
            MysqlClient.vendorKeys[key] = vid
            MysqlClient.vendorInfos[vid] = {'vid': vid, 'name': name, 'key': key, 'signkey': signkey, 'status': status}
        MysqlClient.logger.info('update %u vendor info from mysql' % len(MysqlClient.vendorKeys))
        cur.close()
        conn.close()
