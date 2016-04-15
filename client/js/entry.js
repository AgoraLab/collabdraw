(function($) {
    $(function() {
        function getParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");

            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
                results = regex.exec(url);

                if (!results) return null;
                if (!results[2]) return '';
                return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        var width  = getParameterByName('width');
        var height = getParameterByName('height');
        var key    = getParameterByName('key');
        var uinfo  = getParameterByName('uinfo');
        var cname  = getParameterByName('cname');
        var role   = getParameterByName('role');
        var mode   = getParameterByName('mode');

        /* Call AgoraWhiteBoardApi */
        var api = new AgoraWhiteBoardApi();
        api.canvasWidth = width || 1024;
        api.canvasHeight = height || 768;
        api.canvasNode = document.body;
        var params = {
            key   : key,
            cname : cname,
            uinfo : uinfo,
            role  : role|| 'host',
            onJoin: function (ec, em, cname, uinfo) {
                console.log('[onJoin] ec: ' + ec + ' em: ' + em + ' cname: ' + cname + ' uinfo: ' + uinfo);
            }
        };
        api.join(params);
    });
}(jQuery));
