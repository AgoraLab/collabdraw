(function($) {
    $(function() {
        var hostParams = {
            key        : 'f4637604af81440596a54254d53ade20',
            cname      : 'PES-2017',
            host       : 1,
            width      : 800,
            height     : 600,
            container  : "wbHost"
        };
        /* Call AgoraWhiteBoardApi */
        Agora.Whiteboard.join(hostParams);

        var guestParams = {
            key        : 'f4637604af81440596a54254d53ade20',
            cname      : 'PES-2017',
            host       : 0,
            width      : 800,
            height     : 600,
            container  : "wbGuest"
        };
        /* Call AgoraWhiteBoardApi */
        Agora.Whiteboard.join(guestParams);
    });
}(jQuery));
