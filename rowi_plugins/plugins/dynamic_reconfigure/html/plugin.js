//# sourceURL=plugins/dynamic_reconfigure/plugin.js

function DynamicReconfigurePlugin(config) {
  ROWIPlugin.call(this, config);
  this.dynamic_reconfigure_gui = null;
  this.tab = null;
}

DynamicReconfigurePlugin.prototype = Object.create(ROWIPlugin.prototype);
DynamicReconfigurePlugin.prototype.constructor = DynamicReconfigurePlugin;

DynamicReconfigurePlugin.prototype.init = function() {
  var res = ROWI.add_tab("Reconfigure", this.activate.bind(this), this.deactivate.bind(this));
  this.tab = res[1];
};

DynamicReconfigurePlugin.prototype.deactivate = function() {
  if(this.dynamic_reconfigure_gui) {
    this.dynamic_reconfigure_gui.close();
    this.dynamic_reconfigure_gui = null;
  }
}

DynamicReconfigurePlugin.prototype.activate = function() {
  ROWI.wait_for_ros((function() {
    this.dynamic_reconfigure_gui = new DynamicReconfigureGUI(this.tab,{ros:ROWI.ros});
  }).bind(this));
}

ROWI.register_plugin('dynamic_reconfigure', DynamicReconfigurePlugin);
