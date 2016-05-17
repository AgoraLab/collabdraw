__author__ = 'anand'

import subprocess
import glob
import os
import logging
import time
import json
import config
import urllib
import hmac
from ..dbclient.dbclientfactory import DbClientFactory
from org.collabdraw.tools.tools import delete_files
from ..handler.websockethandler import RealtimeHandler
import tornado.ioloop
from tornado.httpclient import AsyncHTTPClient
from tornado.httpclient import HTTPClient
import boto3
import collections
import traceback
import multiprocessing
import queue
from concurrent.futures import ThreadPoolExecutor,as_completed
from ..handler.joinhandler import unsigned_hash


logger = logging.getLogger('websocket')
from tornado import gen
import oss2
aliyun_auth = oss2.Auth('Lx9RJ90JpE9dvatH', 'vUrtgWOdmUzhGjXBMcJhwX2aZhoqls')

# def uploadfile_aliyun(filename, localfile):
#     ts=time.time()
#     bucket = oss2.Bucket(aliyun_auth, 'oss-cn-shanghai.aliyuncs.com', 'whiteboard-image')
#     bucket.put_object_from_file(filename, localfile)
#     logger.info("upload succ %s %s takes %.1f"%(localfile,filename,(time.time()-ts)))
#
#
# def uploaddata_aliyun(filename, data):
#     bucket = oss2.Bucket(aliyun_auth, 'oss-cn-shanghai.aliyuncs.com', 'whiteboard-image')
#     bucket.put_object(filename, data)
#     logger.info("upload succ %s"%filename)
#
# def uploadfile_aws():
#     s3 = boto3.resource('s3')
#     b=s3.Bucket(config.S3_BUCKET)
#     logger.info("upload s3 create bucket %s"%(filename))
#     ret=b.put_object(Key=filename, Body=data, ContentType='image')

# @gen.coroutine
def uploadfile(filename, data,q):
    logger.info("uploadfile %s"%data)
    http_client = HTTPClient()
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    msg={"fname":filename,"fbody":data.decode("latin-1")}
    body=json.dumps(msg)
    url = "http://119.9.92.228:5100/innerupload"
    try:
        ret=http_client.fetch(url, method='POST', headers=headers, body=body)
        ret=str(ret.body)
    except:
        traceback.print_exc()
        ret='fail'
    logger.info("http return %s"%ret.body)
    q.put(ret)

def process_uploaded_file_pdf(dir_path ,fname, room_topic, body):
    no=RealtimeHandler.gen_page_id()
    tmp_name=no
    # save pdf
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, "%d.pdf"%tmp_name)
    fh = open(file_path, 'wb')
    fh.write(body)
    fh.close()
    # Split the pdf files by pages
    subprocess.call(['pdfseparate', file_path, "%s/%d_%%d.pdf"%(dir_path,tmp_name)])
    pages=len(glob.glob("%s/%d_*.pdf"%(dir_path,tmp_name)))
    page_list=[i+no for i in range(pages)]
    # Convert the pdf files to png
    subprocess.call(['mogrify', '-format', 'png', '--', "%s/%d_*.pdf"%(dir_path,tmp_name)])

    ret=collections.OrderedDict()
    prefix=unsigned_hash("%s:%s:%s"%(dir_path,config.APP_IP_ADDRESS,config.APP_PORT))
    q = queue.Queue()
    res='succ'
    with ThreadPoolExecutor(max_workers=100) as executor:
        for i in page_list:
            filename="%x%x.png"%(prefix, i)
            ret[i]=filename
            localfile = "%s/%d_%d.png"%(dir_path,tmp_name,i-tmp_name+1)
            with open(localfile, 'rb') as f:
                executor.submit(uploadfile, filename, f.read(), q)
    while not q.empty():
        if q.get() != 'succ' :
            res='fail'
            break

    logger.info("upload all %s"%res)
    # Delete all the files
    delete_files('%s/%d_*.pdf'%(dir_path , tmp_name))
    delete_files('%s/%d_*.png'%(dir_path , tmp_name))
    if res=='succ':
        tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: RealtimeHandler.on_uploadfile(room_topic,ret))

    return res

def process_uploaded_file_image(ftype ,room_topic, data):
    if room_topic not in RealtimeHandler.room_data:
        logger.error("room not exist:%s"%room_topic)
        return
    page_no=RealtimeHandler.gen_page_id()
    prefix=unsigned_hash("%s:%s:%s"%(room_topic,config.APP_IP_ADDRESS,config.APP_PORT))
    filename="%x%x%s"%(prefix, page_no, ftype)
    ret='succ'
    q = queue.Queue()
    with ThreadPoolExecutor(max_workers=10) as executor:
        executor.submit(uploadfile, filename, data, q)
    while not q.empty():
        if q.get() != 'succ' :
            ret='fail'
            break
    logger.info("process_uploaded_file_image finish %s"%ret)
    if ret=='succ':
        tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: RealtimeHandler.on_uploadfile(room_topic,{page_no:filename}))
    return ret
