//# sourceURL=plugins/clickposition/plugin.js

function clickposition(config) {

    self = this;
    this.config = config;
    this.panel = null;

    this.init = function() {
        this.panel = ROWI.add_panel(this, "Click position", "/clickposition");
        ROWI.map.on('click', function(e) {
            self.panel.innerHTML = "Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng;
        });

    };
}

ROWI.register_plugin('clickposition', clickposition);
