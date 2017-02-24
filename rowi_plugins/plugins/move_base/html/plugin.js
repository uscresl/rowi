//# sourceURL=plugins/move_base/plugin.js


// Show goal
// Button to publish goal
// Enable/disable move_base visuals (this should be an option for any plugin actually)
//

function MoveBasePlugin(config) {

    var defaults = {
        move_base_topic: '/knarr/control/move_base',
        ros_ns_prefix: '',
        local_plan_color: 'green',
        global_plan_color: 'darkgreen',
    };

    config = $.extend({}, defaults, config || {});


  ROWIPlugin.call(this, config);

  this.namespace = 'knarr';
  this.position = null;
  this.panel = null;
  this.marker = null;
  this.current_goal_marker == null

  this.utm_odom_transform = null;


  this.local_plan = null;
  this.global_plan = null;

}

MoveBasePlugin.prototype = Object.create(ROWIPlugin.prototype);
MoveBasePlugin.prototype.constructor = MoveBasePlugin;

MoveBasePlugin.prototype.createPlanLines = function() {
    this.local_plan = L.polyline([], {color: this.config.local_plan_color, weight: 1, opacity: 1}).addTo(ROWI.map);
    this.global_plan = L.polyline([], {color: this.config.global_plan_color, weight: 1, opacity: 1}).addTo(ROWI.map);
};

MoveBasePlugin.prototype.init = function() {
  this.gotoCommander = function(parent){

      var active = false;
      var line = null;
      var tb = null;
      var mousell = null;
      var ival = null;
      var new_heading = 0;
      var velocity = 1.0;

      var click_handler = function(e) {

          var utm = ROWI.projections.wgs2utm.forward([e.latlng.lng,e.latlng.lat]);
          var wp = new ROSLIB.Message({
              header: {
                frame_id: 'utm'
              },
              pose: {
                position: {
                  x: utm[0],
                  y: utm[1],
                  z: 0.0,
                },
                orientation: {
                  x: 0.0,
                  y: 0.0,
                  z: 0.0,
                  w: 1.0,
                }
            }
          });

          parent.goal_topic.publish(wp);
          cancel();
      }

      var init = function() {
          if(active) { return; }

          ROWI.map.on('click', click_handler);
          active = true;
      }

      var cancel = function() {
          if(!active) { return; }
          ROWI.map.off('click', click_handler);

          active = false;
          if(tb) {
              tb.disable();
          }
          return true;
      }

      var parents4 = ROWI.toolbar.addGroup("Move base", "MB", 4, init);
      var CancelAction = L.ToolbarAction.extend({
          options: {
              toolbarIcon: {
                  html: 'cancel',
                  tooltip: 'Cancel'
              }
          },
          addHooks: function() {

              if(cancel()) {
                  this.toolbar.parentToolbar._active.disable();
              }

          }
      });


      var toolbarAction = L.ToolbarAction.extend({
          options: {
              toolbarIcon: {
                  className: 'fa fa-dot-circle-o',
                  html: '',
                  tooltip: 'Move base command'
              },
              subToolbar: new L.Toolbar({ actions: [
                  CancelAction
              ]})
          },
          addHooks: function() {
              tb = this;
              init();
          },
          removeHooks: function() {
              cancel();
          }

      });

      return {toolbarAction:toolbarAction}

  }(this);

  console.log(this.config);
  console.log(this.namespace);

  ROWI.add_toolbar(this, this.gotoCommander.toolbarAction);

  this.panel = ROWI.add_panel(this, 'move_base', "/"+this.namespace+"/move_base");

  this.toggle_button = $('<span>').addClass('btn btn-default').appendTo(this.panel).click(this.toggle.bind(this));
  this.toggle_button.append($('<i>').addClass('fa fa-check fa-lg'));


};

MoveBasePlugin.prototype.ros_reload = function(newros) {

    this.tf_client = new ROSLIB.TFClient({
        ros: ROWI.ros,
        fixedFrame: "utm",
        angularThres : 0.1,
        transThres: 0.1,
    });
    this.tf_client.subscribe("odom", this.tf_callback.bind(this));

    this.goal_topic = new ROSLIB.Topic({
        ros: ROWI.ros,
        name: this.config.move_base_topic + '_simple/goal',
        messageType: 'geometry_msgs/PoseStamped'
    });

    this.local_plan_topic = new ROSLIB.Topic({
        ros: ROWI.ros,
        name: this.config.move_base_topic + '/TrajectoryPlannerROS/local_plan',
        messageType: 'nav_msgs/Path',
        throttle_rate : 1000,
    });
    this.local_plan_topic.subscribe(this.plan_callback.bind(this,0));

    this.global_plan_topic = new ROSLIB.Topic({
        ros: ROWI.ros,
        name: this.config.move_base_topic + '/TrajectoryPlannerROS/global_plan',
        messageType: 'nav_msgs/Path',
        throttle_rate : 1000,
    });
    this.global_plan_topic.subscribe(this.plan_callback.bind(this,1));


    this.current_goal_topic = new ROSLIB.Topic({
        ros: ROWI.ros,
        name: this.config.move_base_topic + '/current_goal',
        messageType: 'geometry_msgs/PoseStamped'
    });
    this.current_goal_topic.subscribe(this.goal_callback.bind(this));
};

MoveBasePlugin.prototype.goal_callback = function(data) {
    if(this.utm_odom_transform == null) {
        return;
    }

    var lonlat = ROWI.projections.wgs2utm.inverse([data.pose.position.x + this.utm_odom_transform.translation.x, data.pose.position.y + this.utm_odom_transform.translation.y]);

    if(this.current_goal_marker == null) {
        var icon = L.AwesomeMarkers.icon({
          icon: 'fa-flag-checkered',
          markerColor: 'green',
          //html: '',
        });

        this.current_goal_marker = new L.marker([lonlat[1], lonlat[0]], {icon: icon}).addTo(ROWI.map);
    } else {
        this.current_goal_marker.setLatLng([lonlat[1], lonlat[0]]);
    }
};

MoveBasePlugin.prototype.plan_callback = function(plan_type, data) {

    if(this.utm_odom_transform == null) {
        return;
    }

    if(this.local_plan == null) {
        this.createPlanLines();
    }

    var latlong = [];
    for(i = 0; i < data.poses.length; i++){
      latlong[i] = new Array();
      var lonlat = ROWI.projections.wgs2utm.inverse([data.poses[i].pose.position.x + this.utm_odom_transform.translation.x, data.poses[i].pose.position.y + this.utm_odom_transform.translation.y]);
      latlong[i][0] = lonlat[1];
      latlong[i][1] = lonlat[0];
    }
    if(plan_type==0) {
        this.local_plan.setLatLngs(latlong);
    } else {
        this.global_plan.setLatLngs(latlong);
    }

};

MoveBasePlugin.prototype.tf_callback = function(data) {
    this.utm_odom_transform = data;
};



MoveBasePlugin.prototype.toggle = function() {

};


ROWI.register_plugin('move_base', MoveBasePlugin);
