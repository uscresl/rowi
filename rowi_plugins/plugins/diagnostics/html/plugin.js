//# sourceURL=plugins/diagnostics/plugin.js

// Battery info
//

function diagnostics(config) {
    var self = this;

    this.config = config;
    this.namespace = config.namespace;
    this.panel = null;
    this.color_panel = null;
    this.level = 4;
    this.last_update = null;

    this.diag_callback = function(msg) {

      var worst_level = DiagnosticStatus.OK;
      var any_stale = false;

      msg.status.each(function(stat) {

          if(stat.level<DiagnosticStatus.STALE && stat.level > worst_level) {
             worst_level = stat.level;
          }
          if(stat.level==DiagnosticStatus.STALE) {
              any_stale = true;
          }
      });



      if(worst_level==DiagnosticStatus.OK && any_stale) {
          this.level = DiagnosticStatus.STALE;
      } else {
          this.level = worst_level;
      }

      this.update_tick();

    }

    this.update_tick = function() {
        this.last_update = (new Date()).getTime()/1000.0;
    };

    this.update_level = function() {

      level = this.level;

      if(this.last_update) {
          var secs = parseInt((new Date()).getTime()/1000.0-this.last_update);
          if(secs > 1) {
              level = DiagnosticStatus.DISCONNECT;
          }
      }


      var level_to_class = {};
        level_to_class[DiagnosticStatus.OK] = "diag-bar-ok";
        level_to_class[DiagnosticStatus.WARN] = "diag-bar-warning";
        level_to_class[DiagnosticStatus.ERROR] = "diag-bar-error";
        level_to_class[DiagnosticStatus.STALE] = "diag-bar-stale";
        level_to_class[DiagnosticStatus.DISCONNECT] = "diag-bar-disconnect";

      this.color_panel.attr('class',level_to_class[level]);

      this.color_panel.html(DiagnosticStatus[level]);
    };

    this.init = function() {
        this.panel = ROWI.add_panel(this, 'Diagnostics', "/"+this.namespace+"/diagnostics");
        this.color_panel = $('<div>').appendTo(this.panel);
        this.color_panel.html('&nbsp;');


        this.diag_listener = new ROSLIB.Topic({
                ros: ROWI.ros,
                name: '/diagnostics_agg',
                messageType: 'diagnostic_msgs/DiagnosticArray',
                throttle_rate: ROWI.THROTTLE_RATE
        });
        this.diag_listener.subscribe((this.diag_callback).bind(this));

        setInterval(this.update_level.bind(this), 1000);
    };
}

ROWI.register_plugin('diagnostics', diagnostics);
