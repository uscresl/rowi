//# sourceURL=plugins/move_base/plugin.js


// Show goal
// Button to publish goal
// Enable/disable move_base visuals (this should be an option for any plugin actually)
//

function MoveBasePlugin(config) {

    var defaults = {
        move_base_topic: '/knarr/control/move_base',
        ros_ns_prefix: '',
    };

    config = $.extend({}, defaults, config || {});


  ROWIPlugin.call(this, config);

  this.position = null;
  this.panel = null;
  this.marker = null;

}

MoveBasePlugin.prototype = Object.create(ROWIPlugin.prototype);
MoveBasePlugin.prototype.constructor = MoveBasePlugin;

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

  ROWI.add_toolbar(this, this.gotoCommander.toolbarAction);

  this.panel = ROWI.add_panel(this, 'move_base', "/"+this.namespace+"/move_base");

  this.toggle_button = $('<span>').addClass('btn btn-default').appendTo(this.panel).click(this.toggle.bind(this));
  this.toggle_button.append($('<i>').addClass('fa fa-check fa-lg'));


};

MoveBasePlugin.prototype.ros_reload = function(newros) {
    this.goal_topic = new ROSLIB.Topic({
        ros: ROWI.ros,
        name: this.config.move_base_topic + '_simple/goal',
        messageType: 'geometry_msgs/PoseStamped'
    });
    // this.current_goal_topic = new ROSLIB.Topic({
    //     ros: ROWI.ros,
    //     name: this.config.move_base_topic + '/current_goal',
    //     messageType: 'geometry_msgs/PoseStamped'
    // });
};

MoveBasePlugin.prototype.toggle = function() {

};


ROWI.register_plugin('move_base', MoveBasePlugin);
