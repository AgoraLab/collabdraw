(function($) {
    $(function() {
        var hostParams = {
            key        : 'f4637604af81440596a54254d53ade20',
            cname      : 'PES-2017',
            role       : 'host',
            width      : 800,
            height     : 600,
            container  : "wbHost"
        };
        /* Call AgoraWhiteBoardApi */
        Agora.Whiteboard.join(hostParams);
    });
}(jQuery));
