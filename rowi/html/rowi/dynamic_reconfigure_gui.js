/*
Uses:
- Jquery
- ROSLIBJS
- DynamicReconfigure
- SugarJS
- jquerymy
*/

function DynamicReconfigureGUI(el, options) {

    this.el = el;
    this.ros = options.ros;

    this.menu = $('<div>').appendTo(this.el);
    this.main = $('<form>').appendTo($('<div>').appendTo(this.el));

    // var change_callback = (this.change_callback).bind(this);
    // this.main.on("change",change_callback );

    this.config = null;
    this.config_elements = {};
    this.pane_ready = false;
    this.groups = [];

    this.client = null;

    this.param_descriptions = null;


    var nodes_callback = (this.nodes_callback).bind(this);
    DynamicReconfigure.find_reconfigure_nodes(this.ros, nodes_callback);
}

DynamicReconfigureGUI.prototype.close = function() {
  if(this.client) {
    this.client.close();
  }
  this.el.html('');
}

DynamicReconfigureGUI.prototype.change_callback = function(event) {
    var that = this;
    var new_config = {groups: this.config.groups};
    var change = false;
    Object.keys(this.config).each(function(param_name) {
        if(param_name=="groups") {
            return;
        }
        var param_info = that.param_descriptions[param_name];
        if(that.updated_config[param_name] != that.config[param_name]) {
            change = true;
            new_config[param_name] = that.updated_config[param_name];
        }
    });
    //console.log('changes', change, new_config, this.client);
    if(change) {
    this.client.update_configuration(new_config, function(x) {
        //console.log('callback');
    });
}

}

DynamicReconfigureGUI.prototype.menu_callback = function(event) {

    if(this.client != null) {
        if(this.name == event.data.node) {
            return;
        }
        this.client.close();
        Object.keys(this.config_elements).each(function(n) {
            // ?
        });
        this.config_elements = {};
        this.main.my("remove");
        this.main.empty();
        this.pane_ready = false;
        this.config = null;
        this.param_descriptions = null;
    }

    var config_callback = (this.config_callback).bind(this);
    var description_callback = (this.description_callback).bind(this);

    this.name = event.data.node;
    this.client = new DynamicReconfigureClient({
        ros: this.ros,
        name: event.data.node,
        config_callback: config_callback,
        description_callback: description_callback,
    });
}

DynamicReconfigureGUI.prototype.nodes_callback = function(nodes) {
    var self = this;
    var menu_callback = (this.menu_callback).bind(this);
    var list = $('<ul>').appendTo(this.menu);
    nodes.each(function(node) {
        var i = $('<li><a href="#'+node+'">'+node+'</a></li>').appendTo(list);
        i.on("click", { node: node}, menu_callback);
    });
}

DynamicReconfigureGUI.prototype.update_config_pane = function() {
    this.main.my("data", Object.clone(this.config));
}

DynamicReconfigureGUI.prototype.build_config_pane = function() {
    this.build_group(this.config.groups,this.main);

    var ui = {};
    for(var param_name in this.config) {
        if(param_name != 'groups') {
            var param_info = this.param_descriptions[param_name];

            var selector = '#param_'+param_name;
            if(param_info.type=="bool") {
                ui[selector] = { bind: (function(param_info, data, value, $control) {
                if(value != null) {
                    data[param_info.name] = value[0]=="true";
                }
                if(data[param_info.name]) {
                    return ['true'];
                } else {
                    return [];
                }
                }).bind(null, param_info)};
            } else {
                ui[selector] = { bind: (function(that, param_info, data, value, $control) {
                    if(value != null) {
                        data[param_info.name] = that.client._param_type_from_string(param_info.type)(value);
                    }
                    return data[param_info.name];
                }).bind(null, this, param_info)}; //, events: 'blur.my,check.my' };
            }
            if(param_info.edit_method!="") {
                ui[selector].init = function($ctrl) {
                    $ctrl.select2();
                }
            }
        }
    }
    var change_callback = (this.change_callback).bind(this);
    this.updated_config = Object.clone(this.config);

    var manifest = {
        data: this.updated_config,
        params: {
            //delay: 150,
            change: change_callback,
        },
        ui: ui
    };

    this.main.my(manifest, this.updated_config);

    this.pane_ready = true;
}



DynamicReconfigureGUI.prototype.config_callback = function(config) {
    // Use jquerymy for linking data
    this.config = config;

    if(!this.pane_ready) {
        this.build_config_pane();
    }

    //console.log('update params', config);
    this.update_config_pane();




}

DynamicReconfigureGUI.prototype.build_group = function(group,parent) {
    var self = this;
    var fieldset = $('<fieldset>').appendTo(parent).append('<legend>'+group.name+'</legend>');

    Object.keys(group.parameters).each(function(p) {
        var param_info = self.param_descriptions[p];
        var el = self.create_element(param_info);
        fieldset.append(el);
    });
    // Create fieldset
    // Add parameter controls
    // Traverse to other groups
    Object.extended(group.groups).values().each(function(g) {
        self.build_group(g,fieldset);
    });

}

DynamicReconfigureGUI.prototype.description_callback = function(description) {
    //console.log('description', description)
    this.param_descriptions = description;
}

DynamicReconfigureGUI.prototype.create_element = function(param_info) {
    if(param_info.edit_method!="") {
        var e = $.parseJSON(param_info.edit_method.split("'").join('"'));
        var p = $('<p>').append($('<label for="param_'+param_info.name+'">'+param_info.name+'</label>'));
        var s = $('<select id="param_'+param_info.name+'" name="param_'+param_info.name+'" title="'+param_info.description+'"/>').appendTo(p);
        for(var i in e.enum) {
            $("<option />", {value: e.enum[i].value, text: e.enum[i].name}).appendTo(s);
        }
        return p;
    }

    if(param_info.type=="str") {
        return $('<p><label for="param_'+param_info.name+'">'+param_info.name+'</label><input title="'+param_info.description+'" name="param_'+param_info.name+'" id="param_'+param_info.name+'" type="text" value="'+param_info.default+'"></p>');
    } else if(param_info.type=="double" || param_info.type=="int") {
        return $('<p><label for="param_'+param_info.name+'">'+param_info.name+'</label><input title="'+param_info.description+'" name="param_'+param_info.name+'" id="param_'+param_info.name+'" type="number" max="'+param_info.max+'" min="'+param_info.min+'" value="'+param_info.default+'"></p>');
    } else if(param_info.type=="bool") {
        var selected = "";
        if(param_info.default) {
            selected = " checked";
        }
        return $('<p><label for="param_'+param_info.name+'">'+param_info.name+'</label><input title="'+param_info.description+'" name="param_'+param_info.name+'" id="param_'+param_info.name+'" type="checkbox" value="true"'+selected+'></p>');
    }

    // ERROR!

}
