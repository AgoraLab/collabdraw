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
    getPageById: function(pageid) {
        for(i in this.page_list){
            if(this.page_list[i]==pageid){
                return i+1;
            }
        }
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
    constructor: function(name, parent, page, websocketAddress, callback) {
        this.parent_         = parent;
        this.uid             = parent.uid;
        this.sid             = parent.sid;
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
    zoomConvert:function(x){
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
        if(send){
            x=this.zoomConvert(x);
            y=this.zoomConvert(y);
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
                if (!this.element)
                    this.element = this.cvs.circle(x, y, 0);
                //this.element.drag(this.move, this.start, this.up);
                this.element.attr({
                    "stroke": lc,
                    "stroke-width": lw
                });
                break;
            case 'square':
            case 'rectangle':
                if (!this.element)
                    this.element = this.cvs.rect(x, y, 0, 0);
                //this.element.drag(this.move, this.start, this.up);
                this.element.attr({
                    "stroke": lc,
                    "stroke-width": lw
                });
                break;
            case 'ellipse':
                if (!this.element)
                    this.element = this.cvs.ellipse(x, y, 0, 0);
                //this.element.drag(this.move, this.start, this.up);
                this.element.attr({
                    "stroke": lc,
                    "stroke-width": lw
                });
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
                    var width = x - this.drawStartX,
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
    endPath: function(oldx, oldy, x, y, lc, lw, send) {
        // x += x * (1 - this.zoomRatio);
        // y += y * (1 - this.zoomRatio);
        if(send){
            x=this.zoomConvert(x);
            y=this.zoomConvert(y);
        }
        switch(this.drawingItem) {
            case 'pen':
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
                this.continuePath(oldx, oldy, x, y, lc, lw, false);
                if (this.element) {
                    var BBox = this.element.getBBox();
                    if ( BBox.width == 0 && BBox.height == 0 ) {
                        this.element.remove();
                    }

                    //this.element.hover(
                        //// When the mouse comes over the object //
                        //// Stock the created "glow" object in myCircle.g
                        //function() {
                            //this.g = this.glow({
                                //width: 5
                            //});
                        //},
                        //// When the mouse goes away //
                        //// this.g was already created. Destroy it!
                        //function() {
                            //this.g.remove();
                        //});
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
                drawingItem: this.drawingItem
            });
        }
        this.element = null;
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
            _this.cvs.image(url, x, y, w, h);
            //_this.cvs.image(url, 0, 0, _this.parent_.canvasWidth, _this.parent_.canvasHeight);
        });
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
            this.currentPage -= 1;
            this.connection.init(this.uid, this.room, this.currentPage);
            return true;
        }
    },

    gotoPage: function(pageNum) {
        this.currentPage = pageNum;
        this.connection.init(this.uid, this.room, pageNum);
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
        }
    },

    drawLaser: function(x, y) {
        var self = this;
        var canvasBounds = this.parent_.$.canvasContainer.getBounds();
        if (!x && !y){
            x = canvasBounds.width / 2;
            y = canvasBounds.height / 2;
        }

        if (!this.laserPen) {
            this.laserPen = this.cvs.circle(x, y, 8);
            this.laserPen.attr({
                fill: "red",
                opacity: "0.5"
            });
            this.laserPen.drag(function(x, y, dx, dy, e) {
                this.attr({
                    cx: dx - canvasBounds.left,
                    // We have a 60px header bar
                    cy: dy - 60
                });
                var nx=dx - canvasBounds.left;
                var ny=dy - 60;
                console.log(self.laserPen, x,nx,y,ny);
                if(Math.abs(self.laserPen.attrs.cx - nx)>2 || Math.abs(self.laserPen.attrs.cx - ny)>2){
                    self.connection.sendLaserMove({
                        x: nx,
                        y: ny,
                    })
                }
            },
            function(x, y, e) {
                this.attr("fill", "red");
            },
            function(e) {
                this.attr("fill", "red");
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

    zoomIn: function() {
        this.zoomRatio += 0.1;
        this.cvs.scaleAll(this.zoomRatio);
    },

    zoomOut: function() {
        this.zoomRatio -= 0.1;
        this.cvs.scaleAll(this.zoomRatio);
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
        input.addEventListener("blur", function(e) {
            // Stop inline editing after blur on the text field
            t.inlineTextEditing.stopEditing();
            _this.connection.sendPath({
                type: 'edittext',
                oldx: t.attrs.x,
                oldy: t.attrs.y,
                value: t.inlineTextEditing.input.value
            });
        });
    },

    removeSelected: function() {
        if (!this.currentSelected) {
            return;
        }

        var clone = $.extend({}, this.currentSelected.element);
        if (this.currentSelected.path) {
            this.undoStack.push({
                type: 'rm-path',
                shape: clone
            });
        } else {
            this.undoStack.push({
                type: 'rm-shape',
                path: clone
            });
        }
        this.currentSelected.element.remove();
        this.cancelSelect();
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

        for (indexX = x - 3; indexX < x + 3; indexX += 1) {
            for (indexY = y - 3; indexY < y + 3; indexY += 1) {
                element = this.cvs.getElementByPoint(indexX, indexY);
                if (element) {
                    return element;
                }
            }
        }
        return undefined;
    },

    selectDomElementByPoint: function(x, y) {
        var indexX, indexY, element;

        for (indexX = x - 3; indexX < x + 3; indexX += 1) {
            for (indexY = y - 3; indexY < y + 3; indexY += 1) {

                element = document.elementFromPoint(indexX, indexY);
                if (element && (element.id.indexOf('path-') > -1)) {
                    return element;
                }
            }
        }
        return undefined;
    },

    appclicked: function(x, y) {
        if (this.addingText) {
            this.executeAddText(x, y);
            this.connection.sendPath({
                oldx: x,
                oldy: y,
                type: 'addtext',
            });
        }
        //else if (this.drawingItem == 'eraser') {
            //var removed = this.executeRemove(x, y);
            //if (removed) {
                //this.connection.sendPath({
                    //oldx: x,
                    //oldy: y,
                    //type: 'rm'
                //});
            //}
        //}
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
                        path: true,
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
                    path: false,
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
        var text = this.cvs.text(x, y - 60, 'Adding text here')
            .attr({
                'text-anchor': 'start',
                'font-size': '16px',
            });

        // Initialize text editing for the text element
        this.cvs.inlineTextEditing(text);
        text.click(this.onTextClicked.bind(this, text), true);

        var id = x.toString() + '-' + y.toString();
        this.textEdits[id] = text;

        var clone = $.extend({}, text);
        this.undoStack.push(clone);
    },

    executeEditText: function(x, y, value) {
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
    }
});
