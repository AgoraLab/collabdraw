import logging
import threading
import subprocess
import os
import config
import cairosvg
logger = logging.getLogger('websocket')

def generateSvgXml(data):
    opacity=1
    if data['drawingItem']=='highlighter':
        opacity=0.5
    color=data['lineColor']
    width=data['lineWidth']
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
    return_str="<%s stroke='%s' stroke-width='%s' fill='none' opacity='%s' %s></%s>"%(head,color,width,opacity,other,head)
    return return_str

def gen_svg(room, page_id, path, url):
    threading.Thread(target=gen_svg_ex, args=(room, page_id, path, url)).start()

def cairosvg_svg_to_png(svg,dir_path, page_id):
    fout = open("%s/%d_thumbnail.png"%(dir_path,page_id),'wb')
    cairosvg.svg2png(bytestring=bytes(svg,'utf-8'),write_to=fout)
    fout.close()

def svgexport_svg_to_png(svg, dir_path, page_id):
    f = open("%s/%d_thumbnail.svg"%(dir_path,page_id),'w')
    f.write(svg) # python will convert \n to os.linesep
    f.close() # you can omit in most cases as the destructor will call it
    subprocess.call(["svgexport","%s/%d_thumbnail.svg"%(dir_path,page_id),"%s/%d_thumbnail.png"%(dir_path,page_id),"200:200"])

def gen_svg_ex(room, page_id, path, url):
    logger.info("gen_svg_ex start %s %d %s"%(room, page_id, url))
    dir_path = os.path.join(config.ROOT_DIR, "files", room)
    ret="""<?xml version="1.0"?>
        <svg height="200" version="1.1" width="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 768" fill='white'>
    """
    if url:
        ret+="""<image x="0" y="0" width="200" height="200" preserveAspectRatio="none" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="%s"></image>
"""%url
    for i in path:
        ret+=generateSvgXml(i)+"\n"
    ret+="</svg>"
    # svgexport_svg_to_png(ret, dir_path, page_id)
    cairosvg_svg_to_png(ret, dir_path, page_id)



    # f = open("%s/%d_thumbnail.svg"%(dir_path,page_id),'w')
    # f.write(ret) # python will convert \n to os.linesep
    # f.close() # you can omit in most cases as the destructor will call it
    # subprocess.call(["svgexport","%s/%d_thumbnail.svg"%(dir_path,page_id),"%s/%d_thumbnail.png"%(dir_path,page_id),"200:200"])

# path=[
#     {"drawingItem": "pen", "lineColor": "black", "oldy": 360, "lineWidth": "3px", "type": "touchmovement", "oldx": 672, "path": [[672, 360], [722, 412], [748, 421], [773, 415], [797, 385], [812, 356], [814, 346], [815, 331], [815, 315], [813, 298], [809, 276], [798, 252], [762, 223], [715, 209], [705, 199], [721, 172], [762, 144], [801, 132], [802, 131]]},
# {"drawingItem": "rectangle", "lineColor": "black", "oldy": 515, "lineWidth": "3px", "type": "touchmovement", "oldx": 508, "path": [[508, 515], [607, 546]]},
# {"drawingItem": "square", "lineColor": "black", "oldy": 588, "lineWidth": "3px", "type": "touchmovement", "oldx": 505, "path": [[505, 588], [610, 627]]},
# {"drawingItem": "circle", "lineColor": "black", "oldy": 512, "lineWidth": "3px", "type": "touchmovement", "oldx": 677, "path": [[677, 512], [718, 532]]},
# {"drawingItem": "triangle", "lineColor": "black", "oldy": 624, "lineWidth": "3px", "type": "touchmovement", "oldx": 656, "path": [[656, 624], [721, 657]]},
# {"drawingItem": "line", "lineColor": "black", "oldy": 492, "lineWidth": "3px", "type": "touchmovement", "oldx": 844, "path": [[844, 492], [802, 555]]},
# {"drawingItem": "arrow", "lineColor": "black", "oldy": 626, "lineWidth": "3px", "type": "touchmovement", "oldx": 802, "path": [[802, 626], [893, 627]]},
# {"drawingItem": "ellipse", "lineColor": "black", "oldy": 679, "lineWidth": "3px", "type": "touchmovement", "oldx": 798, "path": [[798, 679], [848, 694]]},
# {"drawingItem": "pen", "lineColor": "black", "oldy": 600, "lineWidth": "10px", "type": "touchmovement", "oldx": 224, "path": [[224, 600], [274, 599], [302, 606], [310, 619], [312, 639], [304, 658], [254, 672], [220, 674], [216, 634], [220, 609], [222, 605]]},
# {"drawingItem": "highlighter", "lineColor": "black", "oldy": 175, "lineWidth": "10px", "type": "touchmovement", "oldx": 389, "path": [[389, 175], [505, 326], [531, 356], [549, 374], [562, 387], [567, 391]]},
# {"drawingItem": "highlighter", "lineColor": "black", "oldy": 385, "lineWidth": "10px", "type": "touchmovement", "oldx": 342, "path": [[342, 385], [535, 565], [535, 565]]},
# {"drawingItem": "highlighter", "lineColor": "black", "oldy": 250, "lineWidth": "10px", "type": "touchmovement", "oldx": 627, "path": [[627, 250], [541, 406], [430, 404], [442, 282], [573, 149], [713, 337], [715, 345]]},
# {"drawingItem": "rectangle", "lineColor": "black", "oldy": 295, "lineWidth": "10px", "type": "touchmovement", "oldx": 262, "path": [[262, 295], [381, 349]]},
# {"drawingItem": "circle", "lineColor": "black", "oldy": 99, "lineWidth": "6px", "type": "touchmovement", "oldx": 199, "path": [[199, 99], [354, 123]]},
# {"drawingItem": "triangle", "lineColor": "black", "oldy": 56, "lineWidth": "6px", "type": "touchmovement", "oldx": 493, "path": [[493, 56], [556, 86]]},
# {"drawingItem": "triangle", "lineColor": "black", "oldy": 59, "lineWidth": "6px", "type": "touchmovement", "oldx": 426, "path": [[426, 59], [422, 69]]},
# {"drawingItem": "pen", "lineColor": "red", "oldy": 408, "lineWidth": "6px", "type": "touchmovement", "oldx": 167, "path": [[167, 408], [184, 486], [221, 536], [256, 546], [351, 509], [417, 465]]}
# ]
# gen_svg_ex('',123,path,None)
