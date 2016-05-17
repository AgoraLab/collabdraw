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
        // sid: '',
        vid:'',
        room: 'one',
        canvasWidth: 800,
        canvasHeight: 550,
        appIpAddress: "",
        appPort: "",
        role: 'host',
        pagePreviewNum: 0,
        pagePreviewContainer: [],
        parentContainer: "",
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
            content: "Page 1",
            name: "channelId",
            style: "text-transform: uppercase;letter-spacing:0.1em;font-size: 0.8em;font-weight:normal;"
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float: right;display:none;",
            components: [{
                kind: "onyx.Button",
                name: "logoutButton",
                ontap: "logout",
                onmouseover: "logoutButtonMouseOver",
                onmouseout: "logoutButtonMouseOut",
                style: "background:url(../images/btn_quit_gray.png) top left no-repeat transparent;cursor:pointer;"
            }, {
                kind:'onyx.Tooltip',
                classes:'above',
                content:'Logout'
            }]
        }, {
            kind: "onyx.TooltipDecorator",
            style: "float:right",
            name: "uploadAndNewPageBtn",
            components: [{
                kind: "onyx.PickerDecorator",
                components: [{
                    name: "optionsPicker",
                    onmouseover: "optionsPickerMouseOver",
                    onmouseout: "optionsPickerMouseOut",
                    style: "background:url(../images/btn_new_gray.png) top left no-repeat transparent;cursor:pointer;",
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
        name: "middleFittableRows",
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
                var websocketAddress = 'wss://' + this.owner.appIpAddress + ':' + this.owner.appPort + '/realtime/';
                if (this.hasNode()) {
                    var _this = this;
                    this.owner.$.loadingPopup.show();
                    this.owner.whiteboard = new WhiteboardSvg(
                        this.node.getAttribute("id"),
                        this.owner,
                        1,
                        websocketAddress,
                        this.owner.role,
                        function(numPages, currentPage) {
                            // update button status after being initialized.
                            _this.owner.updatePageInfo();
                            _this.owner.$.loadingPopup.hide();
                            _this.owner.$.channelId.content = "Page " + _this.owner.whiteboard.getCurrentPage();
                            // render the change on the fly.
                            _this.owner.$.channelId.render();
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
        name: "bottomToolbar",
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
                content: "Zoom Out",
                classes: "above"
            }]
        },
        {
            kind: "onyx.TooltipDecorator",
            style: "float: right",
            components:[{
                kind: "onyx.Button",
                name: "deletePage",
                ontap: "deletePage",
                onmouseover: "deleteButtonMouseOver",
                onmouseout: "deleteButtonMouseOut",
                style: "background-image:url(../images/btn_del_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "background-image:url(../images/btn_clear_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "background-image:url(../images/btn_eraser_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "background-image:url(../images/btn_undo_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "background-image:url(../images/btn_redo_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "background-image:url(../images/btn_word_gray.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "background-image:url(../images/btn_pencil.png);background-repeat:no-repeat;background-color:transparent;height:25px;cursor:pointer;",
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
                style: "width:50px;",
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

    rendered: function() {
        this.inherited(arguments);
        if (this.isMobile() || this.isGuest()) {
            this.$.bottomToolbar.hide();
            this.$.uploadAndNewPageBtn.hide();
            this.$.gotoPreviousPage.hide();
            this.$.gotoNextPage.hide();
            this.$.middleFittableRows.parent.resize();
        }
    },

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
        var u ='https://' + this.appIpAddress + ':' + this.appPort + '/upload';
        $("#file-upload-root").uploadFile({
            url          : u,
            multiple     : false,
            dragDrop     : false,
            maxFileCount : 1,
            fileName     : "myfile",
            formData: {
                room : this.whiteboard.room,
                vid  : this.whiteboard.vid,
                uid  : this.whiteboard.uid
            },
            onSuccess: function(files, data, xhr, pd) {
                setTimeout(function() {
                    $(".ajax-file-upload-container").empty();
                }, 3000);
                console.log(data);
            },
            afterUploadAll: function(obj) {
                console.log(obj);
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
        if (this.isGuest()) {
            return;
        }
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
        if (this.isGuest()) {
            return;
        }
        var canvasBounds = this.$.canvasContainer.getBounds();
        this.curves.oldx = inEvent.pageX - canvasBounds.left;
        this.curves.oldy = inEvent.pageY - canvasBounds.top - 60;
        this.whiteboard.startPath(this.curves.oldx, this.curves.oldy, this.curves.color, this.curves.width, true);
    },

    touchmove: function(inSender, inEvent) {
        if (this.isGuest()) {
            return;
        }
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
        if (this.isGuest()) {
            return;
        }
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
        this.hideLaser();
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
        this.hideLaser();

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
        var totalPagesNum = this.whiteboard.getNumPages(),
            self = this;
        if (totalPagesNum <= 1) {
            $.alert("The last page cannot deleted.");
            return;
        }
        var yes = $.confirm({
            title: "Confirm",
            content: "Do you want to delete this page?",
            confirm: function() {
                self.whiteboard.deletePage();
            },
            cancel: function() {
                // do nothing.
            }
        });
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
        var allShapes = ['circle', 'triangle', 'rectangle', 'ellipse', 'arrow', 'line', 'square'];
        if (allShapes.indexOf(this.whiteboard.drawingItem) >= 0) {
            // keep it highlighted if current drawing item is one of the shapes.
            return;
        }
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

    selectPreviewPages: function(inSender, inEvent, flag) {
        var totalPages = this.whiteboard.getNumPages(),index;
        // Minus left and right arrows
        for (index = 0; index < this.pagePreviewContainer.length; index += 1) {
            this.pagePreviewContainer[index].destroy();
        }
        this.pagePreviewContainer = [];
        if(!flag){
            this.pagePreviewNum= (Math.ceil(this.whiteboard.getCurrentPage()/6)-1)*6;
        }
        for (index = 0; index < Math.min(6, totalPages-this.pagePreviewNum); index += 1) {
            var page = this.pagePreviewNum + index + 1;
            var port = Number(this.appPort) + 10000;
            var url = "http://" + this.appIpAddress + ":" + port + "/files/" + this.vid + "_"+this.room + "/" + this.whiteboard.getPageIdByPage(page) + "_thumbnail.png?version=" + $.now();
            var comp = this.createComponent({
                container: this.$.previewPagesPopup,
                style: "display:inline-block;float:left;width:120px;height:118px;;margin:10px;color:#000;background:url(" + url + ") center center no-repeat #FFF;background-size:contain;cursor:pointer;",
                content: "<div style='text-align:center;height: 100%;font-size:3em;'> " + page +" </div>",
                allowHtml: true,
                ontap: "gotoPage",
                // page index starts with 1
                index: index + 1,
                pageNum: page,
            });
            if (this.whiteboard.getCurrentPage() === page) {
                comp.applyStyle("border", "4px solid rgb(17, 158, 235)");
            }
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
        var self = this;
        self.cancelSelect();
        var yes = $.confirm({
            title: "Confirm",
            content: "Do you want to clear this page?",
            confirm: function() {
                self.whiteboard.clear(true);
            },
            cancel: function() {
                // do nothing.
            }
        });
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
        this.selectPreviewPages(inSender, inEvent, 1);
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
        console.log("selectPrevious",this.pagePreviewNum);
        if(this.pagePreviewNum==0){
            return;
        }
        this.cancelSelect();
        this.closeEraser();
        this.pagePreviewNum = this.pagePreviewNum - 6;
        this.selectPreviewPages(inSender, inEvent, 1);
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

    inIframe: function() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },

    logout: function() {
        if (this.inIframe()) {
            // Remove DOM elements inside parent container
            $(window.document).find("body").empty();
        } else {
            // We are not in a iframe
            window.location = "./logout.html";
        }
    },

    selectNewPage: function(inSender, inEvent) {
        this.closeEraser();
        this.cancelSelect();
        this.whiteboard.newPage();
        this.updatePageInfo();
    },

    updatePreviewPageBorder: function() {
        var subComponents = this.$.previewPagesPopup.children,
            index, length, pageNum;

        for (index = 0, length = subComponents.length; index < length; index += 1) {
            pageNum = subComponents[index].pageNum;
            if (pageNum === this.whiteboard.getCurrentPage()) {
                subComponents[index].applyStyle("border", "4px solid rgb(17, 158, 235)");
            } else {
                subComponents[index].applyStyle("border", "none");
            }
        }
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
        this.updatePreviewPageBorder();
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
    },

    isGuest: function() {
        return this.role === 'guest';
    },

    isMobile: function() {
        var isMobile = false; //initiate as false
        // device detection
        if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4)))
        isMobile = true;
        return isMobile;
    }
});
