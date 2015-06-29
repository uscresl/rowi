function ROSPlotGUI(el, options) {
  var that = this;
  this.el = $('<div>').appendTo(el);
  this.el.width(600);
  this.el.height(400);
  this.ros = options.ros;
  this.num_points = 100;

  var initial_data = [];
  for (var i = 0; i < this.num_points; ++i) {
    initial_data.push([i, 0]);
  }

  this.plot = $.plot(this.el, [initial_data], {
    series: {
      shadowSize: 0,
    },
    yaxis: {
      min: -1.0,
      max: 1.0
    },
    xaxis: {
      show: false
    }
  });

  this.data = [];

  // implement rostopic.get_topic_type
  // https://github.com/ros/ros_comm/blob/indigo-devel/tools/rostopic/src/rostopic/__init__.py
  // to parse paths such as: /knarr/imu/data/angular_velocity/z

  this.imu_listener = new ROSLIB.Topic({
      ros: ROWI.ros,
      name        : '/knarr/imu/data',
      messageType : 'sensor_msgs/Imu',
      throttle_rate : 100
  });

  this.imu_listener.subscribe(this.update.bind(this));

}
ROSPlotGUI.prototype.close = function() {
  this.el.empty();
}
ROSPlotGUI.prototype.update = function(msg) {
  if(this.data.length > this.num_points) {
    this.data = this.data.slice(1); // remove first point when data is too long
  }
  //console.log(msg.header.stamp);
  //this.data.push([msg.header.stamp.secs+msg.header.stamp.nsecs*1.0e-9,msg.angular_velocity.z])
  this.data.push(msg.angular_velocity.z)
  //console.log(this.data);

  var res = [];
  for (var i = 0; i < this.data.length; ++i) {
    res.push([i, this.data[i]])
  }

  this.plot.setData([res])
  this.plot.draw();
  // data should be of this format: [[x,y],[x,y],[x,y]] ?
}
