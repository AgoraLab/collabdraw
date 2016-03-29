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
            previousDrawingItem: 'pen',
        },
        laser: {
            on: false,
            previousDrawingItem: 'pen'
        },
        pen: {
            on: true,
            previousDrawingItem: ''
        },
        highlighter: {
            on: false,
            previousDrawingItem: 'pen'
        },
        selecting: {
            on: false,
            previousDrawingItem: 'pen'
        },
        textEditing: {
            on: false,
            previousDrawingItem: 'pen'
        },
        uid: 'test',
        sid: '',
        room: 'one',
        canvasWidth: 800,
        canvasHeight: 550,
        appIpAddress: "",
        appPort: "",
        pagePreviewNum: 0,
        pagePreviewContainer: [],
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
            kind: "onyx.TooltipDecorator",
            style: "float: right;",
            components: [{
                kind: "onyx.Button",
                name: "logoutButton",
                ontap: "logout",
                onmouseover: "logoutButtonMouseOver",
                onmouseout: "logoutButtonMouseOut",
                style: "background-image:url(../images/btn_quit_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;"
            }, {
                kind:'onyx.Tooltip',
                classes:'above',
                content:'Logout'
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float:right;",
            components: [{
                kind: "onyx.PickerDecorator",
                style: "margin-top:0;",
                components: [{
                    name: "optionsPicker",
                    onmouseover: "optionsPickerMouseOver",
                    onmouseout: "optionsPickerMouseOut",
                    style: "float:right;background-image:url(../images/btn_new_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
                }, {
                    kind: "onyx.Picker",
                    components: [{
                        name: "upload",
                        ontap: "uploadFileNew",
                        style: "padding: 15px;background-image: url(../images/btn_computer.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;",
                    }, {
                        name: "newPage",
                        ontap: "selectNewPage",
                        style: "padding: 15px;background-image: url(../images/btn_newpage.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;"
                    }],
                }],
            }, {
                kind:'onyx.Tooltip',
                classes:'above',
                content:'Add New'
            }]
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
            style: "display:inline-block;height:40px;width:40px;padding:5px;background:url(../images/btn_left.png) center center no-repeat #808080;position:absolute;left:2%;top:50%;cursor:pointer;z-index:10;border-radius:5px;cursor:pointer;",
            ontap: "gotoPreviousPage",
            onmouseover: "gotoPreviousPageMouseOver",
            onmouseout: "gotoPreviousPageMouseOut",
            name: "gotoPreviousPage",
        }, {
            style: "margin: auto; background-color: #FFFFFF;display:inline-block;",
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
                this.applyStyle("cursor", "auto");
                this.applyStyle("cursor", "url(../images/mouse.png) 4 4, auto");

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
                            // update button status after being initialized.
                            _this.owner.updatePageInfo();
                            _this.owner.$.loadingPopup.hide();
                        }
                    );
                }
            },
        }, {
            style: "display:inline-block;height:40px;width:40px;padding:5px;background:url(../images/btn_right.png) center center no-repeat #808080;position:absolute;right:2%;top:50%;cursor:pointer;z-index:10;border-radius:5px;cursor:pointer;",
            ontap: "gotoNextPage",
            onmouseover: "gotoNextPageMouseOver",
            onmouseout: "gotoNextPageMouseOut",
            name: "gotoNextPage",
        },],
    }, {
        kind: "onyx.MoreToolbar",
        components: [{
            kind: "onyx.TooltipDecorator",
            style: "",
            components: [{
                name: "previewPages",
                kind: "onyx.Button",
                ontap: "selectPreviewPages",
                onmouseover: "previewMouseOver",
                onmouseout: "previewMouseOut",
                popup: "previewPagesPopup",
                style: "background-image:url(../images/btn_thumbnails_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;"
            }, {
                kind: "onyx.Tooltip",
                content: "Preview Pages",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "",
            components: [{
                kind: "onyx.Button",
                ontap: "zoomInPane",
                name: "zoomInButton",
                onmouseover: "zoomInMouseOver",
                onmouseout: "zoomInMouseOut",
                style: "background-image:url(../images/btn_enlarge_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;"
            }, {
                kind: "onyx.Tooltip",
                content: "Zoom In",
                classes: "above"
            }],
        }, {
            kind: "onyx.TooltipDecorator",
            style: "",
            components: [{
                kind: "onyx.Button",
                name: "zoomOutButton",
                style: "background-image:url(../images/btn_narrow_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
                ontap: "zoomOutPane",
                onmouseover: "zoomOutMouseOver",
                onmouseout: "zoomOutMouseOut",
            }, {
                kind: "onyx.Tooltip",
                content: "Zoon Out",
                classes: "above"
            }]
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
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components:[{
                kind: "onyx.Button",
                name: "deletePage",
                ontap: "deletePage",
                onmouseover: "deleteButtonMouseOver",
                onmouseout: "deleteButtonMouseOut",
                style: "float:right;background-image:url(../images/btn_del_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Delete Page",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components: [{
                kind: "onyx.Button",
                name: "clear",
                onmouseover: "clearButtonMouseOver",
                onmouseout: "clearButtonMouseOut",
                ontap: "selectClear",
                style: "float:right;background-image:url(../images/btn_clear_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Clear page",
                classes: "above"
            }],
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components: [{
                name: "eraser",
                kind: "onyx.Button",
                ontap: "selectEraser",
                style: "float: right;background-image:url(../images/btn_eraser_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
                onmouseover: "eraserMouseOver",
                onmouseout: "eraserMouseOut",
            }, {
                kind: "onyx.Tooltip",
                content: "Eraser",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float:right;",
            components: [{
                kind: "onyx.Button",
                ontap: "undoPath",
                name: "undoButton",
                onmouseover: "undoButtonMouseOver",
                onmouseout: "undoButtonMouseOut",
                style: "float: right;background-image:url(../images/btn_undo_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Undo",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components: [{
                kind: "onyx.Button",
                ontap: "redoPath",
                name: "redoButton",
                onmouseover: "redoButtonMouseOver",
                onmouseout: "redoButtonMouseOut",
                style: "float: right;background-image:url(../images/btn_redo_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Redo",
                classes: "above"
            }],
        },
        //{
            //kind: "onyx.Button",
            //classes: "fa fa-crop",
            //ontap: "cropContent",
            //style: "float:right",
        //},
        {
            name: "previewPagesPopup",
            kind: "onyx.Popup",
            centered: false,
            modal: false,
            floating: true,
            style: "height:135px; padding: 0 0 5px 0;background-color: rgba(0,0,0,0.5);bottom:68px;left:0;right:0;",
            components: [{
                style: "display:inline-block;float:left",
                content: "<div style='width:40px;height:140px;background-image:url(../images/btn_left.png);background-position:center center;background-repeat:no-repeat;margin:0;background-color:rgba(0,0,0,0.8);border-radius:5px;cursor:pointer;'></div>",
                allowHtml: true,
                ontap: "selectPrevious",
            }, {
                style: "display:inline-block;float:right;",
                content: "<div style='width:40px;height:140px;background-image:url(../images/btn_right.png);background-repeat:no-repeat;background-position:center center;margin:0;background-color:rgba(0,0,0,0.8);border-radius:5px;cursor:pointer;'></div>",
                allowHtml: true,
                ontap: "selectNext",
            }],
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components: [{
                kind: "onyx.Button",
                ontap: "doSelect",
                name: "selectButton",
                onmouseover: "selectButtonMouseOver",
                onmouseout: "selectButtonMouseOut",
                style: "background-image:url(../images/btn_choose_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Select",
                classes: "above"
            }],
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right;",
            components: [{
                kind: "onyx.Button",
                name: "laserPen",
                onmouseover: "laserPenMouseOver",
                onmouseout: "laserPenMouseOut",
                ontap: "selectLaserPen",
                style: "background-image:url(../images/btn_laser_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Laser",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right;",
            components: [{
                kind: "onyx.PickerDecorator",
                components: [{
                    name: "penPicker",
                    kind: "onyx.Button",
                    onmouseover: "penPickerMouseOver",
                    onmouseout: "penPickerMouseOut",
                    style: "width:38px;background:url(../images/btn_graph_gray.png), url(../images/icon_more_gray.png);background-repeat:no-repeat no-repeat;background-position:left top, right center; background-color:transparent;background-size:25px,10px;height:30px;padding:0;cursor:pointer;",
                }, {
                    kind: "onyx.Picker",
                    maxHeight: "400px",
                    components: [{
                        name: "rectangle",
                        ontap: "drawRectangle",
                        style: "padding: 15px;background-image: url(../images/icon_rectangle.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;"
                    }, {
                        name: "square",
                        ontap: "drawSquare",
                        style: "padding: 15px;background-image: url(../images/icon_square.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;"
                    }, {
                        name: "circle",
                        ontap: "drawCircle",
                        style: "padding: 15px;background-image: url(../images/icon_circle.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;"
                    }, {
                        name: "triangle",
                        ontap: "drawTriangle",
                        style: "padding: 15px;background-image: url(../images/icon_triangle.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;",
                    }, {
                        name: "line",
                        ontap: "drawLine",
                        style: "padding: 15px;background-image: url(../images/icon_line.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;",
                    }, {
                        name: "arrow",
                        ontap: "drawArrow",
                        style: "padding: 15px;background-image: url(../images/icon_arrow.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;",
                    }, {
                        name: "ellipse",
                        ontap: "drawEllipse",
                        style: "padding: 15px;background-image: url(../images/icon_oval.png);background-repeat:no-repeat;background-position: center center;cursor:pointer;",
                    }],
                }],
            }, {
                kind: "onyx.Tooltip",
                content: "Shapes",
                classes: "above"
            }]
        },
        //{
            //kind: "onyx.TooltipDecorator",
            //style: "float: right",
            //components: [{
                //kind: "onyx.Button",
                //ontap: "addImage",
                //style: "float:right;background-image:url(../images/btn_img.png);background-repeat:no-repeat;background-color:transparent;",
            //}, {
                //kind: "onyx.Tooltip",
                //content: "Add Image",
                //classes: "above"
            //}]
        //},
        {
            kind: "onyx.TooltipDecorator",
            style: "float: right;",
            components: [{
                kind: "onyx.Button",
                name: "addTextButton",
                onmouseover: "addTextButtonMouseOver",
                onmouseout: "addTextButtonMouseOut",
                ontap: "addText",
                style: "float:right;background-image:url(../images/btn_word_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
            }, {
                kind: "onyx.Tooltip",
                content: "Add Text",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float:right;",
            components: [{
                kind: "onyx.Button",
                name: "highlighter",
                onmouseover: "highlighterMouseOver",
                onmouseout: "highlighterMouseOut",
                style: "background-image:url(../images/btn_highlighter_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
                ontap: "selectHighlighter",
            }, {
                kind: "onyx.Tooltip",
                content: "Highlighter",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components: [{
                kind: "onyx.Button",
                name: "pencilButton",
                onmouseover: "pencilMouseOver",
                onmouseout: "pencilMouseOut",
                style: "float: right; background-image:url(../images/btn_pencil.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
                ontap: "selectPen",
            }, {
                kind: "onyx.Tooltip",
                content: "Pen",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right;",
            components: [{
                kind: "onyx.PickerDecorator",
                style: "float:right;width:50px;",
                components: [{
                    name: "lineWidthPicker",
                    kind: "onyx.Button",
                    style: "width: 40px;background:url(../images/icon_line_1_white.png),url(../images/icon_more.png);background-repeat:no-repeat no-repeat;background-position:left center, right center;background-color:transparent;height:25px;cursor:pointer;",
                }, {
                    kind: "onyx.Picker",
                    maxHeight: "400px",
                    components: [{
                        name: "icon_line_1",
                        style: "background-image:url(../images/icon_line_1.png);background-repeat:no-repeat;background-position:center center;height:15px;cursor:pointer;",
                        ontap: "setLineWidth1"
                    }, {
                        name: "icon_line_2",
                        style: "background-image:url(../images/icon_line_2.png);background-repeat:no-repeat;background-position:center center;height:15px;cursor:pointer;",
                        ontap: "setLineWidth2"
                    }, {
                        name: "icon_line_3",
                        style: "background-image:url(../images/icon_line_3.png);background-repeat:no-repeat;background-position:center center;height:15px;cursor:pointer;",
                        ontap: "setLineWidth3"
                    }, {
                        name: "icon_line_6",
                        style: "background-image:url(../images/icon_line_6.png);background-repeat:no-repeat;background-position:center center;height:15px;cursor:pointer;",
                        ontap: "setLineWidth6"
                    }, {
                        name: "icon_line_8",
                        style: "background-image:url(../images/icon_line_8.png);background-repeat:no-repeat;background-position:center center;height:15px;cursor:pointer;",
                        ontap: "setLineWidth8"
                    }, {
                        name: "icon_line_10",
                        style: "background-image:url(../images/icon_line_10.png);background-repeat:no-repeat;background-position:center center;height:15px;cursor:pointer;",
                        ontap: "setLineWidth10"
                    }]
                }]
            }, {
                kind: "onyx.Tooltip",
                content: "Line Width",
                classes: "above"
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components: [{
                kind: "onyx.PickerDecorator",
                style: "border:1px solid #FFF;",
                name: "colorPickerWrapper",
                components: [{
                    name: "colorPicker",
                    kind: "onyx.Button",
                    style: "background-color: black;height:30px;cursor:pointer;",
                }, {
                    kind: "onyx.Picker",
                    name: "colorItemSelectedHolder",
                    onChange: "colorItemSelected",
                    maxHeight: "400px",
                    components: [{
                        name: "red",
                        style: "background-color: red;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "orange",
                        style: "background-color: orange;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "yellow",
                        style: "background-color: yellow;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "blue",
                        style: "background-color: blue;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "cyan",
                        style: "background-color: cyan;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "green",
                        style: "background-color: green;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "black",
                        style: "background-color: black;height:6px;width:30px;cursor:pointer;",
                    }, {
                        name: "purple",
                        style: "background-color: purple;height:6px;width:30px;cursor:pointer;",
                    }]
                }, ],
            }, {
                kind: "onyx.Tooltip",
                content: "Color",
                classes: "above"
            }]
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
        }],
    }],

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
        //this.whiteboard.undo();
        this.whiteboard.undoWithDrawing();
    },

    redoPath: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        //this.whiteboard.redo();
        this.whiteboard.redoWithDrawing();
    },

    cropContent: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.cropContent();
    },

    uploadFileNew: function(inSender,inEvent) {
        // cleanup the divs left over
        $(".ajax-file-upload-container").remove();

        var x = $('#file-upload-root');
        if (!x || x.length === 0) {
            $(document.body).append("<span id='file-upload-root' style='z-index:-1000;position:relative;'></span>");
        }
        var u ='http://' + this.appIpAddress + ':' + this.appPort + '/upload';
        $("#file-upload-root").uploadFile({
            url          : u,
            multiple     : false,
            dragDrop     : false,
            maxFileCount : 1,
            fileName     : "myfile",
            formData: {
                room : this.whiteboard.room,
                sid  : this.whiteboard.sid
            },
            onSuccess: function(files, data, xhr, pd) {
                setTimeout(function() {
                    $(".ajax-file-upload-container").empty();
                }, 3000);
            },
            afterUploadAll: function(obj) {
                // TODO
            },
            onError: function(files, status, errMsg, pd) {
                // TODO
            },
            onCancel: function(files, pd) {
                // TODO
            }
        });
        setTimeout(function() {
            $("input[id^='ajax-upload-id']").trigger("click");
        }, 1000);
    },

    drawRectangle: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawRectangle();
        this.highlightPenPicker();
    },

    drawSquare: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawSquare();
        this.highlightPenPicker();
    },

    drawLine: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawLine();
        this.highlightPenPicker();
    },

    drawTriangle: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawTriangle();
        this.highlightPenPicker();
    },

    drawArrow: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawArrow();
        this.highlightPenPicker();
    },

    drawEllipse: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawEllipse();
        this.highlightPenPicker();
    },

    drawCircle: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.closePen();
        this.hideLaser();
        this.whiteboard.drawCircle();
        this.highlightPenPicker();
    },

    appclicked: function(inSender, inEvent) {
        var canvasBounds = this.$.canvasContainer.getBounds();
        var x = inEvent.pageX - canvasBounds.left;
        var y = inEvent.pageY - canvasBounds.top;
        this.whiteboard.appclicked(x, y);
        // Enable eraser if there is at least one elements been selected.
        if (this.whiteboard.hasSelectElement()) {
            this.highlightEraser();
        }

        this.cancelEditingText();
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
            this.whiteboard.endPath(this.curves.oldx, this.curves.oldy, x, y, this.curves.color, this.curves.width, undefined, true);
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

    closeEraser: function() {
        if (!this.eraser.on) return;

        this.eraser.on = false;
        this.$.eraser.applyStyle("background-image", "url(../images/btn_eraser_gray.png)");
    },

    selectEraser: function(inSender, inEvent) {
        this.whiteboard.removeSelected(true);
    },

    selectLaserPen: function(inSender, inEvent) {
        this.closeEraser();
        this.laser.on ? this.hideLaser() : this.showLaser();
    },

    showLaser: function() {
        this.laser.on = true;
        this.laser.previousDrawingItem = this.whiteboard.drawingItem;
        this.whiteboard.drawingItem = '';
        this.whiteboard.drawLaser();
        this.$.laserPen.applyStyle("background-image", "url(../images/btn_laser.png)");
    },

    hideLaser: function() {
        this.laser.on = false;
        this.whiteboard.drawingItem = this.laser.previousDrawingItem;
        this.whiteboard.removeLaser();
        this.$.laserPen.applyStyle("background-image", "url(../images/btn_laser_gray.png)");
    },

    openHighlighter: function() {
        if (this.highlighter.on) {
            return;
        }
        this.highlighter.on = true;
        this.$.highlighter.applyStyle("background-image", "url(../images/btn_highlighter.png)");
        this.whiteboard.selectHighlighter();
    },

    closeHighlighter: function() {
        if (!this.highlighter.on) {
            return;
        }

        this.highlighter.on = false;
        this.whiteboard.drawingItem = this.highlighter.previousDrawingItem;
        this.$.highlighter.applyStyle("background-image", "url(../images/btn_highlighter_gray.png)");
    },

    selectHighlighter: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closePen();
        this.cancelEditingText();
        this.dimPenPicker();
        //this.highlighter.on ? this.closeHighlighter() : this.openHighlighter();
        this.openHighlighter();
    },

    openPen: function() {
        if (this.pen.on) return;

        this.pen.on = true;
        this.$.pencilButton.applyStyle("background-image", "url(../images/btn_pencil.png)");
        this.pen.previousDrawingItem = this.whiteboard.drawingItem;
        this.whiteboard.selectPen();
    },

    closePen: function() {
        if (!this.pen.on) return;

        this.pen.on = false;
        this.$.pencilButton.applyStyle("background-image", "url(../images/btn_pencil_gray.png)");
        this.whiteboard.drawingItem = this.pen.previousDrawingItem;
    },

    selectPen: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closeHighlighter();
        this.cancelEditingText();
        this.dimPenPicker();
        this.hideLaser();
        //this.pen.on ? this.closePen() : this.openPen();
        this.openPen();
    },

    addText: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.closePen();
        this.closeHighlighter();
        this.dimPenPicker();

        //this.textEditing.on ? this.cancelEditingText() : this.startEditingText();
        this.startEditingText();
    },

    startEditingText: function() {
        if (!this.textEditing) return;

        this.textEditing.on = true;
        this.$.addTextButton.applyStyle("background-image", "url(../images/btn_word.png)");
        this.textEditing.previousDrawingItem = this.whiteboard.drawingItem;
        this.whiteboard.addText();
    },

    cancelEditingText: function() {
        if (!this.textEditing.on) return;

        this.textEditing.on = false;
        this.$.addTextButton.applyStyle("background-image", "url(../images/btn_word_gray.png)");
        this.whiteboard.stopAddingText(this.textEditing.previousDrawingItem);
    },

    setLineWidth1: function(inSender, inEvent) {
        this.setLineWidthN(1);
    },

    setLineWidth2: function(inSender, inEvent) {
        this.setLineWidthN(2);
    },

    setLineWidth3: function(inSender, inEvent) {
        this.setLineWidthN(3);
    },

    setLineWidth6: function(inSender, inEvent) {
        this.setLineWidthN(6);
    },

    setLineWidth8: function(inSender, inEvent) {
        this.setLineWidthN(8);
    },

    setLineWidth10: function(inSender, inEvent) {
        this.setLineWidthN(10);
    },

    setLineWidthN: function(width) {
        this.closeEraser();
        this.cancelSelect();
        this.curves.width = String(width) + 'px';
        this.$.lineWidthPicker.applyStyle("background", "url(../images/icon_line_" + width + "_white.png),url(../images/icon_more.png)");
        this.$.lineWidthPicker.applyStyle("background-repeat", "no-repeat no-repeat");
        this.$.lineWidthPicker.applyStyle("background-position", "left center, right center");
        this.$.lineWidthPicker.applyStyle("background-color", "transparent");
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

    clearButtonMouseOver: function(inSender, inEvent) {
        this.$.clear.applyStyle("background-image", "url(../images/btn_clear.png)");
    },

    clearButtonMouseOut: function(inSender, inEvent) {
        this.$.clear.applyStyle("background-image", "url(../images/btn_clear_gray.png)");
    },

    highlightEraser: function() {
        this.$.eraser.applyStyle("background-image", "url(../images/btn_eraser.png)");
    },

    eraserMouseOver: function(inSender, inEvent) {
        this.highlightEraser();
    },

    eraserMouseOut: function(inSender, inEvent) {
        if (!this.eraser.on) {
            this.$.eraser.applyStyle("background-image", "url(../images/btn_eraser_gray.png)");
        }
    },
    deletePage:function(inSender, inEvent){
        var totalPagesNum = this.whiteboard.getNumPages();
        if (totalPagesNum <= 1) {
            alert("The last page cannot deleted.");
            return;
        }
        var yes = confirm("Do you want to delete this page?");
        if (yes) {
            this.whiteboard.deletePage();
        }
    },
    deleteButtonMouseOver: function(inSender, inEvent) {
        this.$.deletePage.applyStyle("background-image", "url(../images/btn_del.png)");
    },

    deleteButtonMouseOut: function(inSender, inEvent) {
        this.$.deletePage.applyStyle("background-image", "url(../images/btn_del_gray.png)");
    },

    undoButtonMouseOver: function(inSender, inEvent) {
        this.$.undoButton.applyStyle("background-image", "url(../images/btn_undo.png)");
    },

    undoButtonMouseOut: function(inSender, inEvent) {
        this.$.undoButton.applyStyle("background-image", "url(../images/btn_undo_gray.png)");
    },

    redoButtonMouseOver: function(inSender, inEvent) {
        this.$.redoButton.applyStyle("background-image", "url(../images/btn_redo.png)")
    },

    redoButtonMouseOut: function(inSender, inEvent) {
        this.$.redoButton.applyStyle("background-image", "url(../images/btn_redo_gray.png)");
    },

    selectButtonMouseOver: function(inSender, inEvent) {
        this.$.selectButton.applyStyle("background-image", "url(../images/btn_choose.png)");
    },

    selectButtonMouseOut: function(inSender, inEvent) {
        if (!this.selecting.on) {
            this.$.selectButton.applyStyle("background-image", "url(../images/btn_choose_gray.png)");
        }
    },

    laserPenMouseOver: function(inSender, inEvent) {
        this.$.laserPen.applyStyle("background-image", "url(../images/btn_laser.png)");
    },

    laserPenMouseOut: function(inSender, inEvent) {
        if (!this.laser.on) {
            this.$.laserPen.applyStyle("background-image", "url(../images/btn_laser_gray.png)");
        }
    },

    highlightPenPicker: function() {
        this.$.penPicker.applyStyle("background", "url(../images/btn_graph.png), url(../images/icon_more.png)");
        this.$.penPicker.applyStyle("background-repeat", "no-repeat no-repeat");
        this.$.penPicker.applyStyle("background-position", "left center, right center");
        this.$.penPicker.applyStyle("background-color", "transparent");
        this.$.penPicker.applyStyle("background-size", "25px,10px");
    },

    penPickerMouseOver: function(inSender, inEvent) {
        this.highlightPenPicker()
    },

    dimPenPicker: function() {
        this.$.penPicker.applyStyle("background", "url(../images/btn_graph_gray.png), url(../images/icon_more_gray.png)");
        this.$.penPicker.applyStyle("background-repeat", "no-repeat no-repeat");
        this.$.penPicker.applyStyle("background-position", "left center, right center");
        this.$.penPicker.applyStyle("background-color", "transparent");
        this.$.penPicker.applyStyle("background-size", "25px,10px");
    },

    penPickerMouseOut: function(inSender, inEvent) {
        this.dimPenPicker();
    },

    addTextButtonMouseOver: function(inSender, inEvent) {
        this.$.addTextButton.applyStyle("background-image", "url(../images/btn_word.png)");
    },

    addTextButtonMouseOut: function(inSender, inEvent) {
        if (!this.textEditing.on) {
            this.$.addTextButton.applyStyle("background-image", "url(../images/btn_word_gray.png)");
        }
    },

    highlighterMouseOver: function(inSender, inEvent) {
        this.$.highlighter.applyStyle("background-image", "url(../images/btn_highlighter.png)");
    },

    highlighterMouseOut: function(inSender, inEvent) {
        if (!this.highlighter.on) {
            this.$.highlighter.applyStyle("background-image", "url(../images/btn_highlighter_gray.png)");
        }
    },

    pencilMouseOver: function(inSender, inEvent) {
        this.$.pencilButton.applyStyle("background-image", "url(../images/btn_pencil.png)");
    },

    pencilMouseOut: function(inSender, inEvent) {
        if (!this.pen.on) {
            this.$.pencilButton.applyStyle("background-image", "url(../images/btn_pencil_gray.png)");
        }
    },

    logoutButtonMouseOver: function(inSender, inEvent) {
        this.$.logoutButton.applyStyle("background-image", "url(../images/btn_quit.png)");
    },

    logoutButtonMouseOut: function(inSender, inEvent) {
        this.$.logoutButton.applyStyle("background-image", "url(../images/btn_quit_gray.png)");
    },

    optionsPickerMouseOver: function(inSender, inEvent) {
        this.$.optionsPicker.applyStyle("background-image", "url(../images/btn_new.png)");
    },

    optionsPickerMouseOut: function(inSender, inEvent) {
        this.$.optionsPicker.applyStyle("background-image", "url(../images/btn_new_gray.png)");
    },

    zoomOutMouseOver: function(inSender, inEvent) {
        this.$.zoomOutButton.applyStyle("background-image", "url(../images/btn_narrow.png)");
    },

    zoomOutMouseOut: function(inSender, inEvent) {
        this.$.zoomOutButton.applyStyle("background-image", "url(../images/btn_narrow_gray.png)");
    },

    zoomInMouseOver: function(inSender, inEvent) {
        this.$.zoomInButton.applyStyle("background-image", "url(../images/btn_enlarge.png)");
    },

    zoomInMouseOut: function(inSender, inEvent) {
        this.$.zoomInButton.applyStyle("background-image", "url(../images/btn_enlarge_gray.png)");
    },

    previewMouseOver: function(inSender, inEvent) {
        this.$.previewPages.applyStyle("background-image", "url(../images/btn_thumbnails.png)");
    },

    previewMouseOut: function(inSender, inEvent) {
        this.$.previewPages.applyStyle("background-image", "url(../images/btn_thumbnails_gray.png)");
    },

    selectPreviewPages: function(inSender, inEvent) {
        var totalPages = this.whiteboard.getNumPages(),
            index;
        // Minus left and right arrows
        // if (this.pagePreviewNum == 0) {
        for (index = 0; index < this.pagePreviewContainer.length; index += 1) {
            this.pagePreviewContainer[index].destroy();
        }
        this.pagePreviewContainer = [];
        for (index = 0; index < Math.min(6, totalPages-this.pagePreviewNum); index += 1) {
            var page=this.pagePreviewNum+index+1;
            var url="http://"+this.appIpAddress+":"+this.appPort+"/files/"+this.room+"/"+this.whiteboard.getPageIdByPage(page)+"_thumbnail.png?version="+ $.now();
            var comp = this.createComponent({
                container: this.$.previewPagesPopup,
                style: "display:inline-block;float:left;border:4px solid rgb(17, 158, 235);width:120px;height:118px;;margin:10px;color:#000;background:url(" + url + ") center center no-repeat #FFF;background-size:contain;cursor:pointer;",
                content: "<div style='text-align:center;height: 100%;font-size:3em;'> " + page +" </div>",
                allowHtml: true,
                ontap: "gotoPage",
                // page index starts with 1
                index: index + 1
            });
            this.pagePreviewContainer.push(comp);
        }
        this.$.previewPagesPopup.render();
        // }
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
        if(this.pagePreviewNum+6>this.whiteboard.getNumPages()){
            return;
        }
        this.closeEraser();
        this.cancelSelect();
        this.pagePreviewNum = this.pagePreviewNum + 6;
        this.selectPreviewPages(inSender, inEvent)
    },

    gotoNextPageMouseOver: function(inSender, inEvent) {
        this.$.gotoNextPage.applyStyle("background", "url(../images/btn_right_gray.png) center center no-repeat");
        this.$.gotoNextPage.applyStyle("background-color", "#FFF");
    },

    gotoNextPageMouseOut: function(inSender, inEvent) {
        this.$.gotoNextPage.applyStyle("background", "url(../images/btn_right.png) center center no-repeat");
        this.$.gotoNextPage.applyStyle("background-color", "#808080");
    },

    gotoPreviousPageMouseOver: function(inSender, inEvent) {
        this.$.gotoPreviousPage.applyStyle("background", "url(../images/btn_left_gray.png) center center no-repeat");
        this.$.gotoPreviousPage.applyStyle("background-color", "#FFF");
    },

    gotoPreviousPageMouseOut: function(inSender, inEvent) {
        this.$.gotoPreviousPage.applyStyle("background", "url(../images/btn_left.png) center center no-repeat");
        this.$.gotoPreviousPage.applyStyle("background-color", "#808080");
    },

    gotoNextPage: function(inSender, inEvent) {
        this.$.loadingPopup.show();
        var result = this.whiteboard.nextPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    gotoPreviousPage: function(inSender, inEvent) {
        this.$.loadingPopup.show();
        var result = this.whiteboard.prevPage();
        this.updatePageInfo();
        if (!result) this.$.loadingPopup.hide();
    },

    selectPrevious: function(inSender, inEvent) {
        if(this.pagePreviewNum==0){
            return;
        }
        this.cancelSelect();
        this.closeEraser();
        this.pagePreviewNum = this.pagePreviewNum - 6;
        this.selectPreviewPages(inSender, inEvent, -1)
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
        // restore button status
        this.closeEraser();
        this.cancelSelect();

        // update previous and next button style
        var totalPagesNum = this.whiteboard.getNumPages(),
            currentPage = this.whiteboard.getCurrentPage();

        if (currentPage > totalPagesNum) {
            // current page cannot larger than number of total pages
            currentPage = totalPagesNum;
        }

        if (currentPage === 1) {
            this.$.gotoPreviousPage.applyStyle("cursor", "default");
            this.$.gotoPreviousPage.applyStyle("opacity", "0.3");
        } else {
            this.$.gotoPreviousPage.applyStyle("cursor", "pointer");
            this.$.gotoPreviousPage.applyStyle("opacity", "1");
        }

        if (currentPage === totalPagesNum) {
            this.$.gotoNextPage.applyStyle("cursor", "default");
            this.$.gotoNextPage.applyStyle("opacity", "0.3");
        } else {
            this.$.gotoNextPage.applyStyle("cursor", "pointer");
            this.$.gotoNextPage.applyStyle("opacity", "1");
        }

        if (currentPage > 1 && currentPage < totalPagesNum) {
            this.$.gotoPreviousPage.applyStyle("cursor", "pointer");
            this.$.gotoPreviousPage.applyStyle("opacity", "1");

            this.$.gotoNextPage.applyStyle("cursor", "pointer");
            this.$.gotoNextPage.applyStyle("opacity", "1");
        }

    },

    gotoPage: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.$.loadingPopup.show();
        var result = this.whiteboard.gotoPage(this.pagePreviewNum+inSender.index);
        if (!result) this.$.loadingPopup.hide();
        this.updatePageInfo();
    },

    doSelect: function(inSender, inEvent) {
        this.closeEraser();
        this.closePen();
        this.closeHighlighter();
        this.dimPenPicker();
        //this.selecting.on ? this.cancelSelect() : this.openSelect();
        this.openSelect();
    },

    openSelect: function() {
        if (this.selecting.on) return;

        this.selecting.on = true;
        this.$.selectButton.applyStyle("background-image", "url(../images/btn_choose.png)");
        this.whiteboard.doSelect();
    },

    cancelSelect: function() {
        //if (!this.selecting.on) return;

        this.selecting.on = false;
        this.$.selectButton.applyStyle("background-image", "url(../images/btn_choose_gray.png)");
        //this.whiteboard.drawingItem = this.selecting.previousDrawingItem;
        this.whiteboard.cancelSelect();
        this.whiteboard.stopDoingSelect();
    }
});
