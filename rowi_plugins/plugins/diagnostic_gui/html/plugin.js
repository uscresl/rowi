//# sourceURL=plugins/diagnostic_gui/plugin.js

function DiagnosticGUIPlugin(config) {
    var defaults = {

    };

    config = $.extend({}, defaults, config || {});

  ROWIPlugin.call(this, config);
  this.diagnostic_gui = null;
  this.tab = null;
}

DiagnosticGUIPlugin.prototype = Object.create(ROWIPlugin.prototype);
DiagnosticGUIPlugin.prototype.constructor = DiagnosticGUIPlugin;

DiagnosticGUIPlugin.prototype.init = function() {
  var res = ROWI.add_tab("Diagnostics", this.activate.bind(this), this.deactivate.bind(this));
  this.tab = res[1];
};

DiagnosticGUIPlugin.prototype.activate = function() {
  ROWI.wait_for_ros(function() {
    this.diagnostic_gui = new DiagnosticGUI(this.tab,{ros:ROWI.ros});
  }.bind(this));
}

DiagnosticGUIPlugin.prototype.deactivate = function() {
  if(this.diagnostic_gui) {
    this.diagnostic_gui.close();
    this.diagnostic_gui = null;
  }
}

ROWI.register_plugin('diagnostic_gui', DiagnosticGUIPlugin);
