import logging
import threading
import subprocess
import os
import config
import cairosvg
import traceback
import mimetypes
import base64
import urllib.request
logger = logging.getLogger('websocket')

def generateSvgXml(data):
    if 'drawingItem' not in data:
        return ''
    opacity=1
    if data['drawingItem']=='highlighter':
        opacity=0.5
    color=data['lineColor']
    width=data['lineWidth']
    middle=''
    if data['drawingItem'] in ['pen','line','arrow','highlighter']:
        head='path'
        path=" L".join(["%d,%d"%(x[0],x[1]) for x in data['path']])
        other="d='M%s'"%(path)
    elif data['drawingItem'] in[ 'rectangle' ,'square']:
        head='rect'
        if len(data['path'])==2:
            other="width='%d' height='%d' rx='0' ry='0'"%(abs(data['path'][0][0]-data['path'][1][0]),abs(data['path'][0][1]-data['path'][1][1]))
    elif data['drawingItem'] == 'circle':
        head='circle'
        other=" cx='%d' cy='%d' r='%d' "%(data['path'][0][0],data['path'][0][1],abs(data['path'][0][0]-data['path'][1][0]))
    elif data['drawingItem'] == 'triangle':
        head='path'
        path=" L".join(["%d,%d"%(x[0],x[1]) for x in data['path']])
        other="d='M%sZ'"%(path)
    elif data['drawingItem'] == 'ellipse':
        head='ellipse'
        other=" cx='%d' cy='%d' rx='%d' ry='%d'"%(data['path'][0][0],data['path'][0][1],abs(data['path'][0][0]-data['path'][1][0]),abs(data['path'][0][1]-data['path'][1][1]))
    elif data['drawingItem'] == 'edittext':
        head='text'
        other=" x='%d' cy='%d'"%(data['oldx',data['oldy']])
        middle=data['value']

    return_str="<%s stroke='%s' stroke-width='%s' fill='none' opacity='%s' %s>%s</%s>"%(head,color,width,opacity,other,middle,head)
    return return_str

def gen_svg(room, page_id, path, url):
    threading.Thread(target=gen_svg_ex, args=(room, page_id, path, url)).start()

def gen_list_svg(room, list):
    # list=data["data"]
    dir_path = os.path.join(config.ROOT_DIR, "files", room)
    os.makedirs(dir_path, exist_ok=True)
    for x in list:
        gen_svg_ex(dir_path,x[0],x[1],x[2])


def img_to_datauri(image_file, image_url):
    """Convert a file (specified by a path) into a data URI."""
    logger.info("%s %s",image_file, image_url);

    if not os.path.exists(image_file):
        logger.info("from url");
        urllib.request.urlretrieve(image_url,image_file)

    mime, _ = mimetypes.guess_type(image_file)
    with open(image_file, 'rb') as fp:
        data = fp.read()
        data64 = u''.join([str(x, encoding = "utf-8") for x in base64.encodestring(data).splitlines()])
        return u'data:%s;base64,%s' % (mime, data64)

def cairosvg_svg_to_png(svg, dir_path, page_id):
    fout = open("%s/%d_thumbnail.png"%(dir_path,page_id),'wb')
    try:
        cairosvg.svg2png(bytestring=bytes(svg,'utf-8'),write_to=fout)
    except:
        logger.error(svg)
        traceback.print_exc()
    fout.close()

def svgexport_svg_to_png(svg, dir_path, page_id):
    f = open("%s/%d_thumbnail.svg"%(dir_path,page_id),'w')
    f.write(svg) # python will convert \n to os.linesep
    f.close() # you can omit in most cases as the destructor will call it
    subprocess.call(["svgexport","%s/%d_thumbnail.svg"%(dir_path,page_id),"%s/%d_thumbnail.png"%(dir_path,page_id),"200:200"])

def gen_svg_ex(dir_path, page_id, path, url):
    logger.info("gen_svg_ex start %s %d %s"%(dir_path, page_id, url))
    ret="""<?xml version="1.0"?>
        <svg height="200" version="1.1" width="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 768" fill='white'>
    """
    if url:
        # strs=url.split("/")
        # image_name=strs[len(strs)-1]
        # image_data=img_to_datauri("%s/%s"%(dir_path,image_name), url)
        ret+="""<image x="0" y="0" width="1024" height="768" xlink:href="%s"></image>
"""%url
    for i in path:
        ret+=generateSvgXml(i)+"\n"
    ret+="</svg>"
    # svgexport_svg_to_png(ret, dir_path, page_id)
    cairosvg_svg_to_png(ret, dir_path, page_id)
