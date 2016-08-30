//# sourceURL=plugins/robot_base/plugin.js

// Base class for a robot, has the following functionality:
// display marker w. rotation (sub class needs to subscribe and feed data)
// on-click functionality (shows basic data fed by subclass, can be overwritten and customized)
// history
// centering & tracking

function RobotBase(config) {

    var defaults = {
        color: 'yellow',
        icon: {
            url: 'icons/emoticon_smile.png',
            size: [16,16],
            anchor: [7,7],
            popup_anchor: [0, 0],
        },
        history: true,
        stale_timeout: 3,
        buffer_service: null
    };

    config = $.extend({}, defaults, config || {});


  ROWIPlugin.call(this, config);

  this.position = null;
  this.panel = null;
  this.history = null;
  this.marker = null;
  this.prune_counter = 0;

  this.heading = null;
  this.velocity = null;
  this.angular_velocity = null;
  this.last_latlon_update = new Date(0);
  this.latlon_stale = true;
}

RobotBase.prototype = Object.create(ROWIPlugin.prototype);
RobotBase.prototype.constructor = RobotBase;

RobotBase.prototype.ros_reload = function(newros) {
  this.load_position_buffer();
};

RobotBase.prototype.markup_popup_update = function() {
  if(!this.marker) {
    return;
  }
  var now = new Date();
  var html = '<h4>'+this.namespace+'</h4>';
  if(this.position) {
    html = html+'<b>Position:</b> '+this.position[0].toFixed(7)+','+this.position[1].toFixed(7)+'<br>';
  }
  if(this.heading) {
    html = html+'<b>Heading</b>: '+this.heading.toFixed(1)+'<br>';
  }
  if(this.velocity) {
    html = html+'<b>Velocity</b>: '+this.velocity.toFixed(2)+'<br>';
  }
  if(this.angular_velocity) {
    html = html+'<b>Angular velocity</b>: '+this.angular_velocity.toFixed(2)+'<br>';
  }
  var age = (now-this.last_latlon_update)/1000;
  if(age > 1) {
    age = age | 0;
  } else {
    age = age.toFixed(2);
  }
  html = html+'<b>Pos age.</b>: '+age+' s';
  if(this.latlon_stale) {
    html = html+' (stale)';
  }
  html = html+'<br>'
  this.marker_popup.html(html);
}


RobotBase.prototype.createMarker = function() {
  var icon = L.icon({
      iconUrl: this.config.icon.url,
      iconSize: this.config.icon.size,
      iconAnchor: this.config.icon.anchor,
      popupAnchor: this.config.icon.popup_anchor,
      className: 'gray'
  });
  this.marker = new L.Marker(this.position, {icon: icon, title: this.namespace, iconAngle: 0, zIndexOffset: 1000}).addTo(ROWI.map);

  this.marker_popup = $("<div>");
  this.marker.bindPopup(this.marker_popup[0]);
  this.marker.on("popupopen", (function() { this.update_marker_popup = true; }).bind(this));
  this.marker.on("popupclose", (function() { this.update_marker_popup = false; }).bind(this));
  this.markup_popup_update();
};

RobotBase.prototype.load_position_buffer = function() {

  if(!this.config.buffer_service) {
    return;
  }

  this.clearHistory();
  var current_time = $.now();
  var parsedJSON;
  var latlong = [];

  var bufferServiceClient = new ROSLIB.Service({
    ros: ROWI.ros,
    name: this.config.buffer_service,
    serviceType: 'ros_buffer_service/BufferSrv'
  });

  var request = new ROSLIB.ServiceRequest({
    start_time: toRosTime(current_time-900*1000),
    end_time: toRosTime(current_time)
  });



  bufferServiceClient.callService(request,function(result){
    parsedJSON = $.parseJSON(result["data"]);
    var lat, lon;

    for(i = 0; i < parsedJSON.length; i++){
      latlong[i] = new Array();
      lat = parsedJSON[i].latitude;
      lon = parsedJSON[i].longitude;
      latlong[i][0] = lat;
      latlong[i][1] = lon;

    }
    this.history.setLatLngs(latlong);

    this.updateLatLon(lat,lon, false);
  }.bind(this));
}

RobotBase.prototype.drag_start = function() {
  this.update_tracking(false);
}

