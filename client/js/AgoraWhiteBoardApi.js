/*
 * AgoraWhiteBoardApi.js - Javascript API for Agora White Borad
 * GNU Licensed
 * Sun Yurun (sunyurun@agora.io)
 * http://agora.io
 * https://github.com/AgoraLab/collabdraw
 *
 */

var ErrorTable = {
     0: 'ok',
     1: 'agora vom service unavailable',
     2: 'no channel available',
     4: 'too many users',
     5: 'invalid vendor key',
     6: 'agora master vocs unavailable',
     7: 'invalid channel name',
     8: 'agora internal error',
     9: 'no authorized',
     10: 'dynamic key timeout',
     11: 'no active status',
     12: 'timeout',
     13: 'canceled'
 };

function AgoraWhiteBoardApi() {
    this.canvasHeight = -1;
    this.canvasWidth = -1;
    this.canvasNode = null;
    this.cname = '';

    this.defaultCanvasHeight = function() {
        return this.canvasNode ? $(this.canvasNode).height() : 600;
    }
    this.defaultCanvasWidth = function() {
        return this.canvasNode ? $(this.canvasNode).width() : 800;
    }

    this.join = function(key, cname, uinfo, onJoin) {
        this.cname = cname;
        $.get('http://127.0.0.1:5000/join', {key: key, cname: cname, uinfo: uinfo},
    		function (result, status) {
    			if (!result || result.length == 0) {
    				onJoin(-10, 'empty result from agora server', cname, uinfo)
    				return;
    			}
                console.log(JSON.stringify(result));
                onJoin(result.code, ErrorTable[result['code'].toString()], cname, uinfo);
    		}
    	).fail(function(xhr, textStatus, errorThrown) { console.log("ajax fail");});
    }

    this.quit = function() {


    }

    this.render = function() {
        if (!this.canvasNode || (this.cname == '')) {
            return;
        }
        var app = new App();
        app.setAppIpAddress('127.0.0.1');
        app.setAppPort(5000);
        app.setCanvasHeight(this.canvasHeight == -1 ? this.defaultCanvasHeight() : this.canvasHeight);
        app.setCanvasWidth(this.canvasWidth == -1 ? this.defaultCanvasWidth() : this.canvasWidth);
        app.setRoom(this.cname);
        console.log('[render] height: ' + app.getCanvasHeight() + ' width: ' + app.getCanvasWidth() + ' room: ' + this.cname);
        app.renderInto(this.canvasNode);
    }
}
