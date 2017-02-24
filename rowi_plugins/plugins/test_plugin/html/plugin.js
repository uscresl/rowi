//# sourceURL=plugins/test_plugin/plugin.js

function testPlugin(config) {
    var defaults = {

    };

    config = $.extend({}, defaults, config || {});
    
  ROWIPlugin.call(this, config);
  this.plot_gui = null;
  this.tab = null;

}

testPlugin.prototype = Object.create(ROWIPlugin.prototype);
testPlugin.prototype.constructor = testPlugin;

console.log("So the test plugin is being called");

testPlugin.prototype.init = function() {
  var res = ROWI.add_tab("oh shit whaddup", this.activate.bind(this), this.deactivate.bind(this));
  this.tab = res[1];
};

testPlugin.prototype.activate = function() {
  ROWI.wait_for_ros(function() {
    this.plot_gui = new ROSPlotGUI(this.tab, {ros:ROWI.ros});
  }.bind(this));
}

testPlugint.prototype.deactivate = function() {
  if(this.plot_gui) {
    this.plot_gui.close();
    this.plot_gui = null;
  }
}

ROWI.register_plugin('test_plugin', testPlugin);