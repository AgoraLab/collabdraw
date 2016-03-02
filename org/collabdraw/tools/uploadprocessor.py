__author__ = 'anand'

import subprocess
import glob
import os
import logging
import time
import json
import config
from ..dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.tools.tools import delete_files
from ..handler.websockethandler import RealtimeHandler
logger = logging.getLogger('websocket')

def process_uploaded_file_pdf(dir_path, fname, key):
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)

    file_path = os.path.join(dir_path, fname)
    tmp_name=int(round(time.time() * 1000))
    # Split the pdf files by pages
    ret=subprocess.call(['pdfseparate', file_path, "%s/%d_%%d.pdf"%(dir_path,tmp_name)])
    logger.info(ret)
    pages=len(glob.glob("%s/%d*.pdf"%(dir_path,tmp_name)))
    logger.info("set pages %s %d" % (key, pages))
    total_pages= db_client.incrby(keys, pages)
    if not total_pages :
        logger.warning("set pages fail:%s" % total_pages)
        return
    ret=subprocess.call(['mogrify', '-format', 'png', '--', "%s/%d_*.pdf"%(dir_path,tmp_name)])
    logger.info(ret)
    for i in range(pages):
        cmd=['mv',"%s/%d_%d.png"%(dir_path,tmp_name,i+1),"%s/image_%d.png"%(dir_path,total_pages-pages+i+1)]
        logger.info(cmd)
        ret=subprocess.call(cmd)
        logger.info(ret)
    # Convert the pdf files to png
    # Delete all the files
    delete_files('%s/%d_*.pdf'%(dir_path , tmp_name))
    RealtimeHandler.pubsub_static.publish(key, json.dumps({'event':'pages', 'data':{'npages':total_pages}}), None)

def process_uploaded_file_png(dir_path, fname, key):
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
    file_path = os.path.join(dir_path, fname)
    total_pages= db_client.incrby(key, 1)
    if not total_pages :
        logger.warning("set pages fail:%s" % total_pages)
        return
    subprocess.call(['mogrify', '-format', 'png', '-write',"%s/image_%d.png"%(dir_path,total_pages), '--', file_path])
    RealtimeHandler.pubsub_static.publish(key, json.dumps({'event':'pages', 'data':{'npages':total_pages}}), None)


def process_uploaded_file_other(dir_path, fname, key):
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
    file_path = os.path.join(dir_path, fname)
    logger.debug("Processing file %s" % file_path)
    pages=1
    total_pages= db_client.incrby(key, pages)
    if not total_pages :
        logger.warning("set pages fail:%s" % total_pages)
        return
    # Convert the pdf files to png
    subprocess.call(['mogrify', '-format', 'png', '-write',"%s/image_%d.png"%(dir_path,total_pages), '--', file_path])
    RealtimeHandler.pubsub_static.publish(key, json.dumps({'event':'pages', 'data':{'npages':total_pages}}), None)
