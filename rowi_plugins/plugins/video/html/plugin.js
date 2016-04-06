//# sourceURL=plugins/video/plugin.js

function VideoThumbnailPlugin(config) {

    var defaults = {
        web_video_server_url: 'http://'+ROWI.ros_master+':9089/',
        topic: 'camera/image_raw'
    };

    config = $.extend({}, defaults, config || {});

    this.templates = ["panel.html",];

    ROWIPlugin.call(this, config);

}

VideoThumbnailPlugin.prototype = Object.create(ROWIPlugin.prototype);
VideoThumbnailPlugin.prototype.constructor = VideoThumbnailPlugin;

VideoThumbnailPlugin.prototype.init = function() {
    this.panel = ROWI.add_panel(this, 'Video', "/"+this.namespace+"/video");

    this.container = $('#video_container');
    this.topic = this.config.topic;

    $('#video_panel').appendTo(this.panel);

    $('#video_toggle_button').click(this.toggle_video.bind(this));
    $('#video_popup_button').click(this.popup_video.bind(this));
    this.topic_select = $('#video_topic_select');
    $('#video_topic_select').change(this.topic_select_callback.bind(this));

    ROWI.ros.getTopicsForType('sensor_msgs/Image', this.topics_callback.bind(this));

    this.update_snapshot();
    this.timer = setInterval(this.update_snapshot.bind(this),2000);
};

VideoThumbnailPlugin.prototype.topics_callback = function(data) {
  $.each(data, (function(key, val) {
	$('<option>', { value: val }).appendTo(this.topic_select).text(val);
  }).bind(this));
};

VideoThumbnailPlugin.prototype.topic_select_callback = function(data) {
	this.topic = this.topic_select.val();
        this.update_video();
};


VideoThumbnailPlugin.prototype.popup_video = function() {
    if(this.playing) {
	this.toggle_video();
    }

    window.open(this.config.web_video_server_url+'stream_viewer?topic='+this.topic, "Video", "width=640,height=500");
};

VideoThumbnailPlugin.prototype.toggle_video = function() {
  if(this.playing) {
    this.img = null;
    this.container.attr('src','');
    this.playing = false;
  } else {
    this.playing = true;
    this.update_video();
  }
  this.update_button();
}

VideoThumbnailPlugin.prototype.update_video = function() {
    if(!this.playing) {
	return;
    }
    this.container.attr('src',this.config.web_video_server_url+'stream?topic='+this.topic);
}

VideoThumbnailPlugin.prototype.update_snapshot = function() {
  if(!$(this.panel).is(":visible")) {
    if(this.playing) {
	this.toggle_video();
    }
    return;
  }

  if(!this.playing) {
    this.container.attr('src',this.config.web_video_server_url+'snapshot?topic='+this.topic);
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