RobotBase.prototype.update_tracking = function(tracking) {
  this.tracking = tracking;
  if(!this.tracking) {
    this.track_button.addClass("btn-default");
    this.track_button.removeClass("btn-success");
  } else {
    this.track_button.addClass("btn-success");
    this.track_button.removeClass("btn-default");
  }
  //btn-danger
}
RobotBase.prototype.createHistory = function() {
  this.history = L.polyline([], {color: this.config.color, weight: 1, opacity: 1}).addTo(ROWI.map);
};

RobotBase.prototype.updateLatLon = function(lat, lon, update_time) {
  this.position = [lat, lon];
  if (update_time === undefined) {
    this.last_latlon_update = new Date();
  }

  if(this.marker == null) {
    this.createMarker();
  }
  this.marker.setLatLng(this.position);

  if(this.tracking) {
    ROWI.map.setView(this.position);
  }

  if(this.config.history) {
    if(this.history == null) {
        this.createHistory();
    }

    this.history.addLatLng(this.position);

    if(this.prune_counter++>100) {
        this.pruneHistory();
        this.prune_counter = 0;
    }
  }

  this.updatePanel();
  if(this.update_marker_popup) {
    this.markup_popup_update();
  }
};

RobotBase.prototype.updatePanel = function() {
  this.lat_field.innerHTML = "Lat: "+this.position[0].toFixed(7);
  this.lon_field.innerHTML = "Lon: "+this.position[1].toFixed(7);
}

RobotBase.prototype.updateHeading = function(heading) {
  this.heading = heading*180/Math.PI;
  this.marker.setIconAngle(90-this.heading);
};

RobotBase.prototype.clearHistory = function() {
  if(!this.history) {
      this.createHistory();
      return;
  }
  this.history.setLatLngs([]);
};

RobotBase.prototype.pruneHistory = function() {
  var epsilon = 0.0000001;
  var lls = this.history.getLatLngs();
  var ll = [];
  $.each(lls, function(k,v) {
      ll.push([v.lat,v.lng]);
  })
  var new_history = RDPsd(ll,epsilon);
  this.history.setLatLngs(new_history);
};

RobotBase.prototype.center = function() {
  ROWI.map.panTo(this.position);
}

RobotBase.prototype.timerUpdate = function() {
  var now = new Date();
  if(now-this.last_latlon_update > this.config.stale_timeout*1000) {
    if(this.marker) {
      this.marker._icon.classList.add('gray');
    }
    this.latlon_stale = true;
  } else {
    if(this.latlon_stale) {
      if(this.marker) {
      this.marker._icon.classList.remove('gray');
      }
      this.latlon_stale = false;
    }
  }
  this.markup_popup_update();
}



RobotBase.prototype.init = function() {
  var ClearHistoryAction = L.ToolbarAction.extend({
      options: {
          toolbarIcon: {
              className: 'fa fa-ban',
              html: '',
              tooltip: 'Clear history'
          },
          parent: this

      },
      addHooks: function() {
          console.log(this);
          this.options.parent.clearHistory();

      }
  });
  ROWI.add_toolbar(this, ClearHistoryAction);

  var doesWork = ROWI.toolbar.addGroup("Robot base", "RB", 2, RobotBase.clearHistory);
  console.log(RobotBase);
  this.panel = ROWI.add_panel(this, 'Position', "/"+this.namespace+"/position");
  this.lat_field = $('<div></div>').appendTo(this.panel)[0];
  this.lon_field = $('<div></div>').appendTo(this.panel)[0];

  this.center_button = $('<span>').addClass('btn btn-default').appendTo(this.panel).click(this.center.bind(this));
  this.center_button.append($('<i>').addClass('fa fa-crosshairs fa-lg'));

  this.track_button = $('<span>').addClass('btn').appendTo(this.panel).click((function() { this.update_tracking(!this.tracking); }).bind(this));
  this.track_button.append($('<i>').addClass('fa fa-thumb-tack fa-lg'));
  this.update_tracking(false);

  ROWI.map.on("dragstart", this.drag_start.bind(this));
  ROWI.map.on("autopanstart", this.drag_start.bind(this));

  this.timer = setInterval(this.timerUpdate.bind(this), 1000);

};

ROWI.register_plugin('robot_base', RobotBase);