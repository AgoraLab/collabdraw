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
        pagePreviewNum: 0,
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
            style: "float: right;background-image:url(../images/btn_quit.png);background-repeat:no-repeat;background-color:transparent;"
        }, {
            kind: "onyx.PickerDecorator",
            style: "float:right;margin-top:0;",
            components: [{
                name: "optionsPicker",
                style: "float:right;background-image:url(../images/btn_new.png);background-repeat:no-repeat;background-color:transparent;",
            }, {
                kind: "onyx.Picker",
                components: [{
                    name: "newPage",
                    ontap: "uploadFileNew",
                    style: "padding: 15px;background-image: url(../images/btn_computer.png);background-repeat:no-repeat;background-position: center center;"
                }, {
                    name: "upload",
                    ontap: "selectNewPage",
                    style: "padding: 15px;background-image: url(../images/btn_newpage.png);background-repeat:no-repeat;background-position: center center;"
                }]
            }],
        }],
        rendered: function() {
            this.inherited(arguments);
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
                this.inherited(arguments);

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
                            //_this.owner.$.currentPage.setMax(numPages);
                            //_this.owner.$.currentPage.setValue(currentPage);
                            _this.owner.$.loadingPopup.hide();
                        }
                    );
                }
            },
        }],
    }, {
        kind: "onyx.MoreToolbar",
        components: [{
            name: "previewPages",
            kind: "onyx.Button",
            ontap: "selectPreviewPages",
            popup: "previewPagesPopup",
            style: "background-image:url(../images/btn_thumbnails.png);background-repeat:no-repeat;background-color:transparent;"
        },
        {
            kind: "onyx.Button",
            ontap: "zoomInPane",
            style: "background-image:url(../images/btn_enlarge.png);background-repeat:no-repeat;background-color:transparent;"
        }, {
            kind: "onyx.Button",
            style: "background-image:url(../images/btn_narrow.png);background-repeat:no-repeat;background-color:transparent;",
            ontap: "zoomOutPane"
        },
        //{
            //kind: "onyx.PickerDecorator",
            //components: [{}, {
                //kind: "onyx.IntegerPicker",
                //name: "currentPage",
                //onSelect: "gotoPage",
                //min: 1,
            //}, ],
        //},
        {
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
            name: "previewPagesPopup",
            kind: "onyx.Popup",
            centered: false,
            modal: false,
            floating: true,
            style: "height:135px; padding: 0 20px 5px 20px;background-color: rgba(0,0,0,0.5);bottom:68px;left:0;right:0;",
            components: [{
                style: "display:inline-block;float:left",
                content: "<div style='width:20px;height:120px;background-image:url(../images/btn_left.png);background-position:center center;background-repeat:no-repeat;margin:10px;'></div>",
                allowHtml: true,
                ontap: "selectPrevious",
            }, {
                style: "display:inline-block;float:right;",
                content: "<div style='width:20px;height:120px;background-image:url(../images/btn_right.png);background-repeat:no-repeat;background-position:center center;margin:10px;'></div>",
                allowHtml: true,
                ontap: "selectNext",
            }],
        }, {
            kind: "onyx.Button",
            ontap: "doSelect",
            style: "float:right;background-image:url(../images/btn_choose.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.Button",
            ontap: "selectLaserPen",
            style: "float:right;background-image:url(../images/btn_laser.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.PickerDecorator",
            style: "float:right",
            components: [{
                name: "penPicker",
                style: "width:48px;background:url(../images/btn_graph.png), url(../images/icon_more.png);background-repeat:no-repeat no-repeat;background-position:left center, right center; background-color:transparent;",
            }, {
                kind: "onyx.Picker",
                components: [{
                    name: "rectangle",
                    ontap: "drawRectangle",
                    style: "padding: 15px;background-image: url(../images/icon_rectangle.png);background-repeat:no-repeat;background-position: center center;"
                }, {
                    name: "square",
                    ontap: "drawSquare",
                    style: "padding: 15px;background-image: url(../images/icon_square.png);background-repeat:no-repeat;background-position: center center;"
                }, {
                    name: "circle",
                    ontap: "drawCircle",
                    style: "padding: 15px;background-image: url(../images/icon_circle.png);background-repeat:no-repeat;background-position: center center;"
                }, {
                    name: "triangle",
                    ontap: "drawTriangle",
                    style: "padding: 15px;background-image: url(../images/icon_triangle.png);background-repeat:no-repeat;background-position: center center;",
                }, {
                    name: "line",
                    ontap: "drawLine",
                    style: "padding: 15px;background-image: url(../images/icon_line.png);background-repeat:no-repeat;background-position: center center;",
                }, {
                    name: "arrow",
                    ontap: "drawArrow",
                    style: "padding: 15px;background-image: url(../images/icon_arrow.png);background-repeat:no-repeat;background-position: center center;",
                }, {
                    name: "ellipse",
                    ontap: "drawEllipse",
                    style: "padding: 15px;background-image: url(../images/icon_oval.png);background-repeat:no-repeat;background-position: center center;",
                }]
            }],
        }, {
            kind: "onyx.Button",
            ontap: "addImage",
            style: "float:right;background-image:url(../images/btn_img.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.Button",
            ontap: "addText",
            style: "float:right;background-image:url(../images/btn_word.png);background-repeat:no-repeat;background-color:transparent;",
        }, {
            kind: "onyx.Button",
            style: "float: right; background-image:url(../images/btn_fluorescence_light.png);background-repeat:no-repeat;background-color:transparent;",
            ontap: "selectHighlighter",
        }, {
            kind: "onyx.Button",
            style: "float: right; background-image:url(../images/btn_pencil.png);background-repeat:no-repeat;background-color:transparent;",
            ontap: "selectPen",
        }, {
            kind: "onyx.PickerDecorator",
            style: "float:right;width:50px;",
            components: [{
                style: "width: 40px;float:right;background:url(../images/icon_line_1_white.png),url(../images/icon_more.png);background-repeat:no-repeat no-repeat;background-position:left center, right center;background-color:transparent;",
            }, {
                kind: "onyx.Picker",
                components: [{
                    name: "icon_line_1",
                    style: "background-image:url(../images/icon_line_1.png);background-repeat:no-repeat;background-position:center center;height:15px;",
                    ontap: "setLineWidth1"
                }, {
                    name: "icon_line_2",
                    style: "background-image:url(../images/icon_line_2.png);background-repeat:no-repeat;background-position:center center;height:15px;",
                    ontap: "setLineWidth2"
                }, {
                    name: "icon_line_3",
                    style: "background-image:url(../images/icon_line_3.png);background-repeat:no-repeat;background-position:center center;height:15px;",
                    ontap: "setLineWidth3"
                }, {
                    name: "icon_line_6",
                    style: "background-image:url(../images/icon_line_6.png);background-repeat:no-repeat;background-position:center center;height:15px;",
                    ontap: "setLineWidth6"
                }, {
                    name: "icon_line_8",
                    style: "background-image:url(../images/icon_line_8.png);background-repeat:no-repeat;background-position:center center;height:15px;",
                    ontap: "setLineWidth8"
                }, {
                    name: "icon_line_10",
                    style: "background-image:url(../images/icon_line_10.png);background-repeat:no-repeat;background-position:center center;height:15px;",
                    ontap: "setLineWidth10"
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
        this.cancelSelect();
        this.whiteboard.undo();
    },

    redoPath: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.redo();
    },

    cropContent: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
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
        this.cancelSelect();
        this.whiteboard.drawRectangle();
    },

    drawSquare: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.drawSquare();
    },

    drawLine: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.drawLine();
    },

    drawTriangle: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.drawTriangle();
    },

    drawArrow: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.drawArrow();
    },

    drawEllipse: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.drawEllipse();
    },

    drawCircle: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
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
        this.cancelSelect();
        this.eraser.on ? this.closeEraser() : this.openEraser();
    },

    selectHighlighter: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.selectHighlighter();
    },

    selectPen: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.selectPen();
    },

    addText: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.addText();
    },

    setLineWidth1: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = '1px';
    },

    setLineWidth2: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = '2px';
    },

    setLineWidth3: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = '3px';
    },

    setLineWidth6: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = '6px';
    },

    setLineWidth8: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = '8px';
    },

    setLineWidth10: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = '10px';
    },

    optionSelected: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
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
        this.cancelSelect();
        var color = inEvent.selected.name;
        this.$.colorPicker.applyStyle("background-color", color);
        this.curves.color = color;
    },

    selectPreviewPages: function(inSender, inEvent) {

        var totalPages = this.whiteboard.getNumPages(),
            index;
        // Minus left and right arrows
        if (this.pagePreviewNum !== totalPages) {
            for (index = 0; index < totalPages; index += 1) {
                this.createComponent({
                    container: this.$.previewPagesPopup,
                    style: "display:inline-block;float:left;border:4px solid rgb(17, 158, 235);width:120px;height:118px;background-color:#fff;margin:10px;color:#000;",
                    content: "<div>Page preview goes here...</div>",
                    allowHtml: true,
                    ontap: "gotoPage",
                    // page index starts with 1
                    index: index + 1
                });
            }
            this.pagePreviewNum = totalPages;
            this.$.previewPagesPopup.render();
        }

        var p = this.$[inEvent.originator.popup];
        if (p) {
            p.show();
        }
    },

    selectClear: function(inSender, inEvent) {
        this.cancelSelect();
        var yes = confirm("Do you want to clear this page?")
        if (yes) {
            this.whiteboard.clear(true);
        }
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
        this.cancelSelect();
        this.$.loadingPopup.show();
        var result = this.whiteboard.nextPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    selectPrevious: function(inSender, inEvent) {
        this.cancelSelect();
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
        this.cancelSelect();
        this.whiteboard.newPage();
        this.updatePageInfo();
    },

    updatePageInfo: function() {
        this.closeEraser();
        this.cancelSelect();
        //this.$.currentPage.setMax(this.whiteboard.getNumPages());
        //this.$.currentPage.setValue(this.whiteboard.getCurrentPage());
    },

    gotoPage: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        //this.whiteboard.gotoPage(inEvent.selected.content);
        this.whiteboard.gotoPage(inSender.index);
    },

    doSelect: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.doSelect();
    },

    selectLaserPen: function(inSender, inEvent) {
        this.closeEraser();
        this.whiteboard.drawingItem = '';
        this.whiteboard.drawLaser();
    },

    cancelSelect: function() {
        this.whiteboard.cancelSelect();
    }
});
