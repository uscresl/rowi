/**
 * @author James Collins - jamescol@usc.edu
 */
function DynamicToolbars(map) {
  this.base = [];
  this.baseID = [];
  this.callbackID = new Object();
  this.iconSettings = new Object();
  this.baseIcon = [];
  this.actions = [];
  this.actionIcons = [];
  this.actionID = [];
  this.subIcons = [];
  this.subActions = [];
  this.subIDs = [];
  this.subsTracker = [];
  this.retractor;
  this.currentIndex;
  this.disabledList = [];
  this.currentRoot;
  this.toolbar;
  this.icons = {

  }
  this.map = map;
}

// Taken from Joe at http://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function guidGenerator() {
  //Generates a random sequence of numbers and letters to be used as a unique ID for every element added to the toolbar.
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
// 
DynamicToolbars.prototype.blank = function(){
  console.log("Attatched the callback");
}


DynamicToolbars.prototype.addGroup = function(tooltip, icon, order, callback) { //icon,tooltip,order,callback_open,callback_close){
  //Adds a group to the toolbar. The group is the base layer of the toolbar and can contain actions, which in turn contain sub actions
  order--;
  this.baseID[order] = guidGenerator();
  this.base[order] = tooltip;
  this.baseIcon[order] = icon;
  this.actions.push(new Array(0));
  this.actionIcons.push(new Array(0));
  this.actionID.push(new Array(0));
  this.subActions.push(new Array(0));
  this.subIcons.push(new Array(0));
  this.subIDs.push(new Array(0));
  if(callback!=null){
    this.attatchCallback(this.baseID[order], callback);
  }
  return this.baseID[order];
}

DynamicToolbars.prototype.addRoot = function(tooltip, icon, order, callback) { //icon,tooltip,order,callback_open,callback_close){
  //Adds a group to the toolbar. The group is the base layer of the toolbar and can contain actions, which in turn contain sub actions
  order--;
  this.baseID[order] = guidGenerator();
  this.base[order] = tooltip;
  this.baseIcon[order] = icon;
  this.actions.push(new Array(0));
  this.actionIcons.push(new Array(0));
  this.actionID.push(new Array(0));
  this.subActions.push(new Array(0));
  this.subIcons.push(new Array(0));
  this.subIDs.push(new Array(0));
  if(callback!=null){
    this.attatchCallback(this.baseID[order], callback);
  }
  this.currentRoot = this.baseID[order];
}

DynamicToolbars.prototype.enable = function(id){
  //Enables the functionality/callbacks of a previously disabled toolbar item.
  for(var i = 0; i < this.disabledList.length; ++i){
      if(this.disabledList[i] == id){
        //enable the button
        this.disabledList.splice(i,1);
    }
  }
}

DynamicToolbars.prototype.attatchCallback = function(id, aFunc){
  //Adds a function to a button on the toolbar which will be excecuted on click. Multiple callbacks
  //can be attatched to the same element on the toolbar
  if(this.callbackID[id]==null){
    this.callbackID[id] = new Array(0);
  }
  this.callbackID[id].push(aFunc);
}

DynamicToolbars.prototype.disable = function(id){
  //disable is used if you would like to disable the functionality/callbacks of a particular
  //element on the toolbar. Elements can allways be re-enabled using the enable method
  this.disabledList.push(id);
}

DynamicToolbars.prototype.addAction = function(id, tooltip, icon, order, callback){ //group (returned by addGroup), icon, tooltip, callback, order
  //Adds an action to a particular group
  var storage = -1;
  for(var i = 0; i < this.baseID.length; ++i){
      if(this.baseID[i] == id){
        storage = i;
    }
  }

  if(storage == -1){
    console.log('The given group does not exist amoung the current active groups');
  }
  else{
    order--;
    this.actions[storage][order] = tooltip;
    this.actionIcons[storage][order] = icon;
    this.actionID[storage][order] = guidGenerator();
    this.subActions[storage].push(new Array(0)); 
    this.subIcons[storage].push(new Array(0));
    this.subIDs[storage].push(new Array(0));
  }

  if(callback!=null){
    this.attatchCallback(this.actionID[storage][order], callback);
  }
  return this.actionID[storage][order];
}

