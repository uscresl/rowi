//# sourceURL=plugins/plot/plugin.js

function PlotPlugin(config) {
    var defaults = {
    };
    config = $.extend({}, defaults, config || {});
    this.templates = ["submitForm.html",];

  this.theTopic = '';
  this.theMessage = '';
  this.tempTopics = ['',];
  this.messageDetail = [];
  this.parsedMessage = [];
  this.plotField = '';
  this.storage = '';
  this.tree;
  this.dynamicTopics = [];
  this.dynamicIndex = []; 
  this.dynamicMessages = [];
  this.messageRecord = [];
  this.topicMap; 
  this.messageMap;
  ROWIPlugin.call(this, config);
  this.plot_gui = null;
  this.tab = null;
  this.messageBuffer = [];
  this.objectSize;
  this.initial = false;
  this.initialTime = 0;
  this.seconds = 0;
  this.arrayTest = [];
}

PlotPlugin.prototype = Object.create(ROWIPlugin.prototype);
PlotPlugin.prototype.constructor = PlotPlugin;

PlotPlugin.prototype.graphClear = function(){
  this.data = [];
  this.theTopic = '';
  for(var i = 0; i < this.dynamicMessages.length; ++i){
      this.messageBuffer[this.dynamicMessages[i]].length=0;
      this.messageMap[this.dynamicMessages[i]] = false;
  }
  delete this.plot_gui;
  this.plot_gui = new this.setUp(this.tab, {ros:ROWI.ros});
  $("#forTopic").text('');
}

PlotPlugin.prototype.init = function() {
  var res = ROWI.add_tab("Plot", this.activate.bind(this), this.deactivate.bind(this));
  this.tab = res[1];
  this.topicMap = new Object();
  this.messageMap = new Object();
  this.messageBuffer = new Object();
  $("#outer").appendTo(this.tab);
  $("#forTopic").text('');
  PlotPlugin.el = $('<div>').appendTo(this.tab);
  PlotPlugin.el.width(screen.width-100);
  PlotPlugin.el.height(400);
  PlotPlugin.ros = {ros:ROWI.ros}.ros;
  PlotPlugin.num_points = 400;
  $('<div><p>&emsp;</p></div>').appendTo(this.tab);
  $('<div style = "width: 100px; margin: 0 auto; marginLeft: -50px;"><p>Seconds</p></div>').appendTo(this.tab);
  PlotPlugin.legend = $("#forLegend");

  $("#jstree").appendTo(this.tab);
  this.jsTree();
  this.populateArray();
  this.plot_gui = new this.setUp(this.tab, {ros:ROWI.ros});

  $( "#submit" ).click(function() {
    this.completeParse($('#topicInput').val());
    this.plotField = '';
    this.parsedMessage = [];
    delete this.plot_gui;
    this.plot_gui = new this.setUp(this.tab, {ros:ROWI.ros});
    this.parseMessage(this.theMessage);
  }.bind(this));

  $("#interval").click(function(){
    var x = $("#xDist").val();
    $("#xDist").text(" ");
    var y = eval(x);
    PlotPlugin.num_points = y;
    $("#uncheck").click();
  }.bind(this));

  $( "#clear" ).click(function() {
    this.graphClear();
  }.bind(this));

  $( "#uncheck" ).click(function() {
    $('#jstree').jstree().uncheck_all();
    $('#clear').click();
  }.bind(this));

  $(document).keydown(function(e){
  if (e.keyCode==32 && e.ctrlKey)
      $("#uncheck").click();
  }.bind(this));

  $(document).keydown(function(e){
  if (e.keyCode==81 && e.ctrlKe)
      $("#clear").click();
  }.bind(this));

  $('#topicInput').keypress(function (e) {
    if (e.which == 13) {
      $('#submit').click();
      return false;    
    }
  });

  $('#xDist').keypress(function (e) {
    if (e.which == 13) {
      $('#interval').click();
      return false;    
    }
  });
};

function split_ns(ns){
  return ns.split('/');
}

function get_parent_ns(ns){
  return ns.split('/').to(-1).join('/') || '/';
}

function get_last_ns(ns){
  var abc = ns.split('/');
  return abc[abc.length - 1];
}

function id_gen_ns(prefix,ns){
  var abc = ns.split('/');
  var suffix = abc.join('$');
  return prefix.concat("_",suffix);
}

