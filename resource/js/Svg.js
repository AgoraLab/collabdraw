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

    constructor: function(name, width, height, uid, room, page, websocketAddress, callback) {
        this.uid = uid;
        this.room = room;
        this.cvs = new ScaleRaphael(name, width, height);
        this.connection = new Connection(websocketAddress, this, room);
        this.callback = callback;
        this.zoomRatio = 1;
        // Pen drawing by default, user can select circle, ellipse, etc.
        this.drawingItem = 'pen';
        this.element = null;
        this.drawStartX = 0;
        this.drawStartY = 0;
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

    /**
     * Called when user starts a path
     * @param {Object} x
     * @param {Object} y
     * @param {Object} send
     */
    startPath: function(x, y, lc, lw, send) {
        switch(this.drawingItem) {
            case 'pen':
                if (send) {
                    this.connection.sendPath({
                        oldx: x,
                        oldy: y,
                        type: 'touchstart',
                        lineColor: lc,
                        lineWidth: lw,
                    });
                }
                break;
            case 'arrow':
                this.drawStartX = x;
                this.drawStartY = y;
                this.element  = this.cvs.path("M" + x + " " + y);

                this.element.attr({
                    "stroke": lc,
                    "stroke-width": lw,
                    "arrow-end":"classic-medium-medium"
                });
                break;
            case 'circle':
                break;
            case 'square':
                break;
            case 'rectangle':
                break;
            case 'ellipse':
                break;
            default:
                console.log("not supported yet.");
        }
    },

    /**
     * Called when user continues path (without lifting finger)
     */
    continuePath: function(oldx, oldy, x, y, lc, lw, send) {
        switch(this.drawingItem) {
            case 'pen':
                this.drawAndSendPath('touchmove', oldx, oldy, x, y, lc, lw, send)
                break;
            case 'arrow':
                this.drawAndSendArrow('touchmove', this.drawStartX, this.drawStartY, x, y, lc, lw, send);
                break;
            case 'circle':
                break;
            case 'square':
                break;
            case 'rectangle':
                break;
            case 'ellipse':
                break;
            default:
                console.log("not supported yet.");
        }
    },

    /**
     * Called when user lifts finger
     */
    endPath: function(oldx, oldy, x, y, lc, lw, send) {
        switch(this.drawingItem) {
            case 'pen':
                this.drawAndSendPath('touchend', oldx, oldy, x, y, lc, lw, send)
                break;
            case 'arrow':

                var BBox = this.element.getBBox();
                if (BBox.width == 0 && BBox.height == 0) {
                    this.element.remove();
                }
                break;
            case 'circle':
                break;
            case 'square':
                break;
            case 'rectangle':
                break;
            case 'ellipse':
                break;
            default:
                console.log("not supported yet.");
        }
    },

    drawAndSendArrow: function(type, oldx, oldy, x, y, lc, lw, send) {
        var path = "M" + oldx + " " + oldy + "L" + (x > 0 ? x: 0) + " " + (y > 0 ? y : 0);
        this.element.attr("path", path);
    },

    drawAndSendPath: function(type, oldx, oldy, x, y, lc, lw, send) {
        var path = "M " + oldx + " " + oldy + " L " + x + " " + y + " Z";
        var p = this.cvs.path(path);
        p.attr("stroke", lc);
        p.attr("stroke-width", lw)
        if (send) {
            this.connection.sendPath({
                oldx: oldx,
                oldy: oldy,
                x: x,
                y: y,
                type: type,
                lineColor: lc,
                lineWidth: lw,
            });
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

    drawRectangle: function() {
        this.drawingItem = 'rectangle';
        this.cvs.rect(10, 10, 50, 100);
    },

    drawSquare: function() {
        this.drawingItem = 'square';
        this.cvs.rect(10, 10, 150, 150);
        console.log("Drawing square");
    },

    drawArrow: function() {
        this.drawingItem = 'arrow';
        // TODO
        console.log("Drawing arrow");
    },

    drawEllipse: function() {
        this.drawingItem = 'ellipse';
        this.cvs.ellipse(200, 400, 100, 50);
        console.log("Drawing ellipse");
    },

    drawCircle: function() {
        this.drawingItem = 'circle';
        this.cvs.circle(100, 100, 80);
        console.log("Drawing circle");
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
        console.log("undo");
    },

    redo: function() {
        console.log("redo");
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
