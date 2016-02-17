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

    constructor: function(name, width, height, uid, sid, room, page, websocketAddress, callback) {
        this.uid = uid;
        this.sid = sid;
        this.room = room;
        this.cvs = new ScaleRaphael(name, width, height);
        this.connection = new Connection(websocketAddress, this, room, uid);
        this.callback = callback;
        this.zoomRatio = 1;
        // Pen drawing by default, user can select circle, ellipse, etc.
        this.drawingItem = 'pen';
        this.element = null;
        this.drawStartX = 0;
        this.drawStartY = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.textEdits = {};
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
    start: function() {
        // storing original coordinates
        this.ox = this.attr("x");
        this.oy = this.attr("y");
        this.attr({
            opacity: 1
        });
        if (this.attr("y") < 60 && this.attr("x") < 60) this.attr({
            fill: "#000"
        });
    },

    move: function(dx, dy) {
        // move will be called with dx and dy
        if (this.attr("y") > 200 || this.attr("x") > 300) this.attr({
            x: this.ox + dx,
            y: this.oy + dy
        });
        else {
            nowX = Math.min(300, this.ox + dx);
            nowY = Math.min(200, this.oy + dy);
            nowX = Math.max(0, nowX);
            nowY = Math.max(0, nowY);
            this.attr({
                x: nowX,
                y: nowY
            });
            if (this.attr("fill") != "#000") this.attr({
                fill: "#000"
            });
        }
    },

    up: function() {
        // restoring state
        this.attr({
            opacity: .5
        });
        if (this.attr("y") < 60 && this.attr("x") < 60) this.attr({
            fill: "#AEAEAE"
        });
    },

    /**
     * Called when user starts a path
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    startPath: function(x, y, lc, lw, send) {
        this.drawStartX = x;
        this.drawStartY = y;

        switch(this.drawingItem) {
            case 'pen':
                this.undoStack.push({
                    type: "path-line",
                    paths: []
                });
                break;
            case 'arrow':
                if (!this.element) {
                    this.element  = this.cvs.path("M" + x + " " + y);
                }
                break;
            case 'circle':
                if (!this.element)
                    this.element = this.cvs.circle(x, y, 0);
                this.element.drag(this.move, this.start, this.up);
                this.element.attr({
                    "stroke": lc,
                    "stroke-width": lw
                });
                break;
            case 'square':
            case 'rectangle':
                if (!this.element)
                    this.element = this.cvs.rect(x, y, 0, 0);
                this.element.drag(this.move, this.start, this.up);
                this.element.attr({
                    "stroke": lc,
                    "stroke-width": lw
                });
                break;
            case 'ellipse':
                if (!this.element)
                    this.element = this.cvs.ellipse(x, y, 0, 0);
                this.element.drag(this.move, this.start, this.up);
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

        switch(this.drawingItem) {
            case 'pen':
                this.drawPath(oldx, oldy, x, y, lc, lw)
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
                console.log("continuePath: unknown item. ignore");
                return;
        }

        if (send) {
            this.connection.sendPath({
                oldx: oldx,
                oldy: oldy,
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

        switch(this.drawingItem) {
            case 'pen':
                this.drawPath(oldx, oldy, x, y, lc, lw)
                break;
            case 'arrow':
            case 'circle':
            case 'square':
            case 'ellipse':
            case 'rectangle':
                if (this.element) {
                    var BBox = this.element.getBBox();
                    if ( BBox.width == 0 && BBox.height == 0 ) {
                        this.element.remove();
                    }
                }
                break;
            default:
                console.log("endPath: unknown item. ignore");
                return;
        }

        if (this.element) {
            var clone = $.extend({}, this.element);
            this.undoStack.push(clone)
        }

        if (send) {
            this.connection.sendPath({
                oldx: oldx,
                oldy: oldy,
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

    drawPath: function(oldx, oldy, x, y, lc, lw) {
        var path = "M " + oldx + " " + oldy + " L " + x + " " + y + " Z";
        var p = this.cvs.path(path);
        p.attr({
            "stroke": lc,
            "stroke-width": lw
        });
        var clone = $.extend({}, p);
        var lastElement = this.undoStack[this.undoStack.length - 1];
        if (lastElement.type && lastElement.type === 'path-line') {
            lastElement.paths.push(clone);
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

    /**
     * Load an image onto the canvas
     * @param {Object} url
     */
    loadImage: function(url, width, height) {
        this.cvs.image(url, 5, 5, width, height);
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
        this.connection.init(this.uid, this.room, pageNum);
        this.currentPage = pageNum;
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
        this.totalPages = pages;
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

    drawRectangle: function() {
        this.drawingItem = 'rectangle';
    },

    drawSquare: function() {
        this.drawingItem = 'square';
    },

    drawArrow: function() {
        this.drawingItem = 'arrow';
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
            var pathsClone = [],
                clone;
            if (toUndo.type === 'path-line') {
                for (var i = 0, length = toUndo.paths.length; i < length; i++) {
                    var toRemove = toUndo.paths[i];
                    clone = $.extend(true, {}, toRemove);
                    pathsClone.push(clone);
                    toRemove.remove();
                }
                this.redoStack.push({
                    type: "path-line",
                    paths: pathsClone
                })
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
                var pathsClone = [];
                for (var i = 0, length = toRedo.paths.length; i < length; i++) {
                    var toAdd = toRedo.paths[i];
                    pathsClone.push(toAdd.clone());
                }
                this.undoStack.push({
                    type: "path-line",
                    paths: pathsClone
                });
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
            t.inlineTextEditing.stopEditing(); // Stop inline editing after blur on the text field
            _this.connection.sendPath({
                type: 'edittext',
                oldx: t.attrs.x,
                oldy: t.attrs.y,
                value: t.inlineTextEditing.input.value
            });
        });
    },

    appclicked: function(x, y) {
        if (this.addingText) {
            var text = this.cvs.text(x, y, 'Adding text here').attr({'text-anchor': 'start', 'font-size': '25px'}).transform([]);
            this.cvs.inlineTextEditing(text);   // Initialize text editing for the text element
            text.click(this.onTextClicked.bind(this, text), true);
            this.addingText = false;    //reset adding text status

            this.connection.sendPath({
                oldx: x,
                oldy: y,
                type: 'addtext',
            });

            var id = x.toString() + '-' + y.toString();
            this.textEdits[id] = text;
        }
    },

    executeAddText: function(x, y) {
        var text = this.cvs.text(x, y, 'Adding text here').attr({'text-anchor': 'start', 'font-size': '25px'}).transform([]);
        this.cvs.inlineTextEditing(text);   // Initialize text editing for the text element
        text.click(this.onTextClicked.bind(text), true);

        var id = x.toString() + '-' + y.toString();
        this.textEdits[id] = text;
    },

    executeEditText: function(x, y, value) {
        var id = x.toString() + '-' + y.toString();
        if (id in this.textEdits) {
            var t = this.textEdits[id];
            t.node.textContent = value;
        }
    },

    addText: function() {
        this.drawingItem = '';
        this.addingText = true;
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
