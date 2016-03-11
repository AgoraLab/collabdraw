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

    constructor: function(address, whiteboard, room, uid) {
        this.whiteboard = whiteboard;
        //console.log("Connecting to address " + address);
        this.socket = new WebSocket(address);
        this.room = room;
        this.uid = uid;
        this.page = 1;
        this.touchMove=undefined;

        _this = this;
        this.socket.onmessage = function(evt) {
            message = JXG.decompress(evt.data);
            message = JSON.parse(message);
            fromUid = message['fromUid'];
            evnt = message['event'];
            data = message['data'];
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
                    console.log("ignore message 'draw' from mine. uid " + fromUid);
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
            case 'pages':
                _this.remotePages(_this, data);
                break;
            }
        }
    },

    sendMessage: function(evt, data) {
        data["room"]=  this.whiteboard.room
        data["page_id"]=  this.whiteboard.getCurrentPageId()
        message = JSON.stringify({
            "uid": this.uid,
            "event": evt,
            "data": data
        });
        this.socket.send(message);
    },

    init: function(uid, room, currentPage) {
        console.log("Sending init for room " + room + " and page " + currentPage);
        this.whiteboard.clear(false, false);
        this.sendMessage("init", {
            "room": room,
            "sid": this.whiteboard.sid,
            "page": currentPage
        });
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
        //console.log("Sending init for room " + room);
        this.sendMessage("init", {
            "room": this.room,
            "sid": this.whiteboard.sid
        });
    },

    /**
     * Send a single path (segment) to the server
     * @param {x, y, type, lineColor, lineWidth} a point on the path
     */
    sendPath: function(data) {
        if(data.type == 'touchend' && this.touchMove ){
          this.singlePath.push(this.touchMove);
          this.touchMove=undefined;
        }
        // console.log("1111",data.type);
        if(data.type == 'touchmove'){
          if(!this.touchMove){
            this.touchMove = data;
            this.touchMove.path=[];
          }
          this.touchMove.path.push([data.x,data.y]);
        }else{
          this.singlePath.push(data);
          this.currentPathLength++;
        }
        // console.log("22222",this.currentPathLength, this.touchMove);
        // this.singlePath.push(data);

        // Send undo or redo immediately. by sunyurun@agora.io
        // Send path every two points or when user removes finger

        if (this.currentPathLength > 2 || data.type === "touchend" ||
            data.type == 'undo' || data.type == 'redo' ||
            data.type == 'addtext' || data.type == 'edittext' || data.type == 'rm') {
            // console.log("33333", this.singlePath);
            this.sendMessage("draw-click", {
                "singlePath": this.singlePath
            });
            this.singlePath = [];
            this.currentPathLength = 0;
        }
    },

    sendArrow: function(data) {
        // TODO implement data sending logic.
    },

    /**
     * Clear all other canvases (in the same room on the same page)
     */
    sendClear: function() {
        this.singlePath = [];
        this.currentPathLength = 0;
        this.sendMessage("clear", {});
    },
    delImage: function() {
        this.sendMessage("del-image", {
        });
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
            if (data == null) continue;
            if (data.drawingItem) {
                self.whiteboard.drawingItem = data.drawingItem;
            }
            // console.log("xxxxx1111", ds[d]);
            if (data.type == 'touchstart') self.whiteboard.startPath(data.oldx, data.oldy, data.lineColor, data.lineWidth, false);
            // else if (data.type == 'touchmove') self.whiteboard.continuePath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
            else if (data.type == 'touchmove'){
              if(data.path){
                // console.log("xxxxx", data.path);
                for(i in data.path){
                    self.whiteboard.continuePath(data.oldx, data.oldy, data.path[i][0], data.path[i][1], data.lineColor, data.lineWidth, false);
                }
              }else{
                self.whiteboard.continuePath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
              }
            }
            else if (data.type == 'touchend') self.whiteboard.endPath(data.oldx, data.oldy, data.x, data.y, data.lineColor, data.lineWidth, false);
            else if (data.type == 'undo') self.whiteboard.executeUndo();
            else if (data.type == 'redo') self.whiteboard.executeRedo();
            else if (data.type == 'addtext') self.whiteboard.executeAddText(data.oldx, data.oldy);
            else if (data.type == 'edittext') self.whiteboard.executeEditText(data.oldx, data.oldy, data.value);
            else if (data.type == 'rm') self.whiteboard.executeRemove(data.oldx, data.oldy);
            else { console.log("not supported operation: " + data.type); }
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
        ds = data.datas;
        for (d in ds) {
            if (ds[d] === null) continue;
            if (ds[d].drawingItem) {
                 self.whiteboard.drawingItem = ds[d].drawingItem;
            }
            if (ds[d].type == 'touchstart') self.whiteboard.startPath(ds[d].oldx, ds[d].oldy, ds[d].lineColor, ds[d].lineWidth, false);
            // else if (ds[d].type == 'touchmove') self.whiteboard.continuePath(ds[d].oldx, ds[d].oldy, ds[d].x, ds[d].y, ds[d].lineColor, ds[d].lineWidth, false);
            else if (ds[d].type == 'touchmove'){
              if(ds[d].path){
                for(i in ds[d].path){
                    self.whiteboard.continuePath(ds[d].oldx, ds[d].oldy, ds[d].path[i][0], ds[d].path[i][1], ds[d].lineColor, ds[d].lineWidth, false);
                }
              }else{
                self.whiteboard.continuePath(ds[d].oldx, ds[d].oldy, ds[d].x, ds[d].y, ds[d].lineColor, ds[d].lineWidth, false);
              }
            }
            else if (ds[d].type == 'touchend') self.whiteboard.endPath(ds[d].oldx, ds[d].oldy, ds[d].x, ds[d].y, ds[d].lineColor, ds[d].lineWidth, false);
            else if (ds[d].type == 'undo') self.whiteboard.executeUndo();
            else if (ds[d].type == 'redo') self.whiteboard.executeRedo();
            else if (ds[d].type == 'addtext') self.whiteboard.executeAddText(ds[d].oldx, ds[d].oldy);
            else if (ds[d].type == 'edittext') self.whiteboard.executeEditText(ds[d].oldx, ds[d].oldy, ds[d].value);
            else if (ds[d].type == 'rm') self.whiteboard.executeRemove(ds[d].oldx, ds[d].oldy);
            else { console.log("not supported operation: " + data.type); }
        }
        //console.log("Total pages is " + data.npages);

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
            self.whiteboard.loadImage('http://collabdraw.agoralab.co:5000/'+data.url, data.width, data.height);
        }
    },

    remotePages: function(self, data) {
        console.log("receive cmd 'pages' from server. data " + data);
        var npages = data['pages'];
        // TODO update total pages in UI
        self.whiteboard.setTotalPages(npages);
    },

});
