//# sourceURL=plugins/record_services/plugin.js


function record_services(config) {
    var self = this;

    var defaults = {

    };

    this.config = $.extend({}, defaults, config || {});
    
    this.namespace = config.namespace;

//    this.base_icon_classes = "fa fa-3x fa-";
    this.base_icon_classes = "fa fa-";

    this.panel = null;
    this.icon_panel = [];
    this.cbox_panel = [];
    this.selectAll;

    this.level = 4;
    this.last_update = null;

    this.OFF=0;
    this.RECORDING=1;
    var START = 1;
    var STOP = 0;
    this.checkfirst = true;
    this.icon_isThere = [];
    this.clickonce = true;
    this.statuses = {};
    this.isButton = false;
    this.start_button;
    this.stop_button;
    this.checkedElem = [];
    this.checkIndex;
    this.grpName = [];


    this.change_icon = function(el, icon, color,text) {
      el.attr("class", this.base_icon_classes+icon+' '+color+'-text'+ " title="+text);
    };

    this.ros_reload = function(newros) {
        this.rc_listener = new ROSLIB.Topic({
                ros: ROWI.ros,
                name: '/record_service/status',
                messageType: 'rosbag_record_service/RecordMsg',
                throttle_rate: ROWI.THROTTLE_RATE
        });
        this.rc_listener.subscribe((this.record_service_callback).bind(this));
    };

    this.single_click = function(topic_group, event){

        var act = this.statuses[topic_group];

        if(act == START){
          act = STOP;
        }
        else{
          act = START;
        }

        // Don't change
        var recordServiceClient = new ROSLIB.Service({
          ros: ROWI.ros,
          name: '/record_service',
          serviceType: 'rosbag_record_service/RecordSrv'
        });

        // At each request
        var request = new ROSLIB.ServiceRequest({
          action: act, // or "stop"
          topic_group: topic_group
        });

        recordServiceClient.callService(request, function(result) {
          //console.log(result);
        });

    };

    this.multi_click = function(action, event){
    this.checkIndex = 0;
    this.checkedElem = [];

    var temp = this;
    var len = $('input[type=checkbox][id=cbox]:checked').length;


      $('input[type=checkbox][id=cbox]:checked').each(function (index) {
        if (index<len) {
          temp.checkedElem[index] = temp.grpName[$(this).val()];
        }
      });

   // Don't change
          var recordServiceMultiClient = new ROSLIB.Service({
            ros: ROWI.ros,
            name: '/record_service/multi',
            serviceType: 'rosbag_record_service/RecordSrvMulti'
          });

          // At each request
          var request = new ROSLIB.ServiceRequest({
            action: action, // or "stop"
            topic_groups:this.checkedElem // or test2
          });

          recordServiceMultiClient.callService(request, function(result) {
            //console.log(result);
          });

    };

/*    this.create_icon = function(el,icon,color,text){
      el.attr("class", this.base_icon_classes+icon+' '+color+'-text'+ " title="+text);
    }
*/
    this.record_service_callback = function (msg){
        var grp = msg.groups;
        var mode = msg.statuses;
        for(i = 0;i < grp.length; i++){
          this.grpName[i] = grp[i];
          this.statuses[grp[i]] = mode[i];
        }
//        var inif = 0;
        if(this.checkfirst)
        {
          for(i = 0;i < grp.length; i++){
            this.icon_isThere[i] = true;
          }
          this.checkfirst = false;
        }

        for (index = 0; index < grp.length; index++) {
            if(this.icon_isThere[index]){
              this.initicon(msg,index);
            }
            if(mode[index] == this.OFF)
            {
                this.change_icon(this.icon_panel[index], 'square', 'red','service off');
            }
            else
            {
                this.change_icon(this.icon_panel[index], 'circle', 'green','service on');
            }

            var act = msg.statuses[index];

            if(this.clickonce == true){
                this.icon_panel[index].bind("click" , this.single_click.bind(this, msg.groups[index]));

                if(index == grp.length-1){
                    this.clickonce = false;
                }
            }

        }

        if (!this.isButton)
        {
          var table = $('<table>').appendTo(this.panel);
          table.css("width","100%");
          table.css("text-align","center");

          var row = $('<tr>').appendTo(table);

          this.select_all = $('<input type = "checkbox" id="selectAll"/>').appendTo(row);
          this.text_select = $('<td width = "88%" align="left">select all </td>').appendTo(row);


          this.select_all.bind("click",function(event){
            //alert("hello");
            var that = this;
            var mark = $('input[type=checkbox][id=cbox]').each(function(index)  {
              this.checked = that.checked
            });
          });

          this.start_button = $('<input type="button" value="start" id="getCheckboxesButton"></input>').appendTo(this.panel);
          this.start_button.bind("click",this.multi_click.bind(this,1));

          this.stop_button = $('<input type = "submit" value = "stop"/>').appendTo(this.panel);
          this.stop_button.bind("click",this.multi_click.bind(this, 0));

          this.isButton = true;
        }

    }

    this.init = function() {
        this.panel = ROWI.add_panel(this, 'Record_services', "/"+this.namespace+"/record_services");
        var table = $('<table>').appendTo(this.panel);
        table.css("width","100%");
        table.css("text-align","center");

    };

    this.initicon = function(msg,index) {
      var table = $('<table>').appendTo(this.panel);
      var val = index;
      table.css("width","100%");
      table.css("text-align","center");
      this.cbox_panel[index] = $('<td><input type = "checkbox" id = "cbox">'+'</input></td>').appendTo(table);
      this.cbox_panel[index].find("input").val(val);
      if(msg.statuses[index] == this.OFF){
        this.icon_panel[index] = $('<span class="fa fa-square red-text" title="service off"></span>').appendTo(table);
      }
      else{
        this.icon_panel[index] = $('<span class="fa fa-circle green-text" title="service on"></span>').appendTo(table);
      }
      var item_panel = $('<td width = "80%" align = "left">'+msg.groups[index]+'</td>').appendTo(table);
      this.icon_isThere[index]= false;
    };
}

ROWI.register_plugin('record_services', record_services);
