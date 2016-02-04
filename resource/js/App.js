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
            classes: "mi mi-eraser mi-lg"
        }, {
            kind: "onyx.Button",
            ontap: "selectPen",
            classes: "mi mi-pen mi-lg"
        }, {
            kind: "onyx.PickerDecorator",
            components: [{
                name: "colorPicker",
                style: "background-color: black",
                classes: "mi mi-palette mi-lg",
            }, {
                kind: "onyx.Picker",
                onChange: "colorItemSelected",
                components: [{
                    name: "red",
                    style: "background-color: red;",
                    classes: "mi mi-palette mi-lg"
                }, {
                    name: "blue",
                    style: "background-color: blue;",
                    classes: "mi mi-palette mi-lg"
                }, {
                    name: "green",
                    style: "background-color: green;",
                    classes: "mi mi-palette mi-lg"
                }, {
                    name: "black",
                    style: "background-color: black;",
                    classes: "mi mi-palette mi-lg"
                }, ]
            }, ],
        }, {
            kind: "onyx.MenuDecorator",
            onSelect: "lineOptionSelected",
            components: [{
                classes: "mi mi-list-collapse mi-lg"
            }, {
                kind: "onyx.Menu",
                components: [{
                    name: "lineOption1",
                    style: "height:2px;background-color:#fff;margin:12px 0;padding:0px;"
                }, {
                    name: "lineOption2",
                    style: "height:3px;background-color:#fff;margin:12px 0;padding:1px;"
                }, {
                    name: "lineOption3",
                    style: "height:5px;background-color:#fff;margin:12px 0;padding:2px;"
                }, {
                    name: "lineOption4",
                    style: "height:10px;background-color:#fff;margin:12px 0;padding:3px;"
                }, ]
            }, ]
        }, {
            kind: "onyx.Button",
            classes: "mi mi-undo mi-lg",
            ontap: "undoPath",
            onTap: "selectUndo"
        }, {
            kind: "onyx.Button",
            classes: "mi mi-redo mi-lg",
            ontap: "redoPath"
        }, {
            kind: "onyx.MenuDecorator",
            onSelect: "optionSelected",
            components: [{
                classes: "mi mi-setting mi-lg"
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
            classes: "mi mi-arrow-left mi-lg",
            ontap: "selectPrevious"
        }, {
            kind: "onyx.Button",
            classes: "mi mi-file-outline mi-lg",
            ontap: "selectNewPage"
        }, {
            kind: "onyx.Button",
            classes: "mi mi-arrow-right mi-lg",
            ontap: "selectNext"
        }, {
            style: "width: 35%",
            content: " "
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
            classes: "mi mi-account-cancel mi-lg",
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

    undoPath: function(inSender, inEvent) {
        this.whiteboard.undo();
    },

    redoPath: function(inSender, inEvent) {
        this.whiteboard.redo();
    },

    drawRectangle: function(inSender, inEvent) {
        this.whiteboard.drawRectangle();
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

    selectEraser: function(inSender, inEvent) {
        this.curves.color = '#ffffff';
        this.curves.width = '10px';
    },

    selectPen: function(inSender, inEvent) {
        this.curves.color = '#000000';
        this.curves.width = '3px';
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
        this.$.colorPicker.applyStyle("color", color);
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
