var DiagnosticStatus = {
  OK: 0,
  WARN: 1,
  ERROR: 2,
  STALE: 3,
  DISCONNECT: 4,
  0: 'OK',
  1: 'WARN',
  2: 'ERROR',
  3: 'STALE',
  4: 'DISCONNECTED'
}

var DiagnosticStatusColor = {};
DiagnosticStatusColor[DiagnosticStatus.OK] = "green";
DiagnosticStatusColor[DiagnosticStatus.WARN] = "yellow";
DiagnosticStatusColor[DiagnosticStatus.ERROR] = "red";
DiagnosticStatusColor[DiagnosticStatus.STALE] = "blue";
DiagnosticStatusColor[DiagnosticStatus.DISCONNECT] = "purple";

var DiagnosticStatusIcon = {};
DiagnosticStatusIcon[DiagnosticStatus.OK] = "check-circle";
DiagnosticStatusIcon[DiagnosticStatus.WARN] = "exclamation-circle";
DiagnosticStatusIcon[DiagnosticStatus.ERROR] = "minus-circle";
DiagnosticStatusIcon[DiagnosticStatus.STALE] = "question-circle";
DiagnosticStatusIcon[DiagnosticStatus.DISCONNECT] = "question-circle";

var DiagnosticStatusIconColor = {};
DiagnosticStatusIconColor[DiagnosticStatus.OK] = "fa-"+DiagnosticStatusIcon[DiagnosticStatus.OK]+" "+DiagnosticStatusColor[DiagnosticStatus.OK]+"-text";
DiagnosticStatusIconColor[DiagnosticStatus.WARN] = "fa-"+DiagnosticStatusIcon[DiagnosticStatus.OK]+" "+DiagnosticStatusColor[DiagnosticStatus.WARN]+"-text";
DiagnosticStatusIconColor[DiagnosticStatus.ERROR] = "fa-"+DiagnosticStatusIcon[DiagnosticStatus.OK]+" "+DiagnosticStatusColor[DiagnosticStatus.ERROR]+"-text";
DiagnosticStatusIconColor[DiagnosticStatus.STALE] = "fa-"+DiagnosticStatusIcon[DiagnosticStatus.OK]+" "+DiagnosticStatusColor[DiagnosticStatus.STALE]+"-text";
DiagnosticStatusIconColor[DiagnosticStatus.DISCONNECT] = "fa-"+DiagnosticStatusIcon[DiagnosticStatus.OK]+" "+DiagnosticStatusColor[DiagnosticStatus.DISCONNECT]+"-text";

var DiagnosticStatusClass = {};
DiagnosticStatusClass[DiagnosticStatus.OK] = "diag-bar-ok";
DiagnosticStatusClass[DiagnosticStatus.WARN] = "diag-bar-warning";
DiagnosticStatusClass[DiagnosticStatus.ERROR] = "diag-bar-error";
DiagnosticStatusClass[DiagnosticStatus.STALE] = "diag-bar-stale";
DiagnosticStatusClass[DiagnosticStatus.DISCONNECT] = "diag-bar-disconnect";


function DiagnosticGUI(el, options) {
  var that = this;
  this.el = $('<div>').appendTo(el);
  this.top_bar = $('<div class="diag-bar"></div>').appendTo(this.el);
  this.top_bar_text = $('<div class="diag-bar-text"></div>').appendTo(this.el);
  this.el1 = $('<div class="col-md-6"></div>').appendTo(this.el);
  this.el2 = $('<div class="col-md-6"></div>').appendTo(this.el);
  this.ros = options.ros;

  this.el1.append('<p>Errors</p>');
  //this.errors = $('<ul>').appendTo(this.el);
  this.errors = $('<div>').appendTo(this.el1);
  this.el1.append('<p>Warnings</p>');
  //this.warnings = $('<ul>').appendTo(this.el);
  this.warnings = $('<div>').appendTo(this.el1);
  this.el1.append('<p>All devices</p>');
  this.tree = $('<div>').appendTo(this.el1);

  this.error_items = Object.extended({});
  this.warning_items = Object.extended({});
  this.tree_items = Object.extended({});
  this.diag_items = Object.extended({});

  this.level=DiagnosticStatus.DISCONNECT;

  this.tree.jstree({
      'core': {
          'check_callback': true,
      }
  });
  this.warnings.jstree({
      'core': {
          'check_callback': true,
      }
  });
  this.errors.jstree({
      'core': {
          'check_callback': true,
      }
  });

  this.errors.on('select_node.jstree', function(e, data) {
      that.select(data.node.id);
      that.tree.jstree('deselect_all');
      that.warnings.jstree('deselect_all');
  });
  this.tree.on('select_node.jstree', function(e, data) {
      that.select(data.node.id);
      that.errors.jstree('deselect_all');
      that.warnings.jstree('deselect_all');
  });
  this.warnings.on('select_node.jstree', function(e, data) {
      that.select(data.node.id);
      that.tree.jstree('deselect_all');
      that.errors.jstree('deselect_all');
  });

  this.diag_listener = new ROSLIB.Topic({
          ros: this.ros,
          name: '/diagnostics_agg',
          messageType: 'diagnostic_msgs/DiagnosticArray',
          throttle_rate: ROWI.THROTTLE_RATE
  });
  this.diag_listener.subscribe((this.diag_callback).bind(this));
  this.selected_id = null;
  this.last_update = null;

  this.timer = setInterval(this.update_top_bar.bind(this), 1000);
  //this.error_container.jstree();
}

