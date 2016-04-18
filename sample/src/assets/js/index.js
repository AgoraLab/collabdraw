(function($) {
    $(function() {
        var maxRateSlider = createSlider();

        $("#videoOptionsModal").on("hide.bs.modal", function() {
            var resolution = $("#resolution").val() || '480p';
            var maxFrameRate = $("#maxFrameRate").val() || 15;
            var maxBitRate = maxRateSlider.slider("getValue") || 750;

            Cookies.set("resolution", resolution);
            Cookies.set("maxFrameRate", maxFrameRate);
            Cookies.set("maxBitRate", maxBitRate);
        });

        $("#join-meeting").click(function(e) {
            e.preventDefault();
            var roomName = $("#room-name").val();
            if (roomName) {
                Cookies.set("roomName", roomName);
                window.location.href="meeting.html";
            } else {
                $("#room-name").addClass("required-field");
            }
        });

        $("#resolution").change(function(e) {
            var resolution = $(e.target).val(),
                bitRateRange;
            if (resolution) {
                bitRateRange = bitRateRangeByResolution(resolution);

                // recreate the slider
                maxRateSlider = createSlider(bitRateRange);
            } else {
                // should not go here!
                this.val("480p");
            }
        });

        // utilitily functions goes here
        function createSlider(rangeArray) {
            var bitRate,
                range,
                slider;

            if (!rangeArray || rangeArray.length !== 2) {
                range = [125, 2000];
                bitRate = 750;
            } else {
                range = rangeArray;
                bitRate = rangeArray[1];
            }

            // by default, we expect 720p bit rate range
            slider = $("#choose-max-rate").slider({
                min: range[0],
                max: range[1]
            })
            .slider('setValue', bitRate);

            return slider;
        }

        function bitRateRangeByResolution(reso) {
            var result;
            switch (reso) {
                case '120p':
                    result = [20, 160];
                    break;
                case '240p':
                    result = [50, 400];
                    break;
                case '360p':
                    result = [100, 1600];
                    break;
                case '480p':
                    result = [125, 2000];
                    break;
                case '720p':
                    result = [250, 4000];
                    break;
                case '1080p':
                    result = [375, 6000];
                    break;
                default:
                    result = [125, 2000];
            }
            return result;
        }
    });
}(jQuery));
