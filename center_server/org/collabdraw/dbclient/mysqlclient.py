__author__ = 'yurun'

import logging
import pymysql
import _thread
import threading
VENDOR_HOST = '119.9.92.49'
# VENDOR_HOST = '127.0.0.1'
VENDOR_PORT = 3313
VENDOR_USER = 'webquery'
VENDOR_PASSWORD = 'bestvoip'
VENDOR_DB = 'vendors'

class MysqlClientVendor:
    vendorKeys = {}
    vendorInfos = {}
    vendor_lock = _thread.allocate_lock()
    logger = logging.getLogger('web')

    def __init__(self):
        pass
        # self.vendorKeys = {}
        # self.vendorInfos = {}
        # self.onTimer()

    def getVendorKeys(self):
        with MysqlClientVendor.vendor_lock:
            return MysqlClientVendor.vendorKeys

    def getVendorInfos(self):
        with MysqlClientVendor.vendor_lock:
            return MysqlClientVendor.vendorInfos

    def onTimer():
        threading.Thread(target=MysqlClientVendor.loadVendors, args=()).start()

    def loadVendors():
        conn = pymysql.connect(host=VENDOR_HOST, port=VENDOR_PORT, user=VENDOR_USER, passwd=VENDOR_PASSWORD, db=VENDOR_DB, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT vendor_id, name, `key`, signkey, status  FROM vendor_info")
        vendorKeys={}
        vendorInfos={}
        for (vid, name, key, signkey, status) in cur:
            vendorKeys[key] = vid
            vendorInfos[vid] = {'vid': int(vid), 'name': name, 'key': key, 'signkey': signkey, 'status': status}
        MysqlClientVendor.logger.info('update %u vendor info from mysql' % len(vendorInfos))
        cur.close()
        conn.close()
        with MysqlClientVendor.vendor_lock:
            MysqlClientVendor.vendorKeys=vendorKeys;
            MysqlClientVendor.vendorInfos=vendorInfos;
