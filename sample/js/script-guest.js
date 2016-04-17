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
    });
}(jQuery));
