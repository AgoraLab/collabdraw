enyo.kind({
    name: 'Connection',
    kind: null,

    socket: 'undefined',
    whiteboard: 'undefined',
    singlePath: [],
    currentPathLength: 0,
    uid: 'uid',
    room: 'undefined',
    page: 1,

    constructor: function(address, whiteboard, room, uid, connLostCallback) {
        this.whiteboard = whiteboard;
        //console.log("Connecting to address " + address);
        this.socket = new WebSocket(address);
        this.room = room;
        this.uid = uid;
        this.page = 1;
        this.touchMove=undefined;
        _this = this;
        this.socket.onmessage = function(evt) {
            var message = JSON.parse(JXG.decompress(evt.data)),
                fromUid = message['fromUid'],
                evnt    = message['event'],
                data    = message['data'];

            console.log('receive msg from server. uid ' + fromUid + ' event ' + evnt + ' data ' + JSON.stringify(data));
            switch (evnt) {
            case 'ready':
                _this.init(_this.uid, _this.room, _this.page);
                break;
            case 'draw':
                if (_this.uid == fromUid) {
                    console.log("ignore message 'draw' from mine. uid " + fromUid);
                    break;
                }
                _this.remoteDraw(_this, data);
                break;
            case 'draw-many':
                if (_this.uid == fromUid) {
                    console.log("ignore message 'draw-many' from mine. uid " + fromUid);
                    break;
                }
                _this.remoteDrawMany(_this, data);
                break;
            case 'clear':
                _this.remoteClear(_this, data);
                break;
            case 'image':
                _this.remoteImage(_this, data);
                break;
            case 'delete-page':
                _this.remoteDelPage(_this, data);
                break;
            case 'pages':
                _this.remotePages(_this, data);
                break;
            case 'laser-move':
                if (_this.uid === fromUid) {
                    console.log("ignore message 'laser-move' from mine. uid " + fromUid);
                    break;
                }
                _this.remoteLaserMove(_this, data);
                break;
            case 'laser-draw':
                if (_this.uid === fromUid) {
                    console.log("ignore message 'laser-draw' from mine. uid " + fromUid);
                    break;
                }
                _this.remoteLaserDraw(_this, data);
                break;
            case 'laser-remove':
                if (_this.uid === fromUid) {
                    console.log("ignore message 'laser-remove' from mine. uid " + fromUid);
                    break;
                }
                _this.remoteLaserRemove(_this, data);
                break;
            case 'change-page':
                if (_this.uid === fromUid) {
                    console.log("ignore message 'change-page' from mine. uid " + fromUid);
                    break;
                }

                if (data['page_id'] === _this.whiteboard.getCurrentPageId()) {
                    break;
                }

                _this.whiteboard.setTotalPages(data['page_list']);
                _this.changePage(data['page_id']);
                break;
            }
        };

        this.socket.onerror = function(err) {
            alert("error occured, please refresh your browser to rejoin.");
            console.log(err);
        }

        this.socket.onclose = function(event) {
            var code = event.code;
            var reason = event.reason;
            var wasClean = event.wasClean;

            console.log("Connection lost @ " + Date.now());
            if (connLostCallback && $.isFunction(connLostCallback)) {
                connLostCallback();
            }
        };
    },

    sendMessage: function(evt, data) {
        data["room"]=  this.whiteboard.room
        data["page_id"]=  this.whiteboard.getCurrentPageId()
        message = JSON.stringify({
            "uid": this.uid,
            "event": evt,
            "data": data
        });
        console.log('sendms:',message);
        this.socket.send(message);
    },

    init: function(uid, room, currentPage) {
        console.log("Sending init for room " + room + " and page " + currentPage);
        this.whiteboard.clear(false, false);
        this.sendMessage("init", {
            "room": room,
            "vid": this.whiteboard.vid,
            "page": currentPage
        });
    },

    changePage: function(pageId) {
        var page = this.whiteboard.getPageById(pageId);
        this.whiteboard.gotoPage(page);
    },

    /**
     * Get data from server to initialize this whiteboard
     * @param {Object} uid
     * @param {Object} room
     * @param {Object} page
     */
    joinRoom: function(room, page) {
        this.room = room;
        this.singlePath = [];
        this.currentPathLength = 0;
        this.whiteboard.clear(false, false);
        console.log("Sending init for room " + room+' '+page);
        this.sendMessage("init", {
            "room": this.room,
            "vid": this.whiteboard.vid,
        });
    },

    /**
     * Send a single path (segment) to the server
     * @param {x, y, type, lineColor, lineWidth} a point on the path
     */
    sendPath: function(data) {
        if (data.type == 'touchend') {
            this.touchMove.path.push([data.x,data.y]);
            this.touchMove.guid = data.guid;
            this.singlePath.push(this.touchMove);
            this.currentPathLength++;
            this.touchMove=undefined;
        } else if (data.type == 'touchstart') {
            this.touchMove = data;
            this.touchMove.type='touchmovement';
            this.touchMove.path=[];
            this.touchMove.path.push([data.oldx,data.oldy]);
        }else if(data.type == 'touchmove'){
            this.touchMove.path.push([data.x,data.y]);
        }else{
            this.singlePath.push(data);
            this.currentPathLength++;
        }

        // Send undo or redo immediately. by sunyurun@agora.io
        // Send path every two points or when user removes finger

        if (this.currentPathLength > 2 || data.type == "touchend" ||
            data.type == 'undo' || data.type == 'redo' ||
            data.type == 'addtext' || data.type == 'edittext'
            || data.type == 'rm'  ) {
            // console.log("33333", this.singlePath);
            this.sendMessage("draw-click", {
                "singlePath": this.singlePath
            });
            this.singlePath = [];
            this.currentPathLength = 0;
        }
    },

    /**
     * Clear all other canvases (in the same room on the same page)
     */
    sendClear: function() {
        this.singlePath = [];
        this.currentPathLength = 0;
        this.sendMessage("clear", {});
    },

    sendLaserEvent: function(eventName, data) {
        data = data || {};
        data["room"] =  this.whiteboard.room;
        data["page_id"] =  this.whiteboard.getCurrentPageId();
        message = JSON.stringify({
            "uid": this.uid,
            "event": eventName,
            "data": data
        });
        this.socket.send(message);
    },

    deletePage: function() {
        this.sendMessage("delete-page", {});
    },

    getImage: function() {
        //console.log("Getting image for page " + this.page);
        this.sendMessage("get-image", {
            "room": this.room,
            "page": this.page
        });
    },

    /**
     * Make video remotely
     */
    makeVideo: function() {
        this.sendMessage("video", {});
    },

    /*
     * Create a new page
     */
    newPage: function() {
        this.whiteboard.clear(false, false);
        this.sendMessage("new-page", {});
    },

    /***
     * All remote functions below
     */

    drawEx:function(self, data){
        if (data == null) return;
        if (data.drawingItem) {
            self.whiteboard.drawingItem = data.drawingItem;
        }
        if (data.type == 'touchstart') self.whiteboard.startPath(data.oldx, data.oldy, data.lineColor, data.lineWidth, false);
        // else if (data.type == 'touchmove') self.whiteboard.continuePath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
        else if (data.type == 'touchmove'){
          if(data.path){
            for(i in data.path){
                self.whiteboard.continuePath(data.oldx, data.oldy, data.path[i][0], data.path[i][1], data.lineColor, data.lineWidth, false);
            }
          }else{
            self.whiteboard.continuePath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
          }
        }
        else if (data.type == 'touchmovement'){
          if(data.path){
            for(i in data.path){
                if(i==0){
                    self.whiteboard.startPath(data.path[i][0], data.path[i][1], data.lineColor, data.lineWidth, false);
                }else if(i==data.path.length-1){
                    self.whiteboard.endPath(data.oldx, data.oldy,data.path[i][0], data.path[i][1], data.lineColor, data.lineWidth, data.guid, false);
                }else{
                    self.whiteboard.continuePath(data.oldx, data.oldy, data.path[i][0], data.path[i][1], data.lineColor, data.lineWidth, false);
                }
            }
          }else{
            self.whiteboard.continuePath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
          }
        }
        else if (data.type == 'touchend') {
            self.whiteboard.endPath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, data.guid, false);
        }
        else if (data.type == 'undo') {
            self.whiteboard.executeUndo2(false, data.guid);
        }
        else if (data.type == 'redo') {
            self.whiteboard.executeRedo2(false, data.guid);
        }
        else if (data.type == 'addtext') {
            self.whiteboard.executeAddText(data.oldx, data.oldy);
        }
        else if (data.type == 'edittext') {
            self.whiteboard.executeEditText(data.oldx, data.oldy, data.value);
        }
        else if (data.type == 'rm') {
            //self.whiteboard.executeRemove(data.oldx, data.oldy);
            self.whiteboard.removeSelected(false, data.guid);
        }
        else { console.log("not supported operation: " + data.type); }
    },
    /**
     * Draw from realtime data incoming from server
     * Called when server sends @event 'draw'
     * @param {Object} self
     * @param {singlePath: [points...]} input
     */
    remoteDraw: function(self, input) {
        var sPath = input.singlePath;
        var data = {};
        // point on path
        for (d in sPath) {
            data = sPath[d];
            self.drawEx(self, data)
        }
    },

    /**
     * Draw from stored data incoming from server
     * Called when server sends @event 'draw-many'
     * @param {Object} self
     * @param {datas:[points...]} data
     */
    remoteDrawMany: function(self, data) {
        console.log(data);
        self.whiteboard.setTotalPages(data.pages);

        var pageId = self.whiteboard.getPageById(data["page_id"]);
        self.whiteboard.setCurrentPage(pageId);
        ds = data.datas;
        for (d in ds) {
            self.drawEx(self, ds[d])
        }
    },

    /**
     * Clear from server
     * Called when server sends @event 'clear'
     * @param {Object} self
     * @param {Object} data
     */
    remoteClear: function(self, data) {
        self.whiteboard.clear(false);
    },
    remoteImage: function(self, data) {
        if (data.url != "") {
            var img = document.createElement('img');
            img.src = data.url;
            console.log("Image url is " + data.url);
            self.whiteboard.loadImage(data.url, data.width, data.height);
        }
    },
    remoteDelPage: function(self, data) {
        console.log("receive cmd 'del-page' from server. data " + data);
        var page_id=data['page_id'];
        var cur_id=self.whiteboard.getCurrentPageId();
        var cur_page=self.whiteboard.getCurrentPage();
        var npages = data['pages'];
        // TODO update total pages in UI
        self.whiteboard.setTotalPages(npages);
        if(page_id==cur_id){
            if(cur_page >= self.whiteboard.getNumPages()){
              self.whiteboard.prevPage()
            }else{
              self.whiteboard.gotoPage(cur_page);
            }
        }else{
          self.whiteboard.gotoPage(self.whiteboard.getPageById(cur_id));
        }
    },

    remotePages: function(self, data) {
        console.log("receive cmd 'pages' from server. data " + data);
        var npages = data['pages'];
        // TODO update total pages in UI
        self.whiteboard.setTotalPages(npages);
    },

    remoteLaserMove: function(self, data) {
        self.whiteboard.removeLaser();
        self.whiteboard.drawLaser(data.x, data.y)
    },

    remoteLaserDraw: function(self, data) {
        self.whiteboard.drawLaser(data.x, data.y)
    },

    remoteLaserRemove: function(self, data) {
        self.whiteboard.removeLaser();
    }

});
