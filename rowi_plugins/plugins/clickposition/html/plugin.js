//# sourceURL=plugins/clickposition/plugin.js

function ClickPositionPlugin(config) {

    var defaults = {

    };
    this.config = $.extend({}, defaults, config || {});

    this.panel = null;

}

ClickPositionPlugin.prototype.init = function() {
    this.panel = ROWI.add_panel(this, "Click position", "/clickposition");
    //ROWI.map.contextmenu.addItem({text: 'Coordinates', callback: function(e) {
      var utm = ROWI.projections.wgs2utm.forward([e.latlng.lng, e.latlng.lat]);
      var popup = L.popup().setLatLng(e.latlng).setContent("<p>Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng + "</p>"
        + "<p>UTM: " + utm[1] + ", " + utm[0] + "</p>").openOn(ROWI.map);
    } });
    ROWI.map.on('click', function(e) {
         var utm = ROWI.projections.wgs2utm.forward([e.latlng.lng, e.latlng.lat]);
         this.panel.innerHTML = "<p>Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng + "</p>"
           + "<p>UTM: " + utm[1] + ", " + utm[0] + "</p>";
    
    }.bind(this));
};

ROWI.register_plugin('clickposition', ClickPositionPlugin);