DiagnosticGUI.prototype.update_tick = function() {
    this.last_update = (new Date()).getTime()/1000.0;
};

DiagnosticGUI.prototype.update_top_bar = function() {

    /*
    for(k in DiagnosticStatusClass) {
        if(k==this.level) {
            this.top_bar.addClass(DiagnosticStatusClass[k]);
        } else {
            this.top_bar.removeClass(DiagnosticStatusClass[k]);
        }
    }
    */
    if(this.top_bar.children().length >= 30)
    {
        this.top_bar.children()[0].remove();
    }
    var level = this.level;

    if(this.last_update) {
        var secs = parseInt((new Date()).getTime()/1000.0-this.last_update);
        this.top_bar_text.html("Last message received "+secs+"s ago.");
        if(secs > 1) {
            level = DiagnosticStatus.DISCONNECT;
        }
    } else {
        this.top_bar_text.html("Waiting for messages.");
    }

    var el = $("<div>&nbsp;</div>").appendTo(this.top_bar);
    if(level == DiagnosticStatus.DISCONNECT) {
      el.html("?");
    }
    el.addClass(DiagnosticStatusClass[level]);
    el.addClass("diag-bar-block");

}

DiagnosticGUI.prototype.close = function() {
  clearInterval(this.timer);
  this.diag_listener.unsubscribe();
  this.el.empty();

}

DiagnosticGUI.prototype.update_selected = function() {
    if(!this.selected_id) {
        this.el2.empty();
        return;
    }
    var id = this.selected_id;
    function f(title, val) {
        if(val) {
            return "<p><b>"+title+":</b> "+val+"</p>";
        }
        return "";
    }
    var status = this.diag_items[id];
    var txt = "";
    txt += f("Full Name", status.name);
    txt += f("Component", status.hardware_id);
    txt += f("Level", ""+status.level);
    txt += f("Message", status.message);
    txt += "<br/>";
    status.values.each(function(i) {
        txt += f(i.key, i.value);
    })
    this.el2.html(txt);
}

DiagnosticGUI.prototype.select = function(id) {
    this.selected_id = id;
    this.update_selected();
}

DiagnosticGUI.prototype.diag_callback = function(msg) {
  var that = this;
  var current_ids = {};
  var current_error_ids = {};
  var current_warn_ids = {};


  var worst_level = DiagnosticStatus.OK;
  var any_stale = false;

  msg.status.each(function(stat) {

      if(stat.level<DiagnosticStatus.STALE && stat.level > worst_level) {
         worst_level = stat.level;
      }
      if(stat.level==DiagnosticStatus.STALE) {
          any_stale = true;
      }

      var id = stat.name; //.split(':')[0];
      var id_html = id.replace(/\//g,"_");
      var parents = stat.name.split(':')[0].split('/');
      var parent = parents.slice(0,parents.length-1).join("/");
      if(parent == "") {
          parent = null;
      }
      //console.log(id,parents,parent);

    if(stat.level==DiagnosticStatus.ERROR || stat.level==DiagnosticStatus.WARN) {


      if(stat.level==DiagnosticStatus.WARN) {
        var el = that.errors;
        var d = that.error_items;
        current_error_ids[id] = true;
      } else {
        var el = that.warnings;
        var d = that.warning_items;
        current_warn_ids[id] = true;
      }

      if(d[id]==null) {
        //var res = $("<li>"+stat.name+": "+stat.message+"</li>").appendTo(el);
        var res = el.jstree("create_node",null,{
            id: id,
            text: stat.name,
            icon: 'fa fa-fw '+DiagnosticStatusIconColor[stat.level],
        });
        d[id] = res;

      }

    }

    var node = that.tree.jstree("get_node", id);
    if(!node) {
        var res = that.tree.jstree("create_node",parent,{
            id: id,
            text: stat.name,
            icon: 'fa fa-fw '+DiagnosticStatusIconColor[stat.level],
        });
        that.tree_items[id] = res;
    } else {
        var old_stat = that.diag_items[id];
        if(old_stat) {
            if(old_stat.level != stat.level) {
                that.tree.jstree("set_icon", id, 'fa fa-fw '+DiagnosticStatusIconColor[stat.level]);
            }
        }
    }

    current_ids[id] = true;
    that.diag_items[id] = stat;


  });

  if(worst_level==DiagnosticStatus.OK && any_stale) {
      this.level = DiagnosticStatus.STALE;
  } else {
      this.level = worst_level;
  }

  this.error_items.keys().each(function(k) {
     if(!current_error_ids[k]) {
         //that.error_items[k].remove();
         that.errors.jstree("delete_node", k);
         delete that.error_items[k];
     }
  });

  this.warning_items.keys().each(function(k) {
     if(!current_warn_ids[k]) {
         //that.warning_items[k].remove();
         that.warnings.jstree("delete_node", k);
         delete that.warning_items[k];
     }
  });

  this.tree_items.keys().each(function(k) {
     if(!current_ids[k]) {
         that.tree.jstree("delete_node", k);
         delete that.tree_items[k];
     }
  });

  this.update_tick();

  this.update_selected();
  //this.update_top_bar();

  //this.error_container.jstree("refresh");

}
