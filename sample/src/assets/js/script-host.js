(function($) {
    $(function() {
        var key              = "74a0b7bb5d3e47c7abca0533d17b0afa",
            resolution       = Cookies.get("resolution") || "480p",
            maxFrameRate     = Number(Cookies.get("maxFrameRate") || 15),
            maxBitRate       = Number(Cookies.get("maxBitRate") || 750),
            channel          = Cookies.get("roomName"),
            client           = AgoraRTC.Client({}),
            remoteStreamList = [],
            localStream;
        var hostParams = {
            key        : 'f4637604af81440596a54254d53ade20',
            cname      : channel,
            role       : 'host',
            width      : 1024,
            height     : 768,
            container  : "wbHost"
        };
        /* Call AgoraWhiteBoardApi */
        Agora.Whiteboard.join(hostParams);

        /* Joining channel */
        (function initAgoraRTC() {
            client.init(key, function () {
                console.log("AgoraRTC client initialized");
                client.join(channel, undefined, function(uid) {
                    console.log("User " + uid + " join channel successfully");
                    console.log("Timestamp: " + Date.now());
                    localStream = initLocalStream(uid);
                });
            });
        }());

        subscribeStreamEvents();

        // Utility function begin
        function subscribeStreamEvents() {
            client.on('stream-added', function (evt) {
                //var stream = evt.stream;
                //console.log("New stream added: " + stream.getId());
                //console.log("Timestamp: " + Date.now());
                //client.subscribe(stream, function (err) {
                    //console.log("Subscribe stream failed", err);
                //});
            });

            client.on('peer-leave', function(evt) {
                //console.log("Peer has left: " + evt.uid);
                //console.log("Timestamp: " + Date.now());
                //showStreamOnPeerLeave(evt.uid);
            });

            client.on('stream-subscribed', function (evt) {
                //var stream = evt.stream;
                //console.log("Got stream-subscribed event");
                //console.log("Timestamp: " + Date.now());
                //console.log("Subscribe remote stream successfully: " + stream.getId());
                //showStreamOnPeerAdded(stream);
            });

            client.on("stream-removed", function(evt) {
                //var stream = evt.stream;
                //console.log("Stream removed: " + evt.stream.getId());
                //console.log("Timestamp: " + Date.now());
                //console.log(evt);
                //showStreamOnPeerLeave(evt.stream.getId());
            });
        }

        function initLocalStream(uid, callback) {
            if(localStream) {
                // local stream exist already
                client.unpublish(localStream, function(err) {
                    console.log("Unpublish failed with error: ", err);
                });
                localStream.close();
            }
            localStream = AgoraRTC.createStream({
                streamID: uid,
                audio: true,
                video: true,
                screen: false
            });
            localStream.setVideoResolution(resolution);
            localStream.setVideoFrameRate([maxFrameRate, maxFrameRate]);
            localStream.setVideoBitRate([maxBitRate, maxBitRate]);

            localStream.init(function() {
                console.log("Get UserMedia successfully");
                displayStream('agora-local', localStream, 160, 120, 'host-local-stream');

                client.publish(localStream, function (err) {
                    console.log("Timestamp: " + Date.now());
                    console.log("Publish local stream error: " + err);
                });
                client.on('stream-published');
            }, function(err) {
                console.log("Local stream init failed.", err);
                //displayInfo("Please check camera or audio devices on your computer, then try again.");
                //$(".info").append("<div class='back'><a href='index.html'>Back</a></div>");
            });
            return localStream;
        }

        function removeElementIfExist(tagId, uid) {
            $("#" + tagId + uid).remove();
        }

        function displayStream(tagId, stream, width, height, className) {
            // cleanup, if network connection interrupted, user cannot receive any events.
            // after reconnecting, the same node id is reused,
            // so remove html node with same id if exist.
            removeElementIfExist(tagId, stream.getId());

            var $container = $("#videoContainer");

            $container.append('<div id="' + tagId + stream.getId() + '" class="' + className + '" data-stream-id="' + stream.getId() + '"></div>');

            $("#" + tagId + stream.getId()).css({
                width: String(width) + "px",
                height: String(height)+ "px"
            });
            stream.play(tagId + stream.getId(), "images");
        }
        // Utility functions end
    });
}(jQuery));
