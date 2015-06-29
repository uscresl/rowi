//# sourceURL=plugins/video/plugin.js

// Battery info
//

function video(config) {
    var self = this;

    this.config = config;
    this.namespace = config.namespace;
    this.panel = null;
    this.img = null;
    this.templates = ["panel.html",]
    this.playing = false;
    this.container = null;

    this.toggle_video = function() {
      if(this.playing) {
        this.img = null;
        this.container.attr('src','');
        this.playing = false;
      } else {
        this.container.attr('src','http://'+ROWI.ros_master+':9089/stream?topic=/knarr/mono/preview/image_rect_color');
        this.playing = true;
      }
      this.update_button();
    }

    this.update_snapshot = function() {
      if(!$(this.panel).is(":visible")) {
        return;
      }
      if(!this.playing) {
        this.container.attr('src','http://'+ROWI.ros_master+':9089/snapshot?topic=/knarr/mono/preview/image_rect_color')
      }
    }
    //

    this.update_button = function() {
        var text = 'Enable';
        if(self.playing) {
            text = 'Disable';
        }
        $('#video_toggle_button').html(text);
    }

    this.init = function() {

        this.panel = ROWI.add_panel(this, 'Video', "/"+this.namespace+"/video");

        this.container = $('#video_container');

        $('#video_panel').appendTo(this.panel);

        $('#video_toggle_button').click(this.toggle_video.bind(this));
        this.update_snapshot();
        this.timer = setInterval(this.update_snapshot.bind(this),2000);

    };
}

ROWI.register_plugin('video', video);


//
