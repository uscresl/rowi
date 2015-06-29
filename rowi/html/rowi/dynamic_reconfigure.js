//var DynamicReconfigure = DynamicReconfigure || {};
DynamicReconfigure = {};

DynamicReconfigure.find_reconfigure_services = function(ros, callback)
{
    if(callback) {
        ros.getServicesForType('dynamic_reconfigure/Reconfigure', callback);
    }
};

DynamicReconfigure.find_reconfigure_nodes = function(ros, callback)
{
    DynamicReconfigure.find_reconfigure_services(ros, function(list) {
        var res = [];
        list.each(function(x) {
            res.push(x.split('/').to(-1).join('/'));
        });
        callback(res);
    });
};

DynamicReconfigure.get_parameter_names = function()
{

};

function group_dict(g) {
    var state;
    var type = '';

    if(g.state == null) {
        state = true;
    } else {
        state = g.state;
    }
    if(g.type != null) {
        type = g.type;
    }
    return {
        id: g.id,
        parent: g.parent,
        name: g.name,
        type: type,
        state: state,
        groups: {},
        parameters: {}
    };
}

function get_tree(m, group)
{
    if(group==null) {
        m.groups.each(function(x) {
            if(x.id==0) {
                group = x;
            }
        })
    }

    var children = {};
    m.groups.each(function(g) {
        if(g.id == 0) {
            return;
        } else if(g.parent == group.id) {
            var gd = group_dict(g);
            gd.groups = get_tree(m, g);
            children[gd.name] = gd;
        }
    });

    if(group.id==0){
        var ret = group_dict(group);
        ret.groups = children;
        return ret;
    } else {
        return children;
    }

}



function decode_description(msg) { //returns group description, takes descriptions msg
    var mins = decode_config(msg.min);
    var maxes = decode_config(msg.max);
    var defaults = decode_config(msg.dflt);
    var groups = {};
    var grouplist = msg.groups;

    function params_from_msg(msg) {
        var params = [];
        msg.parameters.each(function(param) {
            var name = param.name;
            params.push({
                name: name,
                min: mins[name],
                max: maxes[name],
                default: defaults[name],
                type: param.type,
                level: param.level,
                description: param.description,
                edit_method: param.edit_method,
            });
        });
        return params;
    }

    grouplist.each(function(group) {
        if(group.id == 0) {
            groups = group_dict(group);
            groups.parameters = params_from_msg(group);
        }
    });

    function build_tree(group) {
        var children = {};
        grouplist.each(function(g) {
            if(g.id==0) {

            } else if(g.parent==group.id) {
                var gd = group_dict(g);

                gd.parameters = params_from_msg(g);
                gd.groups = build_tree(gd);
                children[gd.name] = gd;
            }
        });
        return children;
    }

    groups.groups = build_tree(groups);

    return groups;

}

function extract_params(group) {
    var params = {};
    group.parameters.each(function(p) {
        params[p.name] = p;
    });
    //var params = [].concat(group.parameters);
    Object.keys(group.groups).each(function(n) {
        var g = group.groups[n];
        if(g!=null) {
            params = Object.merge(params,extract_params(g));
        } else {
            params = Object.merge(params,extract_params(n));
        }
    });
    return params;
}

function decode_config(msg, description)
{
    var d = {};

    [].concat(msg.strs).concat(msg.doubles).concat(msg.bools).concat(msg.ints).each(function(x) {
        d[x.name] = x.value;
    });

    if(msg.groups.length > 0 && description != null) {
        d.groups = get_tree(msg);

        function add_params(group, descr) {
            descr.parameters.each(function(param) {
                if(d[param.name] != null) {
                    group.parameters[param.name] = d[param.name];
                }
            })
            Object.keys(group.groups).each(function(n) {
                var g = group.groups[n];
                Object.keys(descr.groups).each(function(nr) {
                    var dr = descr.groups[nr];
                    if(dr.name == g.name) {
                        add_params(g, dr);
                    }
                })
            });
        }

        add_params(d.groups, description);
    }

    return d;
}

function encode_description(descr) {
    return {
        max: encode_config(descr.max),
        min: encode_config(descr.min),
        dflt: encode_config(descr.defaults),
        groups: encode_groups(null, descr.config_description)
    }
}

