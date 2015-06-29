
var ROWIPlugin = function(config) {
    var defaults = {

    };

    this.config = $.extend({}, defaults, config || {});

  this.namespace = this.config.namespace;
  this.folder = this.config.folder;
};

ROWIPlugin.prototype.ros_reload = function(ros) {

};

ROWIPlugin.prototype.init = function() {

};
