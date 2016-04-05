/*
 * AgoraWhiteBoardApi.js - Javascript API for Agora White Borad
 * GNU Licensed
 * Sun Yurun (sunyurun@agora.io)
 * http://agora.io
 * https://github.com/AgoraLab/collabdraw
 */

// Initialize root namespace

(function(window) {
    window.Agora = window.Agora || {};

    (function($) {
        $(function() {
            // utility function to create namespace
            function createNS(namespace) {
                var nsparts = namespace.split("."),
                    parent = Agora;

                // we want to be able to include or exclude the root namespace so we strip
                // it if it's in the namespace
                if (nsparts[0] === "Agora") {
                    nsparts = nsparts.slice(1);
                }

                // loop through the parts and create a nested namespace if necessary
                for (var i = 0; i < nsparts.length; i++) {
                    var partname = nsparts[i];
                    // check if the current parent already has the namespace declared
                    // if it isn't, then create it
                    if (typeof parent[partname] === "undefined") {
                        parent[partname] = {};
                    }
                    // get a reference to the deepest element in the hierarchy so far
                    parent = parent[partname];
                }
                // the parent is now constructed with empty namespaces and can be used.
                // we return the outermost namespace
                return parent;
            };

            var errorCodes = createNS("ErrorCodes");
            errorCodes.table = {
                0  : 'ok',
                1  : 'agora vom service unavailable',
                2  : 'no channel available',
                4  : 'too many users',
                5  : 'invalid vendor key',
                6  : 'agora master vocs unavailable',
                7  : 'invalid channel name',
                8  : 'agora internal error',
                9  : 'no authorized',
                10 : 'dynamic key timeout',
                11 : 'no active status',
                12 : 'timeout',
                13 : 'canceled'
            };

            function prefixHttp(url) {
                if (!/^(f|ht)tps?:\/\//i.test(url)) {
                    url = "http://" + url;
                }
                return url;
            }

            function leave(url) {
                if (!url) {
                    return;
                }
                window.location.href = prefixHttp(url);
            }

            function createWhiteboardContainer(params) {
                var key       = params.key,
                    cname     = params.cname,
                    uinfo     = params.uinfo,
                    host      = params.host || "0",
                    mode      = params.mode,
                    width     = params.width,
                    height    = params.height,
                    container = params.container,
                    source    = "http://wb.agorabeckon.com:8081/client/html/agora-wb.html",
                    iframe    = $("<iframe></iframe>");

                source += "?key=" + key;
                source += "&cname=" + cname;
                source += "&host=" + host;

                if (uinfo) {
                    source += "&uinfo=" + uinfo;
                }

                if (mode) {
                    source += "&mode=" + mode;
                }

                if (width) {
                    source += "&width=" + width;
                }

                if (height) {
                    source += "&height=" + height;
                }

                iframe.attr("src", source);
                iframe.css({
                    width  : width,
                    height : height
                });
                $("#" + container).append(iframe);
            }

            /**
             * key:         Agora vendor key
             * cname:       Room name
             * uinfo:       User info
             * host:        Host: 1, Guest: 0
             * mode:        Play mode: 0
             * width:       Container width
             * height:      Container height
             * iframeTagId: iframe tag id
             */
            function join(params) {
                if (!params.key || !params.cname) {
                    console.log("Missing required paramsters, please check if key, cname or uinfo is null or undefined.");
                    return;
                }
                createWhiteboardContainer(params);
            }

            function init(params, cb) {
                // get access token
                // FIXME
            }

            var wb = createNS("Whiteboard");
            wb.init = init;
            wb.join = join;
            wb.leave = leave;
        });
    }(jQuery));
}(window));
