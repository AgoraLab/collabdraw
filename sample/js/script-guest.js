(function($) {
    $(function() {
        var guestParams = {
            key        : 'f4637604af81440596a54254d53ade20',
            cname      : 'PES-2017',
            role       : 'guest',
            width      : 800,
            height     : 600,
            container  : "wbGuest"
        };
        /* Call AgoraWhiteBoardApi */
        Agora.Whiteboard.join(guestParams);

        // Initialize RTC SDK
        var key          = "74a0b7bb5d3e47c7abca0533d17b0afa",
            channel      = 'PES-2017',
            resolution   = "480p",
            maxFrameRate = 15,
            maxBitRate   = 750,
            client       = AgoraRTC.Client({});

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

        function showStreamOnPeerLeave(stream) {
            //displayStream('agora-local', stream, 160, 120, 'host-stream');
            $("#videoContainer").empty();
        }

        function showStreamOnPeerAdded(stream) {
            displayStream('agora-local', stream, 160, 120, 'host-stream');
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
            stream.play(tagId + stream.getId());
        }
        // Utility functions end
    });
}(jQuery));