function encode_groups(parent, group) {
    var group_list = [];

    var msg = {
        name: group.name,
        id: group.id,
        parent: group.parent,
        type: group.type,
        parameters: []
    };

    group.parameters.each(function(param) {
        msg.parameters.push({
            name: param.name,
            type: param.type,
            level: param.level,
            description: param.description,
            edit_method: param.edit_method
        });
    });

    group_list.push(msg);

    group.groups.each(function(next) {
        group_list = group_list.concat(encode_groups(msg, next));
    });

    return group_list;
}

function encode_config(config, desc, flat) {
    if(flat==null) {
        flat = true;
    }
    var msg = {ints:[],bools:[],strs:[],doubles:[]};
    Object.keys(config).each(function(k) {
        var v = config[k];
        if(k=="groups") {
            if(flat) {
                //TODO
            } else {
                msg.groups = [];
                v.each(function(x) {
                    msg.groups.push({name:x.name,state:x.state,id:x.id,parent:x.parent});
                })

            }
            return;
        }

        var param_info = desc[k];
        var p = {name:k, value:v};
        if(param_info.type=="str") {
            msg.strs.push(p);
        } else if(param_info.type=="bool") {
            msg.bools.push(p);
        } else if(param_info.type=="int") {
            msg.ints.push(p);
        } else if(param_info.type=="double") {
            msg.doubles.push(p);
        } else {
            //TODO error
        }
    });
    return msg;
}

function initial_config(msg, description) {
    var d = {};

    [].concat(msg.strs).concat(msg.doubles).concat(msg.bools).concat(msg.ints).each(function(x) {
        d[x.name] = x.value;
    });

    function gt(m, descr, group) {
        if(group==null) {
            m.groups.each(function(x) {
                if(x.id==0) {
                    group = x;
                }
            });
        }

        var children = {};

        m.groups.each(function(g) {
            if(g.id==0) {
                return;
            } else if(g.parent == group.id) {
                var gd = group_dict(g);

                function find_state(gr, dr) {
                    dr.groups.each(function(g) {
                        if(g.id == gr.id) {
                            gr.state = g.state;
                            return;
                        } else {
                            find_state(gr, g);
                            return;
                        }
                    })
                }

                find_state(gd, descr);

                gd.groups = gt(m, descr, g);
                children[gd.name] = gd;
            }
        });

        if(group.id==0) {
            var ret = group_dict(group);
            ret.groups = children;
            return ret;
        } else {
            return children;
        }
    }

    if(msg.groups.length > 0 && description != null) {
        d.groups = gt(msg, description);

        function add_params(group, descr) {
            descr.parameters.each(function(param) {
                group.parameters[param.name] = d[param.name];
            });
            Object.keys(group.groups).each(function(n) {
                var g = group.groups[n];
                descr.groups.each(function(dr) {
                    if(dr.name==g.name) {
                        add_params(g, dr);
                    }
                });
            });
        }

        add_params(d.groups, description);
    }

    return d;

}
//dr = new DynamicReconfigureClient({ros: ROWI.ros, name: '/knarr/heading_controller'})
//DynamicReconfigure.find_reconfigure_services(ROWI.ros, function(res){console.log(res)})

function DynamicReconfigureClient(options) {
    var that = this;

    options = options || {};
    this.ros = options.ros;
    this.name = options.name;
    this.timeout = options.timeout || 3;
    this.config_callback = options.config_callback;
    this.description_callback = options.description_callback;

    this.param_description = null;
    this.group_description = null;

    this.config = {};

    this._set_service = new ROSLIB.Service({
        ros: this.ros,
        name: this.name+'/set_parameters',
        serviceType: 'dynamic_reconfigure/Reconfigure'
    });

    this._descriptions_sub = new ROSLIB.Topic({
        ros: this.ros,
        name: this.name+'/parameter_descriptions',
        messageType: 'dynamic_reconfigure/ConfigDescription'
    });

    this._descriptions_sub.subscribe(function(msg) {
        that._descriptions_callback(msg);
    });

    this._config_sub = new ROSLIB.Topic({
        ros: this.ros,
        name: this.name+'/parameter_updates',
        messageType: 'dynamic_reconfigure/Config'
    });

    this._config_sub.subscribe(function(msg) {
        that._config_callback(msg);
    });

};

DynamicReconfigureClient.prototype._param_type_from_string = function(str)
{
    if(str=='int') {
        return Number
    } else if(str=='double') {
        return Number
    } else if(str=='str') {
        return String
    } else if(str=='bool') {
        return Boolean
    } else {
        // Error
    }
}


