enyo.kind({
    name: "App",
    kind: "FittableRows",
    fit: true,

    published: {
        whiteboard: '',
        curves: {
            color: 'black',
            width: '3px',
        },
        previousColor: '',
        uid: 'test',
        room: 'one',
        canvasWidth: 800,
        canvasHeight: 550,
        appIpAddress: "",
        appPort: "",
    },

    components: [{
        kind: "FittableRows",
        fit: true,
        style: "text-align: center; padding: 20px; background-color: #F0F0F0; z-index: 0",
        components: [{
            style: "margin: auto; background-color: #FFFFFF;",
            ontap: "appclicked",
            ondragstart: "touchstart",
            ondragover: "touchmove",
            ondragfinish: "touchend",
            name: "canvasContainer",
            rendered: function() {
                this.applyStyle("width", this.owner.canvasWidth + "px");
                this.applyStyle("height", this.owner.canvasHeight + "px");
                if (window.location.protocol == 'https:') {
                    var websocketAddress = 'wss://' + this.owner.appIpAddress + ':' + this.owner.appPort + '/realtime/';
                } else {
                    var websocketAddress = 'ws://' + this.owner.appIpAddress + ':' + this.owner.appPort + '/realtime/';
                }
                if (this.hasNode()) {
                    var _this = this;
                    this.owner.$.loadingPopup.show();
                    this.owner.whiteboard = new WhiteboardSvg(this.node.getAttribute("id"), this.owner.canvasWidth, this.owner.canvasHeight, this.owner.uid, this.owner.room, 1, websocketAddress, function(numPages, currentPage) {
                        _this.owner.$.currentPage.setMax(numPages);
                        _this.owner.$.currentPage.setValue(currentPage);
                        _this.owner.$.loadingPopup.hide();
                    });
                }
            },
        }],
    }, {
        kind: "onyx.MoreToolbar",
        components: [{
            kind: "onyx.Button",
            ontap: "selectEraser",
            classes: "fa fa-eraser"
        }, {
            kind: "onyx.PickerDecorator",
            components: [{
                name: "penPicker",
                classes: "fa fa-pencil"
            }, {
                kind: "onyx.Picker",
                components: [{
                    name: "pen",
                    ontap: "selectPen",
                    classes: "fa fa-pencil"
                }, {
                    name: "rectangle",
                    ontap: "drawRectangle",
                    classes: "fa fa-square-o"
                }, {
                    name: "square",
                    ontap: "drawSquare",
                    classes: "fa fa-square-o"
                }, {
                    name: "arrow",
                    ontap: "drawArrow",
                    classes: "fa fa-arrow-right"
                }, {
                    name: "circle",
                    ontap: "drawCircle",
                    classes: "fa fa-circle-o"
                }, {
                    name: "ellipse",
                    ontap: "drawEllipse",
                    classes: "fa fa-circle-o"
                }]
            }],
        },{
            kind: "onyx.PickerDecorator",
            components: [{
                name: "colorPicker",
                style: "background-color: black",
                classes: "fa fa-magic"
            }, {
                kind: "onyx.Picker",
                onChange: "colorItemSelected",
                components: [{
                    name: "red",
                    style: "background-color: red;",
                    classes: "fa fa-magic"
                }, {
                    name: "orange",
                    style: "background-color: orange;",
                    classes: "fa fa-magic"
                }, {
                    name: "yellow",
                    style: "background-color: yellow;",
                    classes: "fa fa-magic"
                }, {
                    name: "blue",
                    style: "background-color: blue;",
                    classes: "fa fa-magic"
                }, {
                    name: "cyan",
                    style: "background-color: cyan;",
                    classes: "fa fa-magic"
                }, {
                    name: "green",
                    style: "background-color: green;",
                    classes: "fa fa-magic"
                }, {
                    name: "black",
                    style: "background-color: black;",
                    classes: "fa fa-magic"
                }, {
                    name: "purple",
                    style: "background-color: purple;",
                    classes: "fa fa-magic"
                }]
            }, ],
        }, {
            kind: "onyx.PickerDecorator",
            components: [{
                classes: "fa fa-minus"
            }, {
                kind: "onyx.Picker",
                components: [{
                    name: "lineOption1",
                    style: "background-image:url(/resource/images/lines-bg.png);background-repeat:no-repeat;background-position:0 -4px;",
                    ontap: "setLineWidth1"
                }, {
                    name: "lineOption2",
                    style: "background-image:url(/resource/images/lines-bg.png);background-repeat:no-repeat;background-position:0 -76px;",
                    ontap: "setLineWidth2"
                }, {
                    name: "lineOption3",
                    style: "background-image:url(/resource/images/lines-bg.png);background-repeat:no-repeat;background-position:0 -149px;",
                    ontap: "setLineWidth3"
                }, {
                    name: "lineOption4",
                    style: ""
                }, ]
            }, ]
        }, {
            kind: "onyx.Button",
            classes: "fa fa-text-width",
            onTap: "addText"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-rotate-left",
            ontap: "undoPath",
            onTap: "selectUndo"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-rotate-right",
            ontap: "redoPath"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-search-plus",
            ontap: "zoomInPane",
            onTap: "selectUndo"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-search-minus",
            ontap: "zoomOutPane"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-crop",
            ontap: "cropContent"
        }, {
            kind: "onyx.MenuDecorator",
            onSelect: "optionSelected",
            components: [{
                classes: "fa fa-gear"
            }, {
                kind: "onyx.Menu",
                components: [{
                    name: "clear",
                    content: "Clear",
                }, {
                    name: "createJoinRoom",
                    content: "Create/Join Room",
                    popup: "createJoinRoomPopup",
                }, {
                    name: "getVideo",
                    content: "Get Video...",
                }, {
                    name: "exportToSvg",
                    content: "Export to SVG",
                }, {
                    name: "upload",
                    content: "Upload",
                }, ]
            }, ]
        }, {
            kind: "onyx.Button",
            classes: "fa fa-arrow-left",
            ontap: "selectPrevious"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-file-o",
            ontap: "selectNewPage"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-arrow-right",
            ontap: "selectNext"
        }, {
            style: "width: 1%"
        }, {
            kind: "onyx.PickerDecorator",
            components: [{}, {
                kind: "onyx.IntegerPicker",
                name: "currentPage",
                onSelect: "gotoPage",
                min: 1,
            }, ],
        }, {
            kind: "onyx.Button",
            classes: "fa fa-lock",
            ontap: "logout"
        }, {
            name: "createJoinRoomPopup",
            kind: "onyx.Popup",
            centered: true,
            modal: true,
            floating: true,
            style: "width: 300px; height: 200px; padding: 0 20px 5px 20px",
            components: [{
                content: "<h3>Enter Room name</h3>",
                allowHtml: true,
            }, {
                content: "If your room doesn't exist already in your account, it will be created",
            }, {
                kind: "onyx.InputDecorator",
                style: "margin: 10px 10px 10px 0; width: 250px",
                alwaysLooksFocused: true,
                components: [{
                    kind: "onyx.Input",
                    name: "roomName",
                }]
            }, {
                tag: "br"
            }, {
                kind: "onyx.Button",
                content: "Cancel",
                ontap: "selectCreateJoinRoomPopupCancel",
            }, {
                kind: "onyx.Button",
                content: "OK",
                ontap: "selectCreateJoinRoomPopupOk",
                popup: "lightPopup",
                style: "margin-left: 10px",
            }],
        }, {
            name: "loadingPopup",
            kind: "onyx.Popup",
            centered: true,
            autoDismiss: false,
            modal: true,
            floating: true,
            components: [{
                kind: "onyx.Spinner"
            }, ],
        }]
    }, ],

    zoomInPane: function(inSender, inEvent) {
        this.whiteboard.zoomIn();
    },

    zoomOutPane: function(inSender, inEvent) {
        this.whiteboard.zoomOut();
    },
    undoPath: function(inSender, inEvent) {
        this.whiteboard.undo();
    },

    redoPath: function(inSender, inEvent) {
        this.whiteboard.redo();
    },

    cropContent: function(inSender, inEvent) {
        this.whiteboard.cropContent();
    },

    drawRectangle: function(inSender, inEvent) {
        if (this._isWhiteColor(this.curves.color)) {
            this.curves.color = this.previousColor;
        }
        this.whiteboard.drawRectangle();
    },

    drawSquare: function(inSender, inEvent) {
        if (this._isWhiteColor(this.curves.color)) {
            this.curves.color = this.previousColor;
        }
        this.whiteboard.drawSquare();
    },

    drawArrow: function(inSender, inEvent) {
        if (this._isWhiteColor(this.curves.color)) {
            this.curves.color = this.previousColor;
        }
        this.whiteboard.drawArrow();
    },

    drawEllipse: function(inSender, inEvent) {
        if (this._isWhiteColor(this.curves.color)) {
            this.curves.color = this.previousColor;
        }
        this.whiteboard.drawEllipse();
    },

    drawCircle: function(inSender, inEvent) {
        if (this._isWhiteColor(this.curves.color)) {
            this.curves.color = this.previousColor;
        }
        this.whiteboard.drawCircle();
    },

    appclicked: function(inSender, inEvent) {
        var canvasBounds = this.$.canvasContainer.getBounds();
        var x = inEvent.pageX - canvasBounds.left;
        var y = inEvent.pageY - canvasBounds.top;
        this.whiteboard.appclicked(x, y);
    },

    touchstart: function(inSender, inEvent) {
        var canvasBounds = this.$.canvasContainer.getBounds();
        this.curves.oldx = inEvent.pageX - canvasBounds.left;
        this.curves.oldy = inEvent.pageY - canvasBounds.top;
        this.whiteboard.startPath(this.curves.oldx, this.curves.oldy, this.curves.color, this.curves.width, true);
    },

    touchmove: function(inSender, inEvent) {
        if (this.curves.oldx != -1 && this.curves.oldy != -1) {
            var canvasBounds = this.$.canvasContainer.getBounds();
            x = inEvent.pageX - canvasBounds.left;
            y = inEvent.pageY - canvasBounds.top;
            this.whiteboard.continuePath(this.curves.oldx, this.curves.oldy, x, y, this.curves.color, this.curves.width, true);
            this.curves.oldx = x;
            this.curves.oldy = y;
        }
    },

    touchend: function(inSender, inEvent) {
        if (this.curves.oldx != -1 && this.curves.oldy != -1) {
            var canvasBounds = this.$.canvasContainer.getBounds();
            x = inEvent.pageX - canvasBounds.left;
            y = inEvent.pageY - canvasBounds.top;
            this.whiteboard.endPath(this.curves.oldx, this.curves.oldy, x, y, this.curves.color, this.curves.width, true);
            this.curves.oldx = -1;
            this.curves.oldy = -1;
        }
    },

    _isWhiteColor: function(color) {
        if (!color) {
            return false;
        }
        return color.match(/^(?:white|#fff(?:fff)?|rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(?:,\s*1\s*)?\))$/i);
    },

    selectEraser: function(inSender, inEvent) {
        this.previousColor = this.curves.color;
        this.curves.color = '#ffffff';
        this.whiteboard.selectPen();
    },

    selectPen: function(inSender, inEvent) {
        if (this._isWhiteColor(this.curves.color)) {
            this.curves.color = this.previousColor;
        }
        this.curves.width = '3px';
        this.whiteboard.selectPen();
    },

    addText: function(inSender, inEvent) {
        this.whiteboard.addText();
    },

    setLineWidth1: function(inSender, inEvent) {
        this.curves.width = '3px';
    },

    setLineWidth2: function(inSender, inEvent) {
        this.curves.width = '6px';
    },

    setLineWidth3: function(inSender, inEvent) {
        this.curves.width = '9px';
    },

    optionSelected: function(inSender, inEvent) {
        var name = inEvent.originator.name;
        switch (name) {
        case "clear":
            this.selectClear(inSender, inEvent);
            break;
        case "createJoinRoom":
            this.selectCreateJoinRoom(inSender, inEvent);
            break;
        case "getVideo":
            this.selectGetVideo(inSender, inEvent);
            break;
        case "exportToSvg":
            this.selectExportToSvg(inSender, inEvent);
            break;
        case "upload":
            this.selectUpload(inSender, inEvent);
            break;
        }
    },

    colorItemSelected: function(inSender, inEvent) {
        var color = inEvent.selected.name;
        this.$.colorPicker.applyStyle("background-color", color);
        this.curves.color = color;
        this.curves.width = "3px";
    },

    selectClear: function(inSender, inEvent) {
        this.whiteboard.clear(true);
    },

    selectCreateJoinRoom: function(inSender, inEvent) {
        var p = this.$[inEvent.originator.popup];
        if (p) {
            p.show();
        }
    },

    selectGetVideo: function(inSender, inEvent) {
        this.whiteboard.makeVideo();
    },

    selectExportToSvg: function(inSender, inEvent) {
        var svg = document.getElementsByTagName('svg')[0];
        var svg_xml = (new XMLSerializer).serializeToString(svg);
        window.open("data:image/svg+xml;base64," + btoa(svg_xml), "Export");
    },

    selectUpload: function(inSender, inEvent) {
        window.location = "./upload?room=" + this.room;
    },

    selectNext: function(inSender, inEvent) {
        this.$.loadingPopup.show();
        var result = this.whiteboard.nextPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    selectPrevious: function(inSender, inEvent) {
        this.$.loadingPopup.show();
        var result = this.whiteboard.prevPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    selectCreateJoinRoomPopupCancel: function(inSender, inEvent) {
        this.$.createJoinRoomPopup.hide();
    },

    selectCreateJoinRoomPopupOk: function(inSender, inEvent) {
        var value = this.$.roomName.getValue();
        if (value) {
            this.whiteboard.joinRoom(value);
        }
        this.$.createJoinRoomPopup.hide();
    },
    logout: function() {
        window.location = "./logout.html";
    },

    selectNewPage: function(inSender, inEvent) {
        this.whiteboard.newPage();
        this.updatePageInfo();
    },

    updatePageInfo: function() {
        this.$.currentPage.setMax(this.whiteboard.getNumPages());
        this.$.currentPage.setValue(this.whiteboard.getCurrentPage());
    },

    gotoPage: function(inSender, inEvent) {
        this.whiteboard.gotoPage(inEvent.selected.content);
    },

});