function get_tree_node(tree, prefix, ns, params){
  if (ns == '/'){
    return null;
  }
  var my_id = id_gen_ns(prefix, ns);
  var res = tree.get_node(my_id);
  if (res){
    return res;
  }
  else{
    var parent_ns = get_parent_ns(ns);
    var parent = get_tree_node(tree, prefix, parent_ns, {});
    tree.create_node(parent,
    $.extend({
      id: my_id,
      text: get_last_ns(ns),
    }, params));
    return tree.get_node(my_id);
  }
}

PlotPlugin.prototype.jsTree = function () {
  var map = {};
    var div = $('#jstree');
    div.jstree({'plugins':['sort', 'checkbox'], 'checkbox':{'tie_selection':false}, 'core':{'check_callback':true},'data':[]});
    var tree = div.jstree();
    var layers;

    this.tree = tree;
    ROWI.ros.getTopics((function(array){

      this.tempTopics = array.slice();
      for(var i = 0; i < array.length; ++i){
        get_tree_node(tree, 'plot_topics', array[i], {'children':['DELETE'],
        'open_callback': function() { return {'id':'ch','fieldtype':'test','text':'ch'} }, 'children_loaded': false});     
      }

      div.on('activate_node.jstree', function(e,data) {
          if (data.node.original.callback) {
              data.node.original.callback();
          }
      });

      div.on('uncheck_node.jstree', function(e,data) {
        console.log('just unchecked!');
          var dump = data.node.id.split('$');
          var toMessage = '';
          for(var i = 1; i<dump.length; ++i){
            toMessage += '/'+dump[i];
          } 
          var location = 1;
          var previous = 0;
          var messageStorage = [];
          var fieldBuilder = '';
          if(map[toMessage]=="float64"){

            while(location < toMessage.length){
              if(toMessage.charAt(location) == '/'){
                messageStorage.push(toMessage.slice(previous, location));
                previous = location+1;
              }
              location++;
            }
            messageStorage.push(toMessage.slice(previous, location));
            for (var i = 0; i < messageStorage.length; ++i){
              fieldBuilder += '.' + messageStorage[i];
            }
            this.unsubscribe(fieldBuilder); 

        }
      }.bind(this));


      div.on('check_node.jstree', (function(e,data) {
        console.log('node checked!');
          var dump = data.node.id.split('$');
          var toMessage = '';
          for(var i = 1; i<dump.length; ++i){
            toMessage += '/'+dump[i];
          }
          if(map[toMessage]=="float64"){
              this.subscribe(toMessage);        
          }        
      }.bind(this)));

      div.on('open_node.jstree', function(e,data) {
          if (data.node.original.open_callback) {
            if(data.node.original.children_loaded) {
                return;
            }
            var dump = data.node.id.split('$');
            var toMessage = '';
            for(var i = 1; i<dump.length; ++i){
              toMessage += '/'+dump[i];
            }
            var checker = false;
            for(var i = 0; i<array.length; ++i){
              if(toMessage == array[i]){
                checker = true;
              }
            }

            if(checker){
              ROWI.ros.getTopicType(toMessage, function(res) {
                ROWI.ros.getMessageDetails(res, function(msg_details) {
                  for(var i = 0; i<msg_details[0].fieldnames.length; ++i){
                    var temp1 = toMessage + '/' + msg_details[0].fieldnames[i];
                    map[temp1] = msg_details[0].fieldtypes[i];
                    var tempid = get_tree_node(tree, 'plot_topics', temp1,  {'children':['DELETE'] , 
                    'open_callback': function() { return {'id':'ch','fieldtype':'test','text':'ch'} }, 'children_loaded': false});
                    $('#jstree').jstree().uncheck_node(tempid);
                  }
                });  
              });                
            }

            else{
              ROWI.ros.getMessageDetails(map[toMessage], function(msg_details){
                for(var i = 0; i<msg_details[0].fieldnames.length; ++i){
                  var temp1 = toMessage + '/' + msg_details[0].fieldnames[i];
                  map[temp1] = msg_details[0].fieldtypes[i];
                  if(msg_details[0].fieldtypes[i]!="float64"){
                    var tempid = get_tree_node(tree, 'plot_topics', temp1,  {'children':['DELETE'] , 
                    'open_callback': function() { return {'id':'ch','fieldtype':'test','text':'ch'} }, 'children_loaded': false});
                    $('#jstree').jstree().uncheck_node(tempid);
                  }
                  else{
                    var tempid = get_tree_node(tree, 'plot_topics', temp1,  {"state" : "leaf"});
                    $('#jstree').jstree().uncheck_node(tempid);
                  }
                }
              });                  
            }
          }

          for(var i=0; i<data.node.children.length; i++){
              var n = data.instance.get_node(data.node.children[i]);
              $('#jstree').jstree().uncheck_node(data.node.children[i]);
              if(n.text=="DELETE") {
                  data.instance.delete_node(n);
              }
          }           
      });
    }.bind(this)));
}

