//# sourceURL=plugins/plot/plugin.js

function PlotPlugin(config) {
    var defaults = {

    };

    config = $.extend({}, defaults, config || {});
    
  ROWIPlugin.call(this, config);
  this.plot_gui = null;
  this.tab = null;
}

PlotPlugin.prototype = Object.create(ROWIPlugin.prototype);
PlotPlugin.prototype.constructor = PlotPlugin;

PlotPlugin.prototype.init = function() {
  var res = ROWI.add_tab("Plot", this.activate.bind(this), this.deactivate.bind(this));
  this.tab = res[1];
};

PlotPlugin.prototype.activate = function() {
  ROWI.wait_for_ros(function() {
    this.plot_gui = new ROSPlotGUI(this.tab, {ros:ROWI.ros});
  }.bind(this));
}

PlotPlugin.prototype.deactivate = function() {
  if(this.plot_gui) {
    this.plot_gui.close();
    this.plot_gui = null;
  }
}

ROWI.register_plugin('plot', PlotPlugin);
