//# sourceURL=plugins/video/plugin.js

function VideoThumbnailPlugin(config) {
    ROWIPlugin.call(this, config);

    var defaults = {
        web_video_server_url: 'http://'+ROWI.ros_master+':9089/',
        topic: 'camera/image_raw'
    };

    this.config = $.extend({}, defaults, config || {});

}

VideoThumbnailPlugin.prototype = Object.create(ROWIPlugin.prototype);
VideoThumbnailPlugin.prototype.constructor = VideoThumbnailPlugin;

VideoThumbnailPlugin.prototype.init = function() {
    this.panel = ROWI.add_panel(this, 'Video', "/"+this.namespace+"/video");

    this.container = $('#video_container');

    $('#video_panel').appendTo(this.panel);

    $('#video_toggle_button').click(this.toggle_video.bind(this));
    this.update_snapshot();
    this.timer = setInterval(this.update_snapshot.bind(this),2000);
};

VideoThumbnailPlugin.prototype.toggle_video = function() {
  if(this.playing) {
    this.img = null;
    this.container.attr('src','');
    this.playing = false;
  } else {
    this.container.attr('src',this.config.web_video_server_url+'stream?topic='+this.config.topic);
    this.playing = true;
  }
  this.update_button();
}

VideoThumbnailPlugin.prototype.update_snapshot = function() {
  if(!$(this.panel).is(":visible")) {
    return;
  }
  if(!this.playing) {
    this.container.attr('src',this.config.web_video_server_url+'snapshot?topic='+this.config.topic);
  }
}
//

VideoThumbnailPlugin.prototype.update_button = function() {
    var text = 'Enable';
    if(this.playing) {
        text = 'Disable';
    }
    $('#video_toggle_button').html(text);
}

ROWI.register_plugin('video', VideoThumbnailPlugin);
