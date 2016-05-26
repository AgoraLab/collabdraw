/**
 * This contains all the local functions to interact with the whiteboard. It also contains
 * interfaces to the Connection class.
 */

enyo.kind({
    name: 'WhiteboardSvg',
    kind: null,

    cvs: 'undefined',
    currentPage: 1,
    totalPages: -1,
    uid: "",
    room: "",
    connection: 'undefined',
    callback: 'undefined',

    getNumPages: function() {
        return this.totalPages;
    },

    getCurrentPage: function() {
        return this.currentPage;
    },

    setCurrentPage: function(pageId) {
        this.currentPage = pageId;
        // update page info
        this.callback(this.totalPages, this.currentPage);
    },

    getPageById: function(pageid) {
        var index, length;
        for (index = 0, length = this.page_list.length; index < length; index += 1) {
            if (this.page_list[index] === pageid) {
                return index + 1;
            }
        }
        // default return page no. 1.
        return 1;
    },
    getCurrentPageId: function() {
        return this.page_list[this.currentPage-1];
    },
    getPageIdByPage: function(page) {
        return this.page_list[page-1];
    },

    /**
     * @class WhiteboardSvg
     * @param parent: Class canvasContainer
     * @param callback: called once the page is rendered
     */
    constructor: function(name, parent, page, websocketAddress, userRole, callback) {
        this.parent_         = parent;
        this.uid             = parent.uid;
        this.vid             = parent.vid;
        this.room            = parent.room;
        this.cvs             = new ScaleRaphael(name, parent.canvasWidth, parent.canvasHeight);
        this.d3SVG           = d3.select(this.cvs.canvas);
        this.connection      = new Connection(websocketAddress, this, this.room, this.uid);
        this.callback        = callback;
        this.zoomRatio       = 1;
        this.page_list       = [];
        this.drawingItem     = 'pen';
        this.element         = null;
        this.drawStartX      = 0;
        this.drawStartY      = 0;
        this.undoStack       = [];
        this.redoStack       = [];
        this.textEdits       = {};
        this.penPoints       = [];
        this.penCbkCount     = 0;
        this.penFunction     = d3.svg.line().interpolate('cardinal');
        this.penPathID       = 10000;
        this.currentSelected = null;
        this.laserPen        = null;
        this.userRole        = userRole;
        this.canvasHeight    = parent.canvasHeight;
        this.canvasWidth     = parent.canvasWidth;
    },

    /**
     * Join specified room
     * @param {Object} room
     */
    joinRoom: function(room) {
        this.room = room;
        this.connection.joinRoom(room);
    },

    /**
     * Getter for cvs
     */
    getCanvas: function() {
        return this.cvs;
    },

    getDrawingItem: function() {
        return this.drawingItem;
    },

    setDrawingItem: function(drawingItem) {
        this.drawingItem = drawingItem;
    },

    // start, move, and up are the drag functions
    //start: function() {
        //// storing original coordinates
        //this.ox = this.attr("x");
        //this.oy = this.attr("y");
        //this.attr({
            //opacity: 1
        //});
        //if (this.attr("y") < 60 && this.attr("x") < 60) this.attr({
            //fill: "#000"
        //});
    //},

    //move: function(dx, dy) {
        //// move will be called with dx and dy
        //if (this.attr("y") > 200 || this.attr("x") > 300) this.attr({
            //x: this.ox + dx,
            //y: this.oy + dy
        //});
        //else {
            //nowX = Math.min(300, this.ox + dx);
            //nowY = Math.min(200, this.oy + dy);
            //nowX = Math.max(0, nowX);
            //nowY = Math.max(0, nowY);
            //this.attr({
                //x: nowX,
                //y: nowY
            //});
            //if (this.attr("fill") != "#000") this.attr({
                //fill: "#000"
            //});
        //}
    //},

    //up: function() {
        //// restoring state
        //this.attr({
            //opacity: .5
        //});
        //if (this.attr("y") < 60 && this.attr("x") < 60) this.attr({
            //fill: "#AEAEAE"
        //});
    //},
    zoomConvert: function(x){
        x = x /  this.zoomRatio;
        // x += x*(1-this.zoomRatio)/2;
        // y += y*(1-this.zoomRatio);
        return x
    },
    /**
     * Called when user starts a path
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    startPath: function(x, y, lc, lw, send) {
        // calculate x and y after being zoomed.
        // x += x * (1 - this.zoomRatio);
        // y += y * (1 - this.zoomRatio);
        if (send){
            x = this.zoomConvert(x);
            y = this.zoomConvert(y);
        }
        this.drawStartX = x;
        this.drawStartY = y;

        switch(this.drawingItem) {
            case 'pen':
                this.drawPath2(x, y, lc, lw, 1);
                break;
            case 'highlighter':
                this.drawPath2(x, y, lc, lw, 0.5);
                break;
            case 'arrow':
            case 'line':
            case 'triangle':
                if (!this.element) {
                    this.element  = this.cvs.path("M" + x + " " + y);
                }
                break;
            case 'circle':
                if (!this.element) {
                    this.element = this.cvs.circle(x, y, 0);

                    //this.element.drag(this.move, this.start, this.up);
                    this.element.attr({
                        "stroke": lc,
                        "stroke-width": lw
                    });
                }
                break;
            case 'square':
            case 'rectangle':
                if (!this.element) {
                    this.element = this.cvs.rect(x, y, 0, 0);
                    //this.element.drag(this.move, this.start, this.up);
                    this.element.attr({
                        "stroke": lc,
                        "stroke-width": lw
                    });
                }
                break;
            case 'ellipse':
                if (!this.element) {
                    this.element = this.cvs.ellipse(x, y, 0, 0);
                    //this.element.drag(this.move, this.start, this.up);
                    this.element.attr({
                        "stroke": lc,
                        "stroke-width": lw
                    });
                }
                break;
            default:
                console.log("startPath: unknown item. ignore");
                return;
        }
        if (send) {
            this.connection.sendPath({
                oldx: x,
                oldy: y,
                type: 'touchstart',
                lineColor: lc,
                lineWidth: lw,
                drawingItem: this.drawingItem
            });
        }
    },

    /**
     * Called when user continues path (without lifting finger)
     */
    continuePath: function(oldx, oldy, x, y, lc, lw, send) {
        // x += x * (1 - this.zoomRatio);
        // y += y * (1 - this.zoomRatio);
        if(send){
            x=this.zoomConvert(x);
            y=this.zoomConvert(y);
        }
        var reallyNeedToSend = false;
        switch(this.drawingItem) {
            case 'pen':
                if (!send) { // it's from server
                    this.drawPath2(x, y, lc, lw, 1);
                    break;
                }
                // it's local drawing
                this.penCbkCount++;
                if (this.penCbkCount % 8 == 0) {
                    this.drawPath2(x, y, lc, lw, 1);
                    reallyNeedToSend = true;
                    break;
                }
                break;

            case "highlighter":
                if (!send) { // it's from server
                    this.drawPath2(x, y, lc, lw, 0.5);
                    break;
                }
                // it's local drawing
                this.penCbkCount++;
                if (this.penCbkCount % 8 == 0) {
                    this.drawPath2(x, y, lc, lw, 0.5);
                    reallyNeedToSend = true;
                    break;
                }
                break;

            case 'arrow':
                if (this.element) {
                    var path = "M" + this.drawStartX + " " + this.drawStartY + "L" + x + " " + y;
                    this.element.attr({
                        "path": path,
                        "stroke": lc,
                        "stroke-width": lw,
                        "arrow-end": "open-medium-medium"
                    });
                }
                break;

            case "line":
                if (this.element) {
                    var path = "M" + this.drawStartX + " " + this.drawStartY + "L" + x + " " + y;
                    this.element.attr({
                        "path": path,
                        "stroke": lc,
                        "stroke-width": lw,
                    });
                }
                break;

            case 'triangle':
                if (this.element) {
                    var otherX = x - this.drawStartX;
                    var path = "M" + this.drawStartX + " " + this.drawStartY + "L" + x + " " + y + "L"
                        + String(this.drawStartX - otherX) + " " + y + "Z";
                    this.element.attr({
                        "path": path,
                        "stroke": lc,
                        "stroke-width": lw,
                    });
                }
                break;
            case 'circle':
                if (this.element) {
                    var width  = x - this.drawStartX,
                        height = y - this.drawStartY,
                        radius = Math.max(Math.abs(width), Math.abs(height));

                    this.element.attr({
                        "r": radius
                    });
                }
                break;
            case 'square':
                if (this.element) {
                    var width = x - this.drawStartX,
                        height = y - this.drawStartY,
                        lineWidth = Math.max(width, height);

                    this.element.attr({
                        "width": lineWidth > 0 ? lineWidth: 0,
                        "height": lineWidth > 0 ? lineWidth: 0
                    });
                }
                break;
            case 'rectangle':
                if (this.element) {
                    var width = x - this.drawStartX,
                        height = y - this.drawStartY;

                    this.element.attr({
                        "width": width > 0 ? width : 0,
                        "height": height > 0 ? height : 0
                    });
                }
                break;
            case 'ellipse':
                if (this.element) {
                    var width = x - this.drawStartX,
                        height = y - this.drawStartY;

                    this.element.attr({
                        "rx": width > 0 ? width : 0,
                        "ry": height > 0 ? height : 0
                    });
                }
                break;
            default:
                //console.log("continuePath: unknown item. ignore");
                return;
        }

        if (reallyNeedToSend) {
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchmove',
                lineColor: lc,
                lineWidth: lw,
                drawingItem: this.drawingItem
            });
        }
    },

    /**
     * Called when user lifts finger
     */
    endPath: function(oldx, oldy, x, y, lc, lw, guidRemote, send) {
        var guid;
        // x += x * (1 - this.zoomRatio);
        // y += y * (1 - this.zoomRatio);
        if (send){
            x = this.zoomConvert(x);
            y = this.zoomConvert(y);
        }
        switch(this.drawingItem) {
            case 'pen':
                guid = guidRemote || this.currentPathID();

                this.drawPath2(x, y, lc, lw, 1);
                this.undoStack.push({
                    type: 'path-line',
                    pathID: this.currentPathID(),
                    datum: this.penPoints,
                    lineColor: lc,
                    lineWidth: lw
                });
                this.penPoints = [];
                this.penCbkCount = 0;
                break;
            case 'highlighter':
                guid = guidRemote || this.currentPathID();

                this.drawPath2(x, y, lc, lw, 0.5);
                this.undoStack.push({
                    type: 'path-line',
                    pathID: this.currentPathID(),
                    datum: this.penPoints,
                    lineColor: lc,
                    lineWidth: lw
                });
                this.penPoints = [];
                this.penCbkCount = 0;
                break;
            case 'arrow':
            case 'triangle':
            case 'line':
            case 'circle':
            case 'square':
            case 'ellipse':
            case 'rectangle':
                guid = guidRemote || this.guid();
                this.continuePath(oldx, oldy, x, y, lc, lw, false);
                if (this.element) {
                    this.element.node.id = guid;
                    var BBox = this.element.getBBox();
                    if ( BBox.width == 0 && BBox.height == 0 ) {
                        this.element.remove();
                    }
                }
                break;
            default:
                console.log("endPath: unknown item. ignore",this.drawingItem);
                return;
        }

        if (this.element) {
            var clone = $.extend({}, this.element);
            this.undoStack.push(clone)
        }

        if (send) {
            this.connection.sendPath({
                x: x,
                y: y,
                type: 'touchend',
                lineColor: lc,
                lineWidth: lw,
                drawingItem: this.drawingItem,
                guid: guid
            });
        }
        this.element = null;
    },

    guid: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    currentPathID: function() {
        return 'path-' + this.penPathID;
    },

    drawPath2: function(x, y, lc, lw, opacity) {
        var pathOpacity = opacity || 1;

        this.penPoints.push([x, y]);

        if (this.penPoints.length == 1) {
            return;
        } else if (this.penPoints.length == 2) {
            ++this.penPathID;
            this.d3SVG.append("path")
                .datum(this.penPoints)
                .attr("id", this.currentPathID())
                .attr("stroke", lc)
                .attr("stroke-width", lw)
                .attr("fill", "none")
                .attr("opacity", pathOpacity)
                .attr("d", this.penFunction);
        } else {
            this.d3SVG.select('#' + this.currentPathID()).
                attr("d", this.penFunction);
        }
    },

    /**
     * Clear canvas
     * @param {Object} send
     */
    clear: function(send, reloadImage) {
        reloadImage = typeof reloadImage == 'undefined' ? true : reloadImage;
        this.cvs.clear();
        if (reloadImage) this.connection.getImage();
        if (send) this.connection.sendClear();
        this.undoStack = [];
        this.redoStack = [];
    },

    getMeta: function (url, cbk) {
        var img = new Image();
        var _this = this;
        img.onload = function(){
            cbk(_this, img.width, img.height);
        };
        img.src = url;
    },

    /**
     * Load an image onto the canvas
     * @param {Object} url
     */
    loadImage: function(url, width, height) {
        this.getMeta(url, function(_this, w, h) {
            var W = _this.parent_.canvasWidth;
            var H = _this.parent_.canvasHeight;

            if (w <= W && h <= H) {
                // @TODO, resize the canvas;
                var x = (W - w) / 2;
                var y = (H - h) / 2;
            } else {
                var ratioW = W / w;
                var ratioH = H / h;
                var ratio = Math.min(ratioW, ratioH);
                w = w * ratio;
                h = h * ratio;
                var x = 0;
                var y = 0;
                if (ratioW < ratioH) {
                    y = (H - h) / 2;
                } else {
                    x = (W - w) / 2;
                }
            }
            if (y >= 30) { y = y - 30; }
            var img = _this.cvs.image(url, 0, 0, w, h);
            _this.changeCanvasSize(x, y, w, h, 30);
            img.toBack();
            //_this.cvs.image(url, 0, 0, _this.parent_.canvasWidth, _this.parent_.canvasHeight);
        });
    },

    changeCanvasSize: function(x, y, width, height, extraY) {
        this.parent_.$.canvasContainer.applyStyle("width", String(width) + "px");
        this.parent_.$.canvasContainer.applyStyle("height", String(height) + "px");
        // Since thiere is 60px header bar.
        if (extraY) {
            this.parent_.$.canvasContainer.applyStyle("margin-top", String(y / 2 + extraY) + "px");
        } else {
            this.parent_.$.canvasContainer.applyStyle("margin-top", String(y / 2) + "px");
        }
        this.canvasHeight = height;
        this.canvasWidth = width;
    },

    getImage: function() {
        images = document.getElementsByTagName("image");
        // TODO More specific targetting of image
        if (images.length != 0) {
            for (var i = 0; i < images.length; i++) {
                images[i].parentNode.removeChild(images[i]);
            }
        }
        this.connection.getImage(this.currentPage);
    },

    /**
     * Go to the next page
     */
    nextPage: function() {
        if (this.currentPage + 1 > this.totalPages) {
            // Blank canvas
            return false;
        } else {
            this.changeCanvasSize(0, 0, this.parent_.canvasWidth, this.parent_.canvasHeight);
            this.currentPage += 1;
            this.connection.init(this.uid, this.room, this.currentPage);
            return true;
        }
    },

    /**
     * Go to the previous page
     */
    prevPage: function() {
        if (this.currentPage - 1 <= 0) {
            // do nothing
            return false;
        } else {
            this.changeCanvasSize(0, 0, this.parent_.canvasWidth, this.parent_.canvasHeight);
            this.currentPage -= 1;
            this.connection.init(this.uid, this.room, this.currentPage);
            return true;
        }
    },

    gotoPage: function(pageNum) {
        this.changeCanvasSize(0, 0, this.parent_.canvasWidth, this.parent_.canvasHeight);
        this.currentPage = pageNum;
        this.connection.init(this.uid, this.room, pageNum);
        this.callback(this.totalPages, this.currentPage);
    },

    newPage: function() {
        this.currentPage = this.totalPages + 1;
        this.totalPages += 1;
        this.connection.newPage(this.uid, this.room, this.currentPage);
    },

    getColor: function() {
        return this.color;
    },

    setTotalPages: function(pages) {
        this.totalPages = pages.length;
        this.page_list= pages ;
        this.callback(this.totalPages, this.currentPage);
    },

    /**
     * Ask server to make video of current whiteboard
     */
    makeVideo: function() {
        this.connection.makeVideo();
    },

    selectPen: function() {
        this.drawingItem = 'pen';
    },

    selectHighlighter: function() {
        this.drawingItem = 'highlighter';
    },

    //selectEraser: function() {
        //this.drawingItem = 'eraser';
    //},

    removeLaser: function() {
        if (this.laserPen){
            this.laserPen.remove();
            this.laserPen = null;

            this.connection.sendLaserEvent('laser-remove');
        }
    },

    drawLaser: function(x, y) {
        var self = this;
        var canvasBounds = this.parent_.$.canvasContainer.getBounds();
        if (!x && !y){
            x = canvasBounds.width / 2 + canvasBounds.left;
            y = canvasBounds.height / 2;
        }

        if (!this.laserPen) {
            this.laserPen = this.cvs.circle(x, y, 8);
            this.laserPen.attr({
                stroke: "red",
                fill: "red",
                opacity: "0.5"
            });
            if (!this.isGuest()) {
                this.laserPen.drag(function(x, y, dx, dy, e) {
                    var nx = self.zoomConvert(dx) - self.zoomConvert(canvasBounds.left);
                    // We have a 60px header bar
                    var ny = self.zoomConvert(dy - 60);
                    this.attr({
                        cx: nx,
                        cy: ny
                    });
                    if(Math.abs(self.laserPen.attrs.cx - nx) > 2 || Math.abs(self.laserPen.attrs.cx - ny) > 2){
                        self.connection.sendLaserEvent('laser-move', {
                            x: nx,
                            y: ny,
                        });
                    }
                },
                function(x, y, e) {
                    this.attr("fill", "red");
                },
                function(e) {
                    this.attr("fill", "red");
                });
            }

            // create remote laser
            self.connection.sendLaserEvent('laser-draw', {
                x: x,
                y: y
            });
        }
    },

    drawRectangle: function() {
        this.drawingItem = 'rectangle';
    },

    drawSquare: function() {
        this.drawingItem = 'square';
    },

    drawArrow: function() {
        this.drawingItem = 'arrow';
    },

    drawTriangle: function() {
        this.drawingItem = 'triangle';
    },

    drawLine: function() {
        this.drawingItem = 'line';
    },

    drawEllipse: function() {
        this.drawingItem = 'ellipse';
    },

    drawCircle: function() {
        this.drawingItem = 'circle';
    },

    disableTextEditing: function() {
        var self = this;
        this.cvs.forEach(function(node) {
            if (node.type === 'text') {
                // disable text editing after being zoomed
                // since zooming would lead to several issues
                // that hard to resolve.
                node.unclick();
            }
        });
    },

    zoomIn: function() {
        if (this.zoomRatio >= 2) {
            return;
        }
        this.zoomRatio += 0.1;
        this.cvs.scaleAll(this.zoomRatio);
        // Adjust convas size accordingly
        this.parent_.$.canvasContainer.applyStyle("width", String(this.canvasWidth * this.zoomRatio) + "px");
        this.parent_.$.canvasContainer.applyStyle("height", String(this.canvasHeight * this.zoomRatio) + "px");

        if (this.laserPen) {
            this.removeLaser();
            this.drawLaser();
        }
        this.disableTextEditing();
    },

    zoomOut: function() {
        if (this.zoomRatio <= 0.5) {
            return;
        }
        this.zoomRatio -= 0.1;
        this.cvs.scaleAll(this.zoomRatio);
        // Adjust convas size accordingly
        this.parent_.$.canvasContainer.applyStyle("width", String(this.canvasWidth * this.zoomRatio) + "px");
        this.parent_.$.canvasContainer.applyStyle("height", String(this.canvasHeight * this.zoomRatio) + "px");
        // redrew the laser pen, or there will be offset while been dragging around,
        // since it will be calculated by old canvas bounds.
        if (this.laserPen) {
            this.removeLaser();
            this.drawLaser();
        }
        this.disableTextEditing();
    },

    undoWithDrawing: function() {
        this.executeUndo2(true);
    },

    redoWithDrawing: function() {
        this.executeRedo2(true);
    },

    executeUndo2: function(send, guid) {
        var element = this.undoStack.pop(),
            guid, clone;

        if (element) {
            if (element.type === 'path-line') {
                guid = guid || element.pathID;
                $("#" + guid).remove();
                this.redoStack.push(element);
            } else if (element.type === 'rm-shape') {
                guid = guid || element.shape.node.id;
                clone = element.shape.clone();
                clone.node.id = guid;
                this.redoStack.push({
                    type: 'rm-shape',
                    shape: clone
                });
            } else if (element.type === 'rm-path') {
                guid = guid || element.path.pathID;
                this.d3SVG.append("path")
                    .datum(element.path.datum)
                    .attr("id", element.path.pathID)
                    .attr("stroke", element.path.lineColor)
                    .attr("stroke-width", element.path.lineWidth)
                    .attr("fill", "none")
                    .attr("d", this.penFunction);
                this.redoStack.push(element);
            } else {
                guid = guid || element.node.id;
                $("#" + guid).remove();
                this.redoStack.push(element);
            }
            if (send) {
                this.connection.sendPath({
                    type: 'undo',
                    guid: guid
                })
            }
        }
    },

    executeRedo2: function(send, guid) {
        var element = this.redoStack.pop(),
            guid, clone;

        if (element) {
            if (element.type === 'path-line') {
                guid = guid || element.pathID;
                this.d3SVG.append("path")
                    .datum(element.datum)
                    .attr("id", element.pathID)
                    .attr("stroke", element.lineColor)
                    .attr("stroke-width", element.lineWidth)
                    .attr("fill", "none")
                    .attr("d", this.penFunction);
                this.undoStack.push(element);
            } else if (element.type === 'rm-shape') {
                guid = guid || element.shape.node.id;
                $("#" + guid).remove();
                this.undoStack.push({
                    shape: element.shape,
                    type: 'rm-shape'
                });
            } else if (element.type === 'rm-path') {
                guid = guid || element.path.pathID;
                $("#" + guid).remove();
                this.undoStack.push({
                    path: element.path,
                    type: 'rm-path'
                });
            } else {
                guid = guid || element.node.id;
                clone = element.clone();
                clone.node.id = guid;
                this.undoStack.push(clone);
            }

            if (send) {
                this.connection.sendPath({
                    type: 'redo',
                    guid: guid
                });
            }
        }
    },

    undo: function() {
        this.executeUndo();
        this.connection.sendPath({type: 'undo'})
    },

    executeUndo: function() {
        console.log('executeUndo @' + Date());
        var toUndo = this.undoStack.pop();
        if (toUndo) {
            if (toUndo.type === 'path-line') {
                var p = document.getElementById(toUndo.pathID);
                if (p) {
                    p.parentElement.removeChild(p);
                    this.redoStack.push(toUndo);
                } else {
                    console.log("fail to find the path by id + " + toUndo.pathID + " to execute undo");
                }
            } else if (toUndo.type === 'rm-shape') {
                var cloneShape = toUndo.shape.clone();      // clone to re-draw the shape
                this.redoStack.push({                       // push the {type: 'rm-shape', shape: clone} to redoStack
                    type: 'rm-shape',
                    shape: cloneShape
                });
            } else if (toUndo.type === 'rm-path') {     // draw the path back
                var pathObj = $(toUndo.path.outerHTML);
                this.d3SVG.append("path")
                    .attr("id", pathObj.attr('id'))
                    .attr("stroke", pathObj.attr('stroke'))
                    .attr("stroke-width", pathObj.attr('stroke-width'))
                    .attr("fill", "none")
                    .attr("d", pathObj.attr('d'));
                this.redoStack.push(toUndo);
            } else {
                var clone = $.extend(true, {}, toUndo);
                this.redoStack.push(clone);
                toUndo.remove();
            }
        }
    },

    redo: function() {
        this.executeRedo();
        this.connection.sendPath({type: 'redo'});
    },

    executeRedo: function() {
        console.log('executeRedo @' + Date());
        var toRedo = this.redoStack.pop();
        if (toRedo) {
            if (toRedo.type === 'path-line') {
                this.d3SVG.append("path")
                    .datum(toRedo.datum)
                    .attr("id", toRedo.penPathID)
                    .attr("stroke", toRedo.lineColor)
                    .attr("stroke-width", toRedo.lineWidth)
                    .attr("fill", "none")
                    .attr("d", this.penFunction);
                this.undoStack.push(toRedo);
            } else if (toRedo.type === 'rm-shape') {
                var clone = $.extend({}, toRedo.shape);
                this.undoStack.push({
                    type: 'rm-shape',
                    shape: clone
                });
                toRedo.shape.remove();
            } else if (toRedo.type === 'rm-path') {     // redo to remove the path
                var p = document.getElementById(toRedo.path.id);
                if (p) {
                    var clone = $.extend({}, toRedo.path);
                    this.undoStack.push({type: 'rm-path', path: clone});
                    p.parentElement.removeChild(p);
                }
            } else {
                var clone = toRedo.clone();
                this.undoStack.push(clone);
            }
        }
    },

    onTextClicked: function(t) {
        var input = t.inlineTextEditing.startEditing();  // Retrieve created <input type=text> field
        var _this = this;
        var prevDrawingItem = this.drawingItem;
        // stop drawing while we're editing text
        this.drawingItem = '';
        input.addEventListener("blur", function(e) {
            // Stop inline editing after blur on the text field
            t.inlineTextEditing.stopEditing();
            _this.connection.sendPath({
                type: 'edittext',
                oldx: t.attrs.x,
                oldy: t.attrs.y,
                value: t.inlineTextEditing.input.value
            });
            // restore previous drawing item.
            _this.drawingItem = prevDrawingItem;
        });
    },

    findAndRemoveFromStack: function(stack, guid) {
        var clone;

        for (index = 0, length = stack.length; index < length; index += 1) {
            var obj = stack[index];
            if (!obj || !obj.type) {
                // remove invalid obj in undo/redo stack
                stack.splice(index, 1);
                continue;
            }
            if (obj.type === 'path-line') {
                if (obj.pathID === guid) {
                    clone = $.extend({}, obj);
                    // Remove the element from stack
                    stack.splice(index, 1);
                    stack.push({
                        path: clone,
                        type: 'rm-path'
                    });
                }
            } else if (obj.type === 'rm-shape') {
                if (obj.shape.node.id === guid) {
                    clone = $.extend({}, obj.shape);
                    stack.splice(index, 1);
                    stack.push({
                        shape: clone,
                        type: 'rm-shape'
                    });
                }
            } else if (obj.type === 'rm-path') {
                if (obj.path.pathID === guid) {
                    clone = $.extend({}, obj.path);
                    stack.splice(index, 1);
                    stack.push({
                        path: clone,
                        type: 'rm-path'
                    })
                }
            } else {
                if (obj.node.id === guid) {
                    clone = $.extend({}, obj);
                    stack.splice(index, 1);
                    stack.push({
                        shape: clone,
                        type: 'rm-shape'
                    });
                }
            }
        }
        return clone;
    },

    /*
    * @guid if guid is not null, then the operation is from remote user
    * */
    removeSelected: function(send, guid) {
        var element,
            elementId,
            clone,
            index,
            length,
            id,
            guid;

        if (guid) {
            elementId = guid;
        } else {
            // currentSelected is a local variable, it only initialzed by user selection
            // if the remove operation is initialized by remove user, then it always be null.
            if (!this.currentSelected) {
                return;
            }
            element = this.currentSelected.element;
            if (this.currentSelected.path) {
                // user select a path object
                elementId = element.id;
            } else {
                // user select a shape object
                elementId = element.node.id;
            }
            guid = elementId;
        }

        this.findAndRemoveFromStack(this.undoStack, guid);
        this.findAndRemoveFromStack(this.redoStack, guid);

        $("#" + guid).remove();
        this.cancelSelect();

        if (send) {
            this.connection.sendPath({
                type: 'rm',
                guid: guid
            });
        }
    },

    executeRemove: function(x, y) {
        var pageX = x + this.parent_.$.canvasContainer.getBounds().left;
        var pageY = y + this.parent_.$.canvasContainer.getBounds().top;

        var svgElem = this.cvs.getElementByPoint(pageX, pageY);
        if (svgElem) {
            var clone = $.extend({}, svgElem);
            this.undoStack.push({
                type: 'rm-shape',
                shape: clone
            });
            svgElem.remove();
            this.cancelSelect();
            return true;
        }

        var domElem = document.elementFromPoint(pageX, pageY);
        if (domElem && (domElem.id.indexOf('path-') > -1)) {
            var clone = $.extend({}, domElem);
            this.undoStack.push({
                type: 'rm-path',
                path: clone
            });
            domElem.remove();
            this.cancelSelect();
            return true;
        }

        return false;
    },

    doSelect: function() {
        this.drawingItem = '';
        this.doingSelect = true;
    },

    hasSelectElement: function() {
        return !!this.currentSelected;
    },

    cancelSelect: function() {
        if (this.currentSelected) {
            var outerRect = this.currentSelected.outerRect,
                index, length;
                for (index = 0, length = outerRect.length; index < length; index += 1) {
                    outerRect[index].remove();
                }
        }
        this.currentSelected = null;
    },

    stopDoingSelect: function() {
        this.doingSelect = false;
    },

    selectSvgElementByPoint: function(x, y) {
        var indexX, indexY, element;

        for (indexX = x - 10; indexX < x + 10; indexX += 1) {
            for (indexY = y - 10; indexY < y + 10; indexY += 1) {
                element = this.cvs.getElementByPoint(indexX, indexY);
                if (element) {
                    if (element.type === 'image') {
                        // background image should not be selected.
                        // ignore it
                        continue;
                    }
                    return element;
                }
            }
        }
        return undefined;
    },

    selectDomElementByPoint: function(x, y) {
        var indexX, indexY, element;

        for (indexX = x - 10; indexX < x + 10; indexX += 1) {
            for (indexY = y - 10; indexY < y + 10; indexY += 1) {

                element = document.elementFromPoint(indexX, indexY);
                if (element && (element.id.indexOf('path-') > -1)) {
                    return element;
                }
            }
        }
        return undefined;
    },

    appclicked: function(x, y) {
        x=this.zoomConvert(x);
        y=this.zoomConvert(y);
        if (this.addingText) {
            this.executeAddText(x, y);
            this.connection.sendPath({
                oldx: x,
                oldy: y,
                type: 'addtext',
            });
        }
        else if (this.doingSelect) {
            var pageX = x + this.parent_.$.canvasContainer.getBounds().left;
            var pageY = y + this.parent_.$.canvasContainer.getBounds().top;

            //var svgElem = this.cvs.getElementByPoint(pageX, pageY);
            var svgElem = this.selectSvgElementByPoint(pageX, pageY);
            if (svgElem) {
                // Do not glow laser pen
                if (svgElem !== this.laserPen && svgElem.type !== 'text') {
                    // cancel previous selection
                    this.cancelSelect();

                    var result = this.drawOuterLineOnSelected(svgElem);
                    this.currentSelected = {
                        path: false,
                        element: svgElem,
                        outerRect: result
                    };
                }
            }

            var domElem = this.selectDomElementByPoint(pageX, pageY);
            if (domElem) {
                // cancel previous selection
                this.cancelSelect();

                var result = this.drawOuterLineOnSelected(domElem);
                this.currentSelected = {
                    path: true,
                    element: domElem,
                    outerRect: result
                };
            }
        }
    },

    drawOuterLineOnSelected: function(svgElem) {
        var result = [];
        var bbBox = svgElem.getBBox();
        var outerRect = this.cvs.rect(bbBox.x - 2, bbBox.y - 2, bbBox.width + 4, bbBox.height + 4);
        outerRect.attr({
            "stroke-dasharray": ["--"],
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1
        });
        result.push(outerRect);

        var cornerRect1 = this.cvs.rect(bbBox.x - 5, bbBox.y - 5, 8, 8);
        cornerRect1.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect1);

        var cornerRect2 = this.cvs.rect(bbBox.x - 5 + bbBox.width, bbBox.y - 5, 8, 8);
        cornerRect2.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect2);

        var cornerRect3 = this.cvs.rect(bbBox.x - 5, bbBox.y - 5 + bbBox.height, 8, 8);
        cornerRect3.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect3);

        var cornerRect4 = this.cvs.rect(bbBox.x - 5 + bbBox.width, bbBox.y - 5 + bbBox.height, 8, 8);
        cornerRect4.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect4);

        var cornerRect5 = this.cvs.rect(bbBox.x - 5 + bbBox.width/2, bbBox.y - 5 + bbBox.height, 8, 8);
        cornerRect5.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect5);

        var cornerRect6 = this.cvs.rect(bbBox.x - 5 + bbBox.width/2, bbBox.y - 5, 8, 8);
        cornerRect6.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect6);

        var cornerRect7 = this.cvs.rect(bbBox.x - 5, bbBox.y - 5 + bbBox.height/2, 8, 8);
        cornerRect7.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect7);

        var cornerRect8 = this.cvs.rect(bbBox.x - 5 + bbBox.width, bbBox.y - 5 + bbBox.height/2, 8, 8);
        cornerRect8.attr({
            "stroke": "rgb(0, 158, 235)",
            "stroke-width": 1,
            "fill": "rgb(0, 158, 235)"
        });
        result.push(cornerRect8);

        return result;
    },

    executeAddText: function(x, y) {
        // Top banner is 60px height

        var yPosition = y - 60;
        var text = this.cvs.text(x, yPosition, 'Adding text here')
            .attr({
                'text-anchor': 'start',
                'font-size': '16px',
            });

        // Initialize text editing for the text element
        this.cvs.inlineTextEditing(text);
        text.click(this.onTextClicked.bind(this, text));

        var id = x.toString() + '-' + yPosition.toString();
        this.textEdits[id] = text;

        var clone = $.extend({}, text);
        this.undoStack.push(clone);
    },

    executeEditText: function(x, y, value) {
        x=this.zoomConvert(x);
        y=this.zoomConvert(y);
        var id = x.toString() + '-' + y.toString();
        if (id in this.textEdits) {
            var t = this.textEdits[id];
            t.inlineTextEditing.autoEditing(value);
        }
    },

    addText: function() {
        this.drawingItem = '';
        this.addingText = true;
    },

    stopAddingText: function(drawingItem) {
        this.addingText = false;
        this.drawingItem = drawingItem;
    },
    deletePage:function(){
      this.connection.deletePage();
    },
    cropContent: function() {
        var content = this.cvs.toSVG();
        var a = $("<a id='download-img'>")
            .attr("download", "img.png")
            .appendTo("body");
        var canvas_tag = $("<canvas id='my-canvas' style='display:none;'></canvas>")
            .appendTo("body");

        canvg(document.getElementById("my-canvas"), content);
        setTimeout(function() {
            var dataURL = document.getElementById('my-canvas').toDataURL("image/png");
            $('#download-img').attr('href', dataURL);
            a[0].click();
            a.remove();
            canvas_tag.remove();
        }, 500);
    },
    isGuest: function() {
         return this.userRole === 'guest';
    }
});
