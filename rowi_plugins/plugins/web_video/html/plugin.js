//# sourceURL=plugins/web_video/plugin.js

function WebVideoPlugin(config) {
  ROWIPlugin.call(this, config);
  this.tab = null;
}

WebVideoPlugin.prototype = Object.create(ROWIPlugin.prototype);
WebVideoPlugin.prototype.constructor = WebVideoPlugin;

WebVideoPlugin.prototype.init = function() {
  var res = ROWI.add_tab("Video", this.activate.bind(this), this.deactivate.bind(this));
  this.tab = res[1];
};

WebVideoPlugin.prototype.activate = function() {
  $('<iframe src="http://'+ROWI.ros_master+':9089/" style="width:100%; height:100%;">').appendTo(this.tab);
}

WebVideoPlugin.prototype.deactivate = function() {
  this.tab.empty();
}

ROWI.register_plugin('web_video', WebVideoPlugin);
