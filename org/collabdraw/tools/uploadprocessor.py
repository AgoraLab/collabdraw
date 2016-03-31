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
logger = logging.getLogger('websocket')

def uploadfile(filename, data):
    s3 = boto3.resource('s3')
    s3.Bucket(config.S3_BUCKET).put_object(Key=filename, Body=data, ContentType='image')


def process_uploaded_file_pdf(dir_path ,fname, room_topic, body):
    no=RealtimeHandler.gen_page_id()
    tmp_name=no
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
    for i in page_list:
        filename="%d.png"%(i)
        data = open("%s/%d_%d.png"%(dir_path,tmp_name,i-tmp_name+1), 'rb')
        uploadfile(filename ,data)
        ret[i]=filename
    # Delete all the files
    delete_files('%s/%d_*.pdf'%(dir_path , tmp_name))
    delete_files('%s/%d_*.png'%(dir_path , tmp_name))
    tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: RealtimeHandler.on_uploadfile(room_topic,ret))

def process_uploaded_file_image(ftype ,room_topic, data):
    if room_topic not in RealtimeHandler.room_data:
        logger.error("room not exist:%s"%room_topic)
        return
    page_no=RealtimeHandler.gen_page_id()
    filename="%d%s"%(page_no, ftype)
    uploadfile(filename ,data)
    tornado.ioloop.IOLoop.instance().add_callback(callback=lambda: RealtimeHandler.on_uploadfile(room_topic,{page_no:filename}))
