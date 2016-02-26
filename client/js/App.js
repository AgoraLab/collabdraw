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
        eraser: {
            on: false,
            color: 'white',
            width: '9px',
            backgroundColor: '',
        },
        uid: 'test',
        sid: '',
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
                    this.owner.whiteboard = new WhiteboardSvg(
                        this.node.getAttribute("id"),
                        this.owner,
                        1, websocketAddress,
                        function(numPages, currentPage) {
                            _this.owner.$.currentPage.setMax(numPages);
                            _this.owner.$.currentPage.setValue(currentPage);
                            _this.owner.$.loadingPopup.hide();
                        }
                    );
                }
            },
        }],
    }, {
        kind: "onyx.MoreToolbar",
        components: [{
            name: "eraser",
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
                    style: "padding: 15px;background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAW0lEQVRIS2NkoDFgpLH5DMPDggIGBgZ/GgXVRlAQ/WdgYHCkkQX7YRbQKi7+j1pAKOpGg4hQCDGMBtFICiIHgp4lT8EBUFkEKq4DyNNPUNcGWpWicJtHLSAYCQCocR7rVnZLSQAAAABJRU5ErkJggg==');background-repeat:no-repeat;background-position: 13px 3px;"
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
                    style: "padding: 15px;background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABGklEQVRIS82V/RHBQBTEfzqgAyUoISVQASqgBCVQASpAB1QgJaQDVMBs5l7mhOR8ncnNZPLH3du9fR97LSKvVmR8GkOQAFeg7RSf3f8QykCVAgENgT7QAVIgK4F1gR5wAlbADjDi4miZQMATYOCCFPgQVCJSzMh9G2Dhx/gEus3cAw6pf7Y/dar1l+qiyALfus1844t1h2UK9kDB+gW4hVo2EhEofyrY7AfAPoTwMhHo9uqWUDHf5VfxtyJQ+0lBjJUriEmQ/iVF0Yus3EdtUxFEHzQjkVWYn3zSVZVWYWDqXTu0BNYvzIc579jZjS5ZzFSdXWv41AACONbY9cUZpLwsaNdVaVGNROQ/OAILGmNjnsxPCp7HRFdwA4i1QgnwQC9YAAAAAElFTkSuQmCC');background-repeat:no-repeat;background-position:13px 3px;"
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
                    style: "background-image:url(../images/lines-bg.png);background-repeat:no-repeat;background-position:0 -4px;",
                    ontap: "setLineWidth1"
                }, {
                    name: "lineOption2",
                    style: "background-image:url(../images/lines-bg.png);background-repeat:no-repeat;background-position:0 -76px;",
                    ontap: "setLineWidth2"
                }, {
                    name: "lineOption3",
                    style: "background-image:url(../images/lines-bg.png);background-repeat:no-repeat;background-position:0 -149px;",
                    ontap: "setLineWidth3"
                }, {
                    name: "lineOption4",
                    style: ""
                }, ]
            }, ]
        }, {
            kind: "onyx.Button",
            classes: "fa fa-text-width",
            ontap: "addText"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-rotate-left",
            ontap: "undoPath",
        }, {
            kind: "onyx.Button",
            classes: "fa fa-rotate-right",
            ontap: "redoPath"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-search-plus",
            ontap: "zoomInPane",
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
                },
                {
                    name: "exportToSvg",
                    content: "Export to SVG",
                }
                ]
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
        this.closeEraser();
    },

    zoomOutPane: function(inSender, inEvent) {
        this.whiteboard.zoomOut();
        this.closeEraser();
    },
    undoPath: function(inSender, inEvent) {
        this.whiteboard.undo();
        this.closeEraser();
    },

    redoPath: function(inSender, inEvent) {
        this.whiteboard.redo();
        this.closeEraser();
    },

    cropContent: function(inSender, inEvent) {
        this.whiteboard.cropContent();
        this.closeEraser();
    },

    drawRectangle: function(inSender, inEvent) {
        this.whiteboard.drawRectangle();
        this.closeEraser();
    },

    drawSquare: function(inSender, inEvent) {
        this.whiteboard.drawSquare();
        this.closeEraser();
    },

    drawArrow: function(inSender, inEvent) {
        this.whiteboard.drawArrow();
        this.closeEraser();
    },

    drawEllipse: function(inSender, inEvent) {
        this.whiteboard.drawEllipse();
        this.closeEraser();
    },

    drawCircle: function(inSender, inEvent) {
        this.whiteboard.drawCircle();
        this.closeEraser();
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

    openEraser: function() {
        if (this.eraser.on) return;

        this.eraser.on = true;
        this.eraser.backgroundColor = this.$.eraser.getComputedStyleValue('background-color');
        this.$.eraser.applyStyle("background-color", "black");
        this.whiteboard.selectEraser();
    },

    closeEraser: function() {
        if (!this.eraser.on) return;

        this.eraser.on = false;
        this.$.eraser.applyStyle("background-color", this.eraser.backgroundColor);
    },

    selectEraser: function(inSender, inEvent) {
        this.eraser.on ? this.closeEraser() : this.openEraser();
    },

    selectPen: function(inSender, inEvent) {
        this.whiteboard.selectPen();
        this.closeEraser();
    },

    addText: function(inSender, inEvent) {
        this.whiteboard.addText();
        this.closeEraser();
    },

    setLineWidth1: function(inSender, inEvent) {
        this.curves.width = '3px';
        this.closeEraser();
    },

    setLineWidth2: function(inSender, inEvent) {
        this.curves.width = '6px';
        this.closeEraser();
    },

    setLineWidth3: function(inSender, inEvent) {
        this.curves.width = '9px';
        this.closeEraser();
    },

    optionSelected: function(inSender, inEvent) {
        this.closeEraser();
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
        this.closeEraser();
        var color = inEvent.selected.name;
        this.$.colorPicker.applyStyle("background-color", color);
        this.curves.color = color;
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
        closeEraser();
        this.$.loadingPopup.show();
        var result = this.whiteboard.nextPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    selectPrevious: function(inSender, inEvent) {
        closeEraser();
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
        closeEraser();
        this.whiteboard.newPage();
        this.updatePageInfo();
    },

    updatePageInfo: function() {
        closeEraser();
        this.$.currentPage.setMax(this.whiteboard.getNumPages());
        this.$.currentPage.setValue(this.whiteboard.getCurrentPage());
    },

    gotoPage: function(inSender, inEvent) {
        closeEraser();
        this.whiteboard.gotoPage(inEvent.selected.content);
    },


});
