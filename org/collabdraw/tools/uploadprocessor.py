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
import tornado.ioloop

logger = logging.getLogger('websocket')

def process_uploaded_file_pdf(dir_path, fname, key, cookie):
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)

    file_path = os.path.join(dir_path, fname)
    tmp_name=int(round(time.time() * 1000))
    # Split the pdf files by pages
    ret=subprocess.call(['pdfseparate', file_path, "%s/%d_%%d.pdf"%(dir_path,tmp_name)])
    logger.info(ret)
    pages=len(glob.glob("%s/%d*.pdf"%(dir_path,tmp_name)))
    logger.info("rpush pages %s %d" % (key, pages))
    no=RealtimeHandler.gen_page_id()
    page_list=[i+no for i in range(pages)]
    ret=db_client.rpush(key, page_list)
    if not ret :
        return
    ret=subprocess.call(['mogrify', '-format', 'png', '--', "%s/%d_*.pdf"%(dir_path,tmp_name)])
    for i in range(pages):
        cmd=['mv',"%s/%d_%d.png"%(dir_path,tmp_name,i+1),"%s/image_%d.png"%(dir_path,page_list[i])]
        ret=subprocess.call(cmd)
    # Convert the pdf files to png
    # Delete all the files
    delete_files('%s/%d_*.pdf'%(dir_path , tmp_name))
    page_list=db_client.lrange(key, 0, -1)
    tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: cookie.broadcast_message(key,{'event':'pages', 'data':{'pages':page_list}}))

def process_uploaded_file_png(dir_path, fname, key, cookie):
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
    file_path = os.path.join(dir_path, fname)
    page_no=RealtimeHandler.gen_page_id()
    ret=db_client.rpush(key, [page_no])
    if not ret :
        return
    subprocess.call(['mogrify', '-format', 'png', '-write',"%s/image_%d.png"%(dir_path,page_no), '--', file_path])
    page_list=db_client.lrange(key, 0, -1)
    tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: cookie.broadcast_message(key,{'event':'pages', 'data':{'pages':page_list}}))

def process_uploaded_file_other(dir_path, fname, key, cookie):
    db_client = DbClientFactory.getDbClient(config.DB_CLIENT_TYPE)
    file_path = os.path.join(dir_path, fname)
    # logger.debug("Processing file %s" % file_path)
    page_no=RealtimeHandler.gen_page_id()
    ret=db_client.rpush(key, [page_no])
    if not ret :
        return
    # Convert the pdf files to png
    subprocess.call(['mogrify', '-format', 'png', '-write',"%s/image_%d.png"%(dir_path,page_no), '--', file_path])
    page_list=db_client.lrange(key, 0, -1)
    logger.info(page_list)
    tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: cookie.broadcast_message(key,{'event':'pages', 'data':{'pages':page_list}}))
