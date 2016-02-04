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
        if (send) {
            this.connection.sendPath({
                oldx: x,
                oldy: y,
                type: 'touchstart',
                lineColor: lc,
                lineWidth: lw,
            });
        }
    },

    /**
     * Called when user continues path (without lifting finger)
     */
    continuePath: function(oldx, oldy, x, y, lc, lw, send) {
        this.drawAndSendPath('touchmove', oldx, oldy, x, y, lc, lw, send)
    },

    /**
     * Called when user lifts finger
     */
    endPath: function(oldx, oldy, x, y, lc, lw, send) {
        this.drawAndSendPath('touchend', oldx, oldy, x, y, lc, lw, send)
    },

    drawAndSendPath: function(type, oldx, oldy, x, y, lc, lw, send) {
        path = "M " + oldx + " " + oldy + " L " + x + " " + y + " Z";
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
        this.cvs.rect(10, 10, 50, 50);
    },

    zoomIn: function() {
        this.zoomRatio += 0.1;
        this.cvs.scaleAll(this.zoomRatio);
    },

    zoomOut: function() {
        this.zoomRatio -= 0.1;
        this.cvs.scaleAll(this.zoomRatio);
        //var width = this.cvs.canvas.offsetWidth,
            //height = this.cvs.canvas.offsetHeight,
            //new_width = width - width * 0.1;
        //this.cvs.setViewBox(0, 0, width * 0.9, height * 0.9 , true);
        //this.cvs.canvas.setAttribute('preserveAspectRatio', 'none');
        //this.cvs.setSize("100%", "100%");
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
