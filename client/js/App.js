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
        kind: "onyx.Toolbar",
        fit: false,
        style: "margin: auto; background: #009eeb;border:1px solid #119eeb;",
        name: "topBar",
        components: [{
            kind: "onyx.Grabber"
        }, {
            content: "agora.io",
            style: "text-transform: uppercase;letter-spacing:0.1em;"
        }, {
            content: "Channel1",
            style: "text-transform: uppercase;letter-spacing:0.1em;"
        }, {
            kind: "onyx.Button",
            ontap: "logout",
            style: "height: 40px; float: right;background-image:url(../images/btn_quit.png);background-repeat:no-repeat;background-color:transparent;"
        }, {
            name: "upload",
            kind: "onyx.Button",
            ontap: "previewPages",
            style: "height: 40px; float:right;background-image:url(../images/btn_new.png);background-repeat:no-repeat;border-right:1px solid #fff;background-color:transparent;"
        }],
        rendered: function() {
            this.applyStyle("height", 60 + "px");
        }
    }, {
        kind: "FittableRows",
        fit: true,
        style: "text-align: center;background-color: #5b5b5b; z-index: 0;",
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
                this.applyStyle("box-shadow", "0 1px 4px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1)")

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
            name: "preview",
            kind: "onyx.Button",
            ontap: "previewPages",
            style: "background-image:url(../images/btn_thumbnails.png);background-repeat:no-repeat;background-color:transparent;"
        }, {
            kind: "onyx.Button",
            ontap: "zoomInPane",
            style: "background-image:url(../images/btn_enlarge.png);background-repeat:no-repeat;background-color:transparent;"
        }, {
            kind: "onyx.Button",
            style: "background-image:url(../images/btn_narrow.png);background-repeat:no-repeat;background-color:transparent;",
            ontap: "zoomOutPane"
        }, {
            kind: "onyx.Button",
            name: "deletePage",
            ontap: "deletePage",
            style: "float:right;background-image:url(../images/btn_del.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.Button",
            name: "clear",
            ontap: "selectClear",
            style: "float:right;background-image:url(../images/btn_clear.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.PickerDecorator",
            style: "float:right",
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
        }, {
            kind: "onyx.Button",
            ontap: "addText",
            style: "float:right;background-image:url(../images/btn_word.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            name: "eraser",
            kind: "onyx.Button",
            ontap: "selectEraser",
            style: "float: right;background-image:url(../images/btn_eraser.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.Button",
            ontap: "undoPath",
            style: "float: right;background-image:url(../images/btn_undo.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.Button",
            ontap: "redoPath",
            style: "float: right;background-image:url(../images/btn_redo.png);background-repeat:no-repeat;background-color:transparent;",
        },
        //{
            //kind: "onyx.Button",
            //classes: "fa fa-crop",
            //ontap: "cropContent",
            //style: "float:right",
        //},
        //{
            //kind: "onyx.MenuDecorator",
            //onSelect: "optionSelected",
            //style: "float: right;",
            //components: [{
                //classes: "fa fa-gear"
            //}, {
                //kind: "onyx.Menu",
                //components: [{
                    //name: "createJoinRoom",
                    //content: "Create/Join Room",
                    //popup: "createJoinRoomPopup",
                //},
                //{
                    //name: "exportToSvg",
                    //content: "Export to SVG",
                //}]
            //}, ]
        //},
        {
            kind: "onyx.Button",
            classes: "fa fa-upload",
            style: "float: right",
            ontap: "uploadFileNew"
        }, {
            kind: "onyx.Button",
            classes: "fa fa-file-o",
            ontap: "selectNewPage",
            style: "float: right;",
        }, {
            kind: "onyx.PickerDecorator",
            style: "float: right;",
            components: [{}, {
                kind: "onyx.IntegerPicker",
                name: "currentPage",
                onSelect: "gotoPage",
                min: 1,
            }, ],
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
            kind: "onyx.PickerDecorator",
            style: "float:right",
            components: [{
                classes: "fa fa-minus"
            }, {
                kind: "onyx.Picker",
                components: [{
                    name: "icon_line_1",
                    style: "background-image:url(../images/icon_line_1.png);background-repeat:no-repeat;background-position:center center;",
                    ontap: "setLineWidth1"
                }, {
                    name: "icon_line_2",
                    style: "background-image:url(../images/icon_line_2.png);background-repeat:no-repeat;background-position:center center;",
                    ontap: "setLineWidth2"
                }, {
                    name: "icon_line_3",
                    style: "background-image:url(../images/icon_line_3.png);background-repeat:no-repeat;background-position:center center;",
                    ontap: "setLineWidth3"
                }, {
                    name: "icon_line_6",
                    style: "background-image:url(../images/icon_line_6.png);background-repeat:no-repeat;background-position:center center;",
                }, {
                    name: "icon_line_8",
                    style: "background-image:url(../images/icon_line_8.png);background-repeat:no-repeat;background-position:center center;",
                }, {
                    name: "icon_line_10",
                    style: "background-image:url(../images/icon_line_10.png);background-repeat:no-repeat;background-position:center center;",
                }]
            }, ]
        }, {
            kind: "onyx.PickerDecorator",
            style: "float:right;border:1px solid #FFF;",
            components: [{
                name: "colorPicker",
                style: "background-color: black;",
            }, {
                kind: "onyx.Picker",
                onChange: "colorItemSelected",
                components: [{
                    name: "red",
                    style: "background-color: red;",
                }, {
                    name: "orange",
                    style: "background-color: orange;",
                }, {
                    name: "yellow",
                    style: "background-color: yellow;",
                }, {
                    name: "blue",
                    style: "background-color: blue;",
                }, {
                    name: "cyan",
                    style: "background-color: cyan;",
                }, {
                    name: "green",
                    style: "background-color: green;",
                }, {
                    name: "black",
                    style: "background-color: black;",
                }, {
                    name: "purple",
                    style: "background-color: purple;",
                }]
            }, ],
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
        this.closeEraser();
        this.whiteboard.zoomIn();
    },

    zoomOutPane: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.zoomOut();
    },
    undoPath: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.undo();
    },

    redoPath: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.redo();
    },

    cropContent: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.cropContent();
    },

    uploadFileNew: function(inSender,inEvent) {
        var x = $('#file-upload-root');
        if (!x || x.length === 0) {
            $(document.body).append("<div id='file-upload-root'></div>");
        }
        var u ='http://' + this.appIpAddress + ':' + this.appPort + '/upload';
        $("#file-upload-root").uploadFile({
            url: u,
            multiple:false,
            dragDrop:false,
            maxFileCount:1,
            fileName:"myfile",
            formData: {room:this.whiteboard.room, sid: this.whiteboard.sid}
        });
    },

    drawRectangle: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.drawRectangle();
    },

    drawSquare: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.drawSquare();
    },

    drawArrow: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.drawArrow();
    },

    drawEllipse: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.drawEllipse();
    },

    drawCircle: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.drawCircle();
    },

    appclicked: function(inSender, inEvent) {
        var canvasBounds = this.$.canvasContainer.getBounds();
        var x = inEvent.pageX - canvasBounds.left;
        var y = inEvent.pageY - canvasBounds.top - 60;
        this.whiteboard.appclicked(x, y);
    },

    touchstart: function(inSender, inEvent) {
        var canvasBounds = this.$.canvasContainer.getBounds();
        this.curves.oldx = inEvent.pageX - canvasBounds.left;
        this.curves.oldy = inEvent.pageY - canvasBounds.top - 60;
        this.whiteboard.startPath(this.curves.oldx, this.curves.oldy, this.curves.color, this.curves.width, true);
    },

    touchmove: function(inSender, inEvent) {
        if (this.curves.oldx != -1 && this.curves.oldy != -1) {
            var canvasBounds = this.$.canvasContainer.getBounds();
            x = inEvent.pageX - canvasBounds.left;
            y = inEvent.pageY - canvasBounds.top - 60;
            this.whiteboard.continuePath(this.curves.oldx, this.curves.oldy, x, y, this.curves.color, this.curves.width, true);
            this.curves.oldx = x;
            this.curves.oldy = y;
        }
    },

    touchend: function(inSender, inEvent) {
        if (this.curves.oldx != -1 && this.curves.oldy != -1) {
            var canvasBounds = this.$.canvasContainer.getBounds();
            x = inEvent.pageX - canvasBounds.left;
            y = inEvent.pageY - canvasBounds.top - 60;
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
        this.whiteboard.drawingItem = '';
        this.$.eraser.applyStyle("background-color", this.eraser.backgroundColor);
    },

    selectEraser: function(inSender, inEvent) {
        this.eraser.on ? this.closeEraser() : this.openEraser();
    },

    selectPen: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.selectPen();
    },

    addText: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.addText();
    },

    setLineWidth1: function(inSender, inEvent) {
        this.closeEraser();
        this.curves.width = '3px';
    },

    setLineWidth2: function(inSender, inEvent) {
        this.closeEraser();
        this.curves.width = '6px';
    },

    setLineWidth3: function(inSender, inEvent) {
        this.closeEraser();
        this.curves.width = '9px';
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

    selectNext: function(inSender, inEvent) {
        this.closeEraser();
        this.$.loadingPopup.show();
        var result = this.whiteboard.nextPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    selectPrevious: function(inSender, inEvent) {
        this.closeEraser();
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
        this.closeEraser();
        this.whiteboard.newPage();
        this.updatePageInfo();
    },

    updatePageInfo: function() {
        this.closeEraser();
        this.$.currentPage.setMax(this.whiteboard.getNumPages());
        this.$.currentPage.setValue(this.whiteboard.getCurrentPage());
    },

    gotoPage: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.gotoPage(inEvent.selected.content);
    },
});
