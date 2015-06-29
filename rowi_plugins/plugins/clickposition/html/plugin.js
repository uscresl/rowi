//# sourceURL=plugins/clickposition/plugin.js

function ClickPositionPlugin(config) {

    var defaults = {

    };
    this.config = $.extend({}, defaults, config || {});

    this.panel = null;

}

ClickPositionPlugin.prototype.init = function() {
    this.panel = ROWI.add_panel(this, "Click position", "/clickposition");
    ROWI.map.on('click', function(e) {
        this.panel.innerHTML = "Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng;
    }.bind(this));
};

ROWI.register_plugin('clickposition', ClickPositionPlugin);
