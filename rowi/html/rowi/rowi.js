/**
 * @author Hordur Heidarsson - heidarss@usc.edu
 */

L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';

$.fn.exists = function () {
    return this.length !== 0;
}

var ROWI = {
    self: this,
    ros: null,
    projections: {},
    map: null,
    plugin_inst: [],
    panels: [],
    THROTTLE_RATE: 100,
    toolbar_actions: [],
    callbacks: {},
    ros_init: false,
    ros_master: window.location.hostname,
    ros_port: 9090,
    plugins_loaded: false,
    loaded_plugins: {},
    tabs_info: {},
    tab_count: 0,
    config: {},
    init: function(config) {
      this.config = config;

      this.tabs_el = $( "#tabs" );
        this.init_map();
        this.init_ros();
        this.init_projections();
    },
    init_ros: function() {

        var master = getURLParameter('master');
        if(master) {
            this.ros_master = master;
        }

        var port = getURLParameter('port');
        if(port) {
            this.ros_port = port;
        }

        if(!this.ros) {
            this.ros = new ROSLIB.Ros();
            this.ros.on('connection', this.ros_connected.bind(this));

            this.ros.on('error', function(error) {
              console.log('Error connecting to websocket server: ', error);
            });

            this.ros.on('close', function() {
              console.log('Connection to websocket server closed.');
              setTimeout(ROWI.init_ros.bind(ROWI), 1000);
            });
        }

        this.ros.connect('ws://'+this.ros_master+':'+this.ros_port);

    },
    ros_reload_notify: function() {
      this.plugin_inst.each((function(x) {
          if(x.ros_reload)
          {
              x.ros_reload(this.ros);
          }
      }).bind(this));
    },
    ros_connected: function() {
        console.log('Connected to websocket server');
        this.ros_init = true;

        this.trigger("ros_init");

        if(this.plugins_loaded) {
          this.ros_reload_notify();
        }
        this.ros_initialized = true;
    },

    init_tabs: function() {

      this.tabs = this.tabs_el.tabs({
          //active: 0,
          activate: this.tab_switch.bind(this),
          heightStyle: 'fill'
      });
    },
    add_tile_layer: function(id, name, layer, activate) {

    },
    swich_tile_layer: function(id) {

    },
    init_map: function() {

      var res = this.add_tab("Map",
        // Activation callback
        function() {
          setTimeout(ROWI.map_invalidate.bind(this),100);
        }.bind(this),
        // Deactivation callback
        function() {

        }.bind(this)
      );

      var map_div = res[1];

      map_div.append('<div id="sidebar" class="ui-layout-west pane"><div id="accordion"></div></div><div id="container" class="ui-layout-center pane ui-layout-content"><div id="map"></div></div>');

      var options = {
          applyDefaultStyles: false,
          defaults: {
              fxName: 'none',
          },
          north: {
              closable: false
          },
          west: {
              initClosed: false,
          }
      }

      var mylayout = map_div.layout(options);

        // var cached = L.tileLayer('tiles/{x}x{y}x{z}.jpg',
        //     {
        //         attribution: 'Imagery by Google Maps',
        //         maxNativeZoom: 20,
        //         maxZoom: 27,
        //
        //     });
        //
        var MapQuestOpen_Aerial = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
            type: 'sat',
            ext: 'jpg',
            attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
            subdomains: '1234',
            maxNativeZoom: 18,
            maxZoom: 27,
        });

        this.map = L.map('map', {
            fullscreenControl: true
            });

        if(!this.config.disableDefaultTiles) {
          var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="http://www.osm.org/copyright">OpenStreetMap</a>'
          });
          osm.addTo(this.map);
          var mapquest_aerial = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
              type: 'sat',
              ext: 'jpg',
              attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
              subdomains: '1234',
              maxNativeZoom: 18,
              maxZoom: 27,
          });
          var baseMaps = {
              "OSM (online)": osm,
              "Aerial (online)": mapquest_aerial
          };

          var overlayMaps = {

          };

          L.control.layers(baseMaps, overlayMaps).addTo(this.map);
        }


        var initial_pos = config.initial_position || {latitude: 34.08716,longitude: -117.81032,zoom: 18};
        this.map.setView([initial_pos.latitude, initial_pos.longitude ], initial_pos.zoom);

        // var baseMaps = {
        //     "Cached (offline)": cached,
        //     "OSM (online)": OpenStreetMap_Mapnik,
        //     "Aerial (online)": MapQuestOpen_Aerial
        // };
        //
        // var overlayMaps = {
        //
        // };
        //
        // L.control.layers(baseMaps, overlayMaps).addTo(this.map);

        var measureControl = new L.Control.Measure({ position: 'bottomright' });
        measureControl.addTo(this.map);

        this.map.addControl(new L.Control.Scale());

    },
    init_projections: function() {
        proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
        proj4.defs('UTM11S' , "+title=UTM Zone 11S +proj=utm +zone=11 +ellps=WGS84");
        this.projections.wgs2utm = proj4('WGS84','UTM11S');
    },
    load_plugin_callback: function() {
    },
    load_plugin: function(name) {
      // Only do this once per type.
      if(!this.loaded_plugins[name]) {
        $.getScript('plugins/'+name+'/plugin.js');
        this.loaded_plugins[name] = true;
        return true;
      }
      return false;
    },
    load_plugins: function() {
        $.ajaxSetup({async:false});
        $.each(config.plugins, (function(i, p) {
            this.load_plugin(p.type);
        }).bind(this));
        this.init_plugins();
        $.ajaxSetup({async:true});
        this.plugins_loaded = true;
    },

    load_template: function(url) {
        $('#templates').load(url);
    },
    load_css: function(url) {
        $('<link rel="stylesheet" type="text/css" href="'+url+'" >').appendTo("head");
    },
    init_plugins: function() {

        $.each(this.plugin_inst, (function(i, p) {
            if(p.templates) {
                $.each(p.templates, (function(j, t) {
                    this.load_template('plugins/'+p._plugin_type+'/'+t)
                }).bind(this));
            }
            if(p.css) {
                $.each(p.css, (function(j, t) {
                    this.load_css('plugins/'+p._plugin_type+'/'+t)
                }).bind(this));
            }
            p.init();
            if(this.ros_init && p.ros_reload) {
              p.ros_reload(this.ros);
            }
        }).bind(this));
        (function($) {
            $(function() {
                //$(".accordion > div").accordion({ header: "h3", collapsible: true, sortable: true, heightStyle: "content", animate: false });
                $(".accordion").multiaccordion({defaultIcon: "ui-icon-plusthick", activeIcon: "ui-icon-minusthick", animation: false});
            })
        })(jQuery);
        this.init_toolbar();
    },
    register_plugin: function(name, o) {
        //console.log(name);
        //console.log(obj);
        $.each(config.plugins, (function(i, p) {
            if(p.type == name) {
                p.folder = 'plugins/'+name+'/';
                var obj = new o(p);
                obj._plugin_type = name;
                this.plugin_inst.push(obj);
            }
        }).bind(this));


    },
    add_panel: function(owner, title, namespace, color) {
        if(color==null)
        {
            color = 'green';
        }
        //$('#accordion').append();
        if(namespace[0]=='/') {
            namespace=namespace.substring(1);
        }

        var fields = namespace.split("/");
        var parent_id = "accordion";
        $.each(fields, function(i,p) {
            if(i != fields.length-1) {
                var parent_parent_id = parent_id;
                parent_id = parent_id+'_'+p;
                if(!$('#'+parent_id).exists())
                {
                    var parent_el = '#'+parent_parent_id;
                    if(i>0) {
                        parent_el = $(parent_el+' > div.content')[0];
                    }
                    //console.log(i,parent_id,parent_parent_id,parent_el);

                    var el = $('<div class="accordion" id="'+parent_id+'"><h3><a href="#" class="panel_title">'+p+'</a></h3><div class="content"></div></div>').appendTo(parent_el);
                    //console.log(el);
                }
            }
        });
        var parent_el = '#'+parent_id;
        if(fields.length>=2) {
            parent_el = $(parent_el+' > div.content')[0];
        }
        var id = parent_id+'_'+fields[fields.length-1];
        //console.log('adding',id,parent_id,parent_el)
        var el = $('<div class="accordion " id="'+id+'"><h3><a href="#" class="panel_title">'+title+'</a></h3><div class="content"></div></div>').appendTo(parent_el);
        //console.log(el.find('.content'));
        return el.find('.content')[0];
        //panels.push();
    },
    add_toolbar: function(owner, action) {
        this.toolbar_actions.push(action);
    },
    add_tab: function(name, activate, deactivate) {
      var id = "tab_"+this.tab_count++;

      var tabTemplate = "<li><a href='#{href}'>#{label}</a></li>";
      var li = $( tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, name ) );
      var div = $("<div id='"+id+"'>");

      this.tabs_el.find("ul").append(li);
      this.tabs_el.append(div);

      if(this.tabs == null) {
        this.init_tabs();
      }

      this.tabs.tabs("refresh");

      this.tabs_info[id] = {
        activate: activate,
        deactivate: deactivate,
        div: div,
        li: li
      }

      return [id,div];
    },
    remove_tab: function(id) {

    },
    init_toolbar: function() {
        new L.Toolbar.Control({
            actions: this.toolbar_actions,
            position: 'topleft',
        }).addTo(this.map);
    },
    on: function(event, callback) {
        if(this.callbacks[event]==null) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    },
    trigger: function(event) {
        if(this.callbacks[event]!=null) {
            var e = {
                name: event,
            };
            this.callbacks[event].each((function(callback) {
                callback(e, this);
            }).bind(this));
        }
    },
    wait_for_ros: function(callback) {
      if(this.ros_init) {
        callback();
      } else {
        setTimeout((function() {
          this.wait_for_ros(callback);
        }).bind(this), 200);
      }
    },
    map_invalidate: function(callback) {
      if(this.map) {
        this.map.invalidateSize();
      } else {
        setTimeout(this.map_invalidate.bind(this),100);
      }
    },
    quat_to_euler: function(quat) {
      var euler = new THREE.Euler();
      euler.setFromQuaternion(new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w));
      return euler;
    },
    to_ros_time: function(t) {
      return {secs: parseInt(t/1000), nsecs: (t%1000)*1e6}
    },
    from_ros_time: function(t) {
      return t.secs*1000 + parseInt(t.nsecs*1e-6);
    },
    tab_switch: function(event, ui) {

      var tabno = this.tabs.tabs( "option", "active" );
      if(ui.oldPanel.length > 0) {
        var old_tab = ui.oldPanel[0].id;
        this.tabs_info[old_tab].deactivate();
      }

      var new_tab = ui.newPanel[0].id;
      this.tabs_info[new_tab].activate();


    },
}

ROWI.utils = {
  quat_to_euler: function(quat) {
    var euler = new THREE.Euler();
    euler.setFromQuaternion(new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w));
    return euler;
  },
  to_ros_time: function(t) {
    return {secs: parseInt(t/1000), nsecs: (t%1000)*1e6}
  },
  from_ros_time: function(t) {
    return t.secs*1000 + parseInt(t.nsecs*1e-6);
  },
};


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

$(document).ready(function() {

    var timeout = 1000;
    $.blockUI({
        message: '<h1>Loading...</h1>',
        timeout: timeout
    });
    setTimeout(function() {
        ROWI.init(config);
        ROWI.load_plugins();
    }, timeout);

});
