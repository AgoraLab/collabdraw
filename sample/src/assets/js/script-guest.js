(function($) {
    $(function() {
        // Initialize RTC SDK
        var key              = "74a0b7bb5d3e47c7abca0533d17b0afa",
            resolution       = Cookies.get("resolution") || "480p",
            maxFrameRate     = Number(Cookies.get("maxFrameRate") || 15),
            maxBitRate       = Number(Cookies.get("maxBitRate") || 750),
            channel          = Cookies.get("roomName"),
            client           = AgoraRTC.Client({}),
            remoteStreamList = [];
        var guestParams = {
            key        : 'f4637604af81440596a54254d53ade20',
            cname      : channel,
            role       : 'guest',
            width      : 1024,
            height     : 768,
            container  : "wbGuest"
        };
        /* Call AgoraWhiteBoardApi */
        Agora.Whiteboard.join(guestParams);


        /* Joining channel */
        (function initAgoraRTC() {
            client.init(key, function () {
                console.log("AgoraRTC client initialized");
                client.join(channel, undefined, function(uid) {
                    console.log("User " + uid + " join channel successfully");
                    console.log("Timestamp: " + Date.now());
                });
            });
        }());

        subscribeStreamEvents();

        // Utility function begin
        function removeStreamFromList(id) {
            var index, tmp;
            for (index = 0; index < remoteStreamList.length; index += 1) {
                var tmp = remoteStreamList[index];
                if (tmp.id === id) {
                    var toRemove = remoteStreamList.splice(index, 1);
                    if (toRemove.length === 1) {
                        //delete toRemove[1];
                        console.log("stream stopping..." + toRemove[0].stream.getId());
                        toRemove[0].stream.stop();
                    }
                }
            }
        }

        function addToRemoteStreamList(stream) {
            if (stream) {
                remoteStreamList.push({
                    id: stream.getId(),
                    stream: stream
                });
            }
        }


        function subscribeStreamEvents() {
            client.on('stream-added', function (evt) {
                var stream = evt.stream;
                console.log("New stream added: " + stream.getId());
                console.log("Timestamp: " + Date.now());
                client.subscribe(stream, function (err) {
                    console.log("Subscribe stream failed", err);
                });
            });

            client.on('peer-leave', function(evt) {
                console.log("Peer has left: " + evt.uid);
                console.log("Timestamp: " + Date.now());
                showStreamOnPeerLeave(evt.uid);
            });

            client.on('stream-subscribed', function (evt) {
                var stream = evt.stream;
                console.log("Got stream-subscribed event");
                console.log("Timestamp: " + Date.now());
                console.log("Subscribe remote stream successfully: " + stream.getId());
                showStreamOnPeerAdded(stream);
            });

            client.on("stream-removed", function(evt) {
                var stream = evt.stream;
                console.log("Stream removed: " + evt.stream.getId());
                console.log("Timestamp: " + Date.now());
                console.log(evt);
                showStreamOnPeerLeave(evt.stream);
            });
        }

        function showStreamOnPeerLeave(streamId) {
            removeStreamFromList(Number(streamId));
            if (remoteStreamList.size === 0) {
                $("#videoContainer").empty();
            }
        }

        function showStreamOnPeerAdded(stream) {
            addToRemoteStreamList(stream);
            displayStream('agora-local', stream, 160, 120, 'host-stream');
        }

        function removeElementIfExist(tagId, uid) {
            $("#videoContainer").empty();
        }

        function displayStream(tagId, stream, width, height, className) {
            // cleanup, if network connection interrupted, user cannot receive any events.
            // after reconnecting, the same node id is reused,
            // so remove html node with same id if exist.
            removeElementIfExist();

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
