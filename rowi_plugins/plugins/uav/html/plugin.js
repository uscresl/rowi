//# sourceURL=plugins/uav/plugin.js

// First make sure robot_base plugin is loaded since this one extends it.
ROWI.load_plugin('robot_base');

function UAV(config) {

    var defaults = {
        icon: {
            url: 'plugins/uav/img/quad.png',
            size: [25,25],
            anchor: [12,12],
            popup_anchor: [0, -5],
        }
    };

    config = $.extend({}, defaults, config || {});

    RobotBase.call(this, config);

}

// Boilerplate
UAV.prototype = Object.create(RobotBase.prototype);
UAV.prototype.constructor = UAV;

UAV.prototype.init = function() {
  // Call parent init function
  RobotBase.prototype.init.call(this);
  // More init code here if needed

};

// Implement our own ros reload method.
UAV.prototype.ros_reload = function(ros) {

  this.navsatfix_listener = new ROSLIB.Topic({
      ros: ROWI.ros,
      name        : this.config.navsatfix_topic,
      messageType : 'sensor_msgs/NavSatFix',
      throttle_rate : ROWI.THROTTLE_RATE
  });

  this.navsatfix_listener.subscribe(this.navsatfix_callback.bind(this));

  this.imu_listener = new ROSLIB.Topic({
      ros: ROWI.ros,
      name        : this.config.imu_topic,
      messageType : 'sensor_msgs/Imu',
      throttle_rate : ROWI.THROTTLE_RATE
  });

  this.imu_listener.subscribe(this.imu_callback.bind(this));

};

// Callbacks

UAV.prototype.navsatfix_callback = function(msg) {
  this.updateLatLon(msg.latitude, msg.longitude);
};

UAV.prototype.imu_callback = function(msg) {
  var euler = ROWI.quat_to_euler(msg.orientation);
  this.updateHeading(euler.z);
}

ROWI.register_plugin('uav', UAV);