DynamicToolbars.prototype.addSubAction = function( aID, tooltip, icon, callback){
  //Adds a sub action to a particular action
  var storage = -1;
  var storage1 = -1;
  for(var i = 0; i < this.baseID.length; ++i){
    for(var j = 0; j < this.actionID[i].length; ++j){
      if(this.actionID[i][j] == aID){
        storage = i;
        storage1 = j; 
      }
    }
  }
  if(storage == -1){
    console.log('The given group does not exist amoung the current active groups');
  }
  else if(storage1 == -1){
    console.log('The given group does not exist amoung the current active groups');
  }
  else{
    this.subActions[storage][storage1].push(tooltip);  
    this.subIcons[storage][storage1].push(icon); 
    var tempID = guidGenerator();
    this.subIDs[storage][storage1].push(tempID);
    if(callback!=null){
      this.attatchCallback(tempID, callback);
    }
    return tempID;
  }

}

DynamicToolbars.prototype.addImageEncoding = function(key, value){
  //If you look in DynamicToolbars.prototype.createNode, you will see that there is a map which takes in a string as a key
  //and outputs a css classname as a value. This method allows the user to add new css classes to the Buttons simply by defining a key value pair here.
  //The user can then pass in the key in place of the icon parameter when calling addSubAction, addAction, or addGroup.
  this.iconSettings[key] = value;
}

DynamicToolbars.prototype.addAll = function(groupTooltip, groupIcon, groupOrder, actionTooltip, actionIcon, actionOrder, subactionTooltip, subactionIcon){
  //Adds a group to the toolbar, an action to that group, and a subaction to that action. This method is a little niche, 
  //but can help the user type less and declare fewer temporary varriables to just store ID references. Plus, after calling
  //this method, you can always add in actions or subactions where you would like via addAction and addSubAction and passing in one
  //of he IDs
  var gID = this.addGroup(groupTooltip, groupIcon, groupOrder, null);
  var aID = this.addAction(gID, actionTooltip, actionIcon, actionOrder, null);
  var sID = this.addSubAction(aID, subactionTooltip, subactionIcon, null);
  var triple = [gID, aID, sID];
  return triple;

}

DynamicToolbars.prototype.createNode = function(name, id, location, subactions, icon, sub, callback, isAction){
  //This method creates a button to be handled by the L.Toolbar.Control.
  //All groups, actions, and sub actions are created by this method. The reason the method is split into
  //two halves by a conditional is that in Leaflet, before you create an action, you need to know if said action
  //is going to have any sub actions attributed to it. Also in the second addHooks listener, we are handling the 
  //decision to expand or retract the actions that belong to a given group.
  this.iconSettings["KN"] = "fa fa-ship";
  this.iconSettings["MB"] = "fa fa-dot-circle-o";
  this.iconSettings["RB"] = "fa fa-ban";
  this.iconSettings["HC"] = "fa fa-compass";
  this.iconSettings["CM"] = "fa fa-map-marker";
  this.iconSettings["LC"] = "fa fa-eye";
  this.iconSettings["GC"] = "fa fa-magic";
  if(subactions.length!=0){
    console.log(subactions);
    var currentAction = L.ToolbarAction.extend({
      options: {
          toolbarIcon: {
              className: "action " + this.iconSettings[icon], 
              html: '',
              tooltip: name,
          },
          subToolbar: new L.Toolbar({ actions: subactions })  
      },
      addHooks: function () {
        for(var i = 0; i < callback.length; ++i){
          callback[i]();
        }      
      }.bind(this)
    });  
  }
  else{
    var stringStorage;
    var classStorage;
    if(this.iconSettings[icon] == null){
      stringStorage = icon;
    }
    else{
      stringStorage = "";
    }
    if(isAction){
      classStorage =  " action";
    }
    else{
      classStorage = "";
    }
    console.log(stringStorage);
    var currentAction = L.ToolbarAction.extend({
      options: {
          toolbarIcon: {
              className: id + " " + this.iconSettings[icon] + classStorage,
              html: stringStorage,
              tooltip: name,
          }  
      },
      addHooks: function () {
        for(var i = 0; i < callback.length; ++i){
          callback[i]();
        }   
        var flag = false;
        for(var i = 0; i < this.disabledList.length; ++i){
          if(this.disabledList[i] == id){
            flag = true;
          }
        }  
        if(flag){

        }
        else{
          if(!sub){
            var group = false;
            if(this.retractor == group){
              this.draw(); 
              this.retractor = true;       
            }
            else{
              var className = this.map._toolbars[0]._active._link.className;
              this.retractor = group;
              this.whenClicked(this.map._toolbars[0]._active._link.title, className.substring(21 , 57));
           }
          }
          else{
            if(stringStorage == "cancel" || stringStorage == "send"){
              this.toolbar._active.disable();              
            }
          }
        }    
      }.bind(this)
    });  
  }
  location.push(currentAction);
}