PlotPlugin.prototype.populateArray = function(){
  ROWI.ros.getTopics(function(array){
    this.tempTopics = array.slice();
  }.bind(this));
}

PlotPlugin.prototype.activate = function() {
  ROWI.wait_for_ros(function() {
  }.bind(this));
}

PlotPlugin.prototype.deactivate = function() {
  if(this.plot_gui) {
    this.plot_gui = null;
  }
}

PlotPlugin.prototype.subscribe = function(topic){
  this.completeParse(topic);
  delete this.plot_gui;
  this.plot_gui = this.setUp(this.tab, {ros:ROWI.ros});
  this.data = [];
  ROWI.ros.getTopicType(this.theTopic, (function(msg){

    for (var member in this.messageBuffer) delete this.messageBuffer[member];
    this.plotField = '';
    this.parsedMessage = [];
    this.parseMessage(this.theMessage);
    var checker = false;

    for(var i = 0; i < this.dynamicTopics.length; i++){
      if(this.theTopic == this.dynamicTopics[i].name){
        this.topicMap[this.dynamicTopics[i].name]++;
        checker = true;
      }
    }

    if(!checker){
      this.topicMap[this.theTopic] = 1;
      this.dynamicTopics.push(new ROSLIB.Topic({
        ros: ROWI.ros,
        name        : this.theTopic,
        messageType : msg,
        throttle_rate: 100
      })); 
      this.dynamicTopics[this.dynamicTopics.length-1].subscribe(this.update.bind(this)); 
      this.dynamicIndex[1] = this.dynamicMessages.length-1;
      this.messageMap[this.dynamicMessages[(this.dynamicIndex[1])]] = true;
    }
    else{
      var builder = '';

      for(var i = 0; i < this.parsedMessage.length; ++i){
        builder += '.' + this.parsedMessage[i];
      }

      for(var i = 0; i < this.dynamicMessages.length; ++i){
        if(builder == this.dynamicMessages[i]){
          this.dynamicIndex[0] = i;
        }
      }
      this.messageMap[this.dynamicMessages[(this.dynamicIndex[0])]] = true;
      
    }

  }).bind(this));
  this.resize();
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

PlotPlugin.prototype.unsubscribe = function(field){
  for(var i = 0; i < this.dynamicMessages.length; ++i){
    if(field.indexOf(this.dynamicMessages[i]) != -1){
      var dump = field.split('.');
      var unsubTopic = '';

      for(var j = 0; j < dump.length; ++j){
        unsubTopic += '/' + dump[j];
      }

      for(var j = 0; j < this.dynamicTopics.length; ++j){

        if(unsubTopic.indexOf(this.dynamicTopics[j].name) != -1){
          this.topicMap[this.dynamicTopics[j].name]--;

          if(this.topicMap[this.dynamicTopics[j].name]==0){
            this.dynamicTopics[j].unsubscribe(this.update.bind(this));
            delete this.topicMap[this.dynamicTopics[j].name];
          }
        }
      }
      this.messageBuffer[this.dynamicMessages[i]].length=0;
      this.messageMap[this.dynamicMessages[i]] = false;
      this.dynamicIndex[0] = i;
    }
  }
}

PlotPlugin.prototype.setUp = function(el, options) {
  ROWI.ros.getTopicType(this.theTopic, (function(res) {
      var initial_data = [];
      for (var i = 0; i < PlotPlugin.num_points; ++i) {
        initial_data.push([i, 0]);
      }
      PlotPlugin.plot = $.plot(PlotPlugin.el, [initial_data], {
        series: {
          shadowSize: 0,
          lines: {
            show: true,
            lineWidth: 1.2,
          },
        },
        yaxis: {
          show: true,
          min: null,
          max: null,
          autoscaleMargin: null,
        },
        xaxis: {
          show: true,
          min: null,
          max: null,
        },
        legend: {
          show: true,
          position: 'nw',
        }
      });
      
      this.data = [];
      PlotPlugin.imu_listener = new ROSLIB.Topic({
        ros: ROWI.ros,
        name        : this.theTopic,
        messageType : res,
        throttle_rate : 100
      }); 
  }.bind(this)));
}

PlotPlugin.prototype.resize = function(){
  for(var i = 0; i < this.arrayTest.length; ++i){
    this.arrayTest[i] = new Array(0);
  }
  this.arrayTest.push(new Array(0));
}

PlotPlugin.prototype.update = function(msg) {
  if(!this.initial){
    this.initialTime = msg.header.stamp.nsecs;
    this.initial = true;
  }

  for(var i = 0; i < this.dynamicMessages.length; ++i){
    if(this.data.length < this.dynamicMessages.length){
      this.messageBuffer[this.dynamicMessages[i]] = new Array(0);
    }
  }

  for(var i = 0; i < this.arrayTest.length; ++i){
    if(this.arrayTest[i].length/5 > PlotPlugin.num_points){
      this.arrayTest[i].splice(0,1);
    }
  }

  var tempArray = [];
  for (var i = 0; i < this.dynamicMessages.length; ++ i){
    tempArray[i] = 'msg' + this.dynamicMessages[i];

    if(this.messageMap[this.dynamicMessages[i]]){
      this.data.push(this.dynamicMessages[i]);
      this.messageBuffer[this.dynamicMessages[i]].push(eval(tempArray[i]));
    }
  }

  for (var i = 0; i < Object.size(this.messageBuffer); ++i) {
    if(this.dynamicMessages[i]!=''){
      if(this.initialTime != msg.header.stamp.nsecs){
        this.arrayTest[i].push([(this.seconds/5), this.messageBuffer[this.dynamicMessages[i]][0]])
        this.messageBuffer[this.dynamicMessages[i]] = [];
      } 
    }
  }

  PlotPlugin.plot.getOptions().legend.noColumns = 1;
  if(this.initialTime != msg.header.stamp.nsecs){
    PlotPlugin.plot.setData(this.arrayTest);
    this.initialTime = msg.header.stamp.secs;
    this.seconds++;
  }
  PlotPlugin.plot.setupGrid();
  PlotPlugin.plot.draw();
  // data should be of this format: [[x,y],[x,y],[x,y]] ?
}

PlotPlugin.prototype.parseTopic = function(string, topicList){
  for(var i = 0; i<topicList.length; ++i){
    if(string == topicList[i]){
      return -1;
    }
  }
  var temp = '';
  var location = 1;
  var previous = 0;
  while(location < string.length){
    if(string.charAt(location) == '/'){
      temp+= string.slice(previous, location);
      previous = location;
      for(var i = 0; i<topicList.length; ++i){
        if(temp == topicList[i]){
          return location;
        }
      }
    }
    ++location;
  }
  return -2;
}

PlotPlugin.prototype.parseMessage = function(string){
  var location = 1;
  var previous = 0;
  while(location < string.length){
    if(string.charAt(location) == '/'){
      this.parsedMessage.push(string.slice(previous, location));
      previous = location+1;
    }
    location++;
  }
  this.parsedMessage.push(string.slice(previous, location));

  for (var i = 0; i < this.parsedMessage.length; ++i){
    this.plotField += '.' + this.parsedMessage[i];
  }

  var checker = false;

  for(var i = 0; i < this.messageRecord.length; ++i){
    if(this.messageRecord[i] == this.plotField){
      checker = true;
    }
  }

  if(!checker){
    this.dynamicMessages.push(this.plotField);
    this.messageRecord.push(this.plotField);    
  }
}

PlotPlugin.prototype.completeParse = function(string){
  var temp = string;
  var splitter = this.parseTopic(temp, this.tempTopics);

  if(splitter!=-1 && splitter!=-2){
    this.theTopic = temp.slice(0, splitter);
    this.theMessage = temp.slice(splitter+1, (temp.length));
    $("#forTopic").text(this.theTopic + '/' + this.theMessage + ' is currently being plotted');
  }

  else if(splitter == -2){
    this.theTopic = '';
    $("#forTopic").text('Not a valid topic name!');
  }

  else{
    this.theTopic = temp;
    $("#forTopic").text(this.theTopic + ' is currently being plotted');
  }
}
ROWI.register_plugin('plot', PlotPlugin);