DynamicReconfigureClient.prototype._descriptions_callback = function(msg)
{
    this.group_description = decode_description(msg);
    this.param_description = extract_params(this.group_description);

    var self = this;

    this._param_types = {};
    Object.keys(this.param_description).each(function(n) {
        var p = self.param_description[n];
        var t = p.type;
        if(n!=null && t!=null) {
            self._param_types[n] = self._param_type_from_string(t);
        }
    });

    if(this.description_callback) {
        this.description_callback(this.param_description);
    }
};

DynamicReconfigureClient.prototype._config_callback = function(msg)
{
    if(!this.group_description) {
        // wait for group_descriptions to be ready
        setTimeout(this._config_callback.bind(this, msg), 100);
        return;
    }

    this.config = decode_config(msg, this.group_description);

    if(this.config_callback) {
        this.config_callback(this.config);
    }
};

DynamicReconfigureClient.prototype.get_configuration = function() {
    if(!this.config) {
        setTimeout(this.get_configuration.bind(this), 100);
        return;
    }
    return this.config;
};

DynamicReconfigureClient.prototype.get_parameter_descriptions = function() {
    if(!this.param_description) {
        setTimeout(this.get_parameter_descriptions.bind(this), 100);
        return;
    }
    return this.param_description;
};

DynamicReconfigureClient.prototype.get_group_descriptions = function() {
    if(!this.group_description) {
        setTimeout(this.get_group_descriptions.bind(this), 100);
        return;
    }
    return this.group_description;
};

DynamicReconfigureClient.prototype.update_configuration = function(changes, callback) {
    if(this.param_description == null) {
        this.get_parameter_descriptions();
    }

    var that = this;

    if(this.param_description != null) {
        Object.keys(changes).each(function(name) {
            var value = changes[name];
            if(name!='groups') {
                var dest_type = that._param_types[name];
                if(dest_type==null) {
                    throw "Unknown parameter '"+name+"'.";
                }
                var found = false;
                var descr = that.param_description[name];

                if(dest_type == Boolean && typeof value == String) {
                    if(value.toLowerCase()=="yes" || value.toLowerCase()=="true" || value.toLowerCase()=="t" || value.toLowerCase()=="1") {
                        changes[name] = true;
                        found = true;
                    }
                }
                /*
                 else if(typeof value == String && descr.edit_method != "") {
                    var enum_descr = eval(descr.edit_method)
                    found = false;
                    enum_descr.enum.each(function(cnst) {
                        if(value.toLowerCase() == cnst.name.toLowerCase()) {
                            var val_type = that._param_type_from_string(cnst.type);
                            changes[name] = val_type(cnst.value);
                            found = true;
                        }
                    });
                }
                */
                if(!found) {
                    changes[name] = dest_type(value);
                }
            }
        });
    }

    if(Object.keys(changes).any('groups')) {
        //changes.groups = this.update_groups(changes.groups);
    }

    var config = encode_config(changes, this.param_description);

    this._set_service.callService(new ROSLIB.ServiceRequest({config:config}), function(res) {
        if(that.group_description == null) {
            that.get_group_descriptions();
        }
        var resp = decode_config(res.config, that.group_description);
        if(callback!=null) {
            callback(resp);
        }
    });
    return;
};

DynamicReconfigureClient.prototype.update_groups = function(changes) {
    var descr = this.get_group_descriptions();

    var groups = [];
    function update_state(group, description) {
        var p = 0;
        description.groups.each(function(g) {
            if(g.name == group) {
                description.groups[p].state = changes[group];
            } else {
                update_state(group, g);
            }
        });
        return description;
    }

    changes.each(function(change) {
        descr = update_state(change, descr);
    });

    return descr;
};

DynamicReconfigureClient.prototype.close = function() {
    this._config_sub.unsubscribe();
    this._descriptions_sub.unsubscribe();
};

DynamicReconfigureClient.prototype.get_config_callback = function() {
    return this.config_callback;
};

DynamicReconfigureClient.prototype.set_config_callback = function(value) {
    this.config_callback = value;
};

DynamicReconfigureClient.prototype.get_description_callback = function() {
    return this.description_callback;
};

DynamicReconfigureClient.prototype.set_description_callback = function(value) {
    this.description_callback = value;
};