DynamicToolbars.prototype.hasCallback = function(id){
  //Takes in an ID and returns the callbacks attributed to the ID in an array. The reason 
  //this is a method and cannot simply be a call to this.callbackID[id] is that if no callbacks
  //have been attatched to a particular ID, we need to attatch a "blank" function to prevent
  //a function call to an undefined reference.
  if(this.callbackID[id]!=null){
    return this.callbackID[id];
  }
  else{
    var temp = new Array(0);
    temp.push(this.blank);
    return temp;
  }
}

DynamicToolbars.prototype.whenClicked = function(ParentName, id){
  //The reason for this method is the default behavior of Leaflet, which does not have a dedicated action layer,
  //nor does it have any built in behavior for expanding the toolbar downwards. So essentially, in order to have an action
  //layer which expands downwards from groups, its necessary to redefine the L.Toolbar.Control, except with a new sequence of button
  //actions ordered correctly so that the subsequence of actions is located directly below the group to which it belongs, as well as 
  //have all the necessary subtoolbar actions created and attatched to these newly drawn buttons. 
  var storage = [];
  var storageIcon = [];
  var storageID = [];
  var storageSubs = [];
  var actions = [];
  var sActions = [];
  var empty = [];
  var intStorage; 
  for(var i = 0; i < this.baseID.length; ++i){
    storage.push(this.base[i]);
    storageIcon.push(this.baseIcon[i]);
    storageID.push(this.baseID[i]);
    if(id == this.baseID[i]){
      intStorage = i;
    }
  }
  for(var i = (this.actions[intStorage].length - 1); i > -1; --i){
    storage.splice(intStorage+1, 0 , this.actions[intStorage][i]);
    storageIcon.splice(intStorage+1, 0 , this.actionIcons[intStorage][i]);
    storageID.splice(intStorage+1, 0, this.actionID[intStorage][i]);
  }

  for(var i = 0; i < intStorage+1; ++i){
    this.createNode(storage[i], storageID[i], actions, empty, storageIcon[i], false, this.hasCallback(storageID[i]), false);
  }
  for(var i = intStorage+1; i < (intStorage+1) + this.actions[intStorage].length; ++i){
    var currentSubs = [];

      console.log(this.actions[intStorage][i-(intStorage+1)]);
      console.log(this.subActions);
      console.log(this.subActions[intStorage][i-(intStorage+1)]);

      for(var k = 0; k < this.subActions[intStorage][i-(intStorage+1)].length; ++k){
        this.createNode(this.subActions[intStorage][i-(intStorage+1)][k], this.subIDs[intStorage][i-(intStorage+1)][k], currentSubs, empty, this.subIcons[intStorage][i-(intStorage+1)][k], true, this.hasCallback(this.subIDs[intStorage][i-(intStorage+1)][k]));
      }  
      storageSubs.push(currentSubs);
    
    if(currentSubs.length != 0){
      this.createNode(storage[i], storageID[i], actions, storageSubs[i - (intStorage+1)], storageIcon[i], false, this.hasCallback(storageID[i]), true);
    }
    else{
      this.createNode(storage[i], storageID[i], actions, empty, storageIcon[i], false, this.hasCallback(storageID[i]), true);
    }
  }
  for(var i = ((intStorage+1) + this.actions[intStorage].length); i < storage.length; ++i){
    this.createNode(storage[i], storageID[i], actions, empty, storageIcon[i], false, this.hasCallback(storageID[i]), false);
  }
  this.toolbar = new L.Toolbar.Control({
    position: 'topleft',
    actions: actions,
  }).addTo(this.map);
}

DynamicToolbars.prototype.draw = function(){
  //Makes the toolbar visible
  var actions = [];
  var empty = [];
  for(i = 0 ; i < this.base.length; i++){
    this.createNode(this.base[i], this.baseID[i], actions, empty, this.baseIcon[i], false, this.hasCallback(this.baseID[i]), false);
  }

  this.toolbar = new L.Toolbar.Control({
    position: 'topleft',
    actions: actions
  }).addTo(this.map);
}
