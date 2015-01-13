
//**************************************************
// Define the depended service
//**************************************************

var ServiceUrl = window.location.href + "service/sample";

//**************************************************
// Primary Rendering Components
//**************************************************

// singleton helper module
var ComponentUtil = (function() {

  // public method
  var exports = {
    doRecord: doRecord
  };

  // handles displaying a textarea dialog, checks for proper JSON,
  //   and delegates new value submission to passed function
  function doRecord(title, value, opFunction) {
    var div = document.createElement("div");
    var form = document.createElement("form");
    var input = document.createElement("textarea");
    input.cols = "50";
    input.rows = "10";
    input.value = value;
    form.appendChild(input);
    div.appendChild(form);
    jQuery(div).dialog({
      title: title,
      modal: true,
      width: "60%",
      buttons: [
        {
          text: "OK",
          click: function() {
            var value = jQuery(this).find("textarea").val();
            try {
              value = JSON.parse(value);
            }
            catch (e) {
              alert("JSON not properly formatted.\n\n" + e + "\n\nPlease try again.");
              return;
            }
            jQuery(this).dialog("close");
            opFunction(value);
          }
        },{
          text: "Cancel",
          click: function() {
            jQuery(this).dialog("close");
          }
        }
      ]
    });
  }

  return exports;

})();

// entry component renders one record row and handles record-specific actions
var Entry = React.createClass({
  modifyRecord: function(event) {
    var id = this.props.id;
    var ac = this.props.ac;
    ComponentUtil.doRecord("Modify Record", JSON.stringify(this.props.data, undefined, 2),
      function(value) { ac.modifyRecord(id, value); });
  },
  deleteRecord: function(event) {
    if (confirm("Are you sure you want to delete record " + this.props.id + "?")) {
      this.props.ac.deleteRecord(this.props.id);
    }
  },
  render: function() {
    var displayVal = JSON.stringify(this.props.data);
    if (displayVal.length > 40) {
      displayVal = displayVal.substring(0, 37) + "...";
    }
    return (
      <tr>
        <td>{this.props.id}</td>
        <td><pre>{displayVal}</pre></td>
        <td>
          <input type="button" value="Modify" onClick={this.modifyRecord}/>
          <input type="button" value="Delete" onClick={this.deleteRecord}/>
        </td>
      </tr>
    );
  }
});

// entry list component renders entry table and handles 'global' actions
var EntryList = React.createClass({
  addRecord: function() {
    var ac = this.props.ac;
    ComponentUtil.doRecord("Add Record", "", function(value) { ac.addRecord(value); });
  },
  resetData: function() {
    if (confirm("Are you sure you want to restore the above data to its original state?")) {
      this.props.ac.resetData();
    }
  },
  render: function() {
    var keys = Object.keys(this.props.data);
    var dataMap = this.props.data;
    var ac = this.props.ac;
    return (
      <div>
        <h3>JSON Record Store</h3>
        <div>Each entry must be valid JSON</div>
        <hr/>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Record Preview</th>
              <th>Operations</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(function(key) {
              return ( <Entry key={key} id={key} data={dataMap[key]} ac={ac}/> );})}
          </tbody>
        </table>
        <hr/>
        <input type="button" value="Add Record" onClick={this.addRecord}/>
        <input type="button" value="Reset Data" onClick={this.resetData}/>
      </div>
    );
  }
});

//**************************************************
// View-Controller (wraps primary page component)
//**************************************************

var ViewController = React.createClass({
  // get state from store for initial render
  getInitialState: function() {
    return this.props.store.get();
  },
  // register with store to receive update notifications
  componentDidMount: function() {
    this.props.store.register(this.update);
  },
  // handle update notifications from the store
  update: function(store) {
    this.replaceState(store.get());
  },
  // render is simply a wrapper around EntryList, passing latest state
  render: function() {
    return ( <EntryList data={this.state} ac={this.props.ac}/> );
  }
});

//**************************************************
// Dispatcher
//**************************************************

// use the raw Flux dispatcher
var Dispatcher = Flux.Dispatcher;

// types of actions sent through the dispatcher
var ActionType = {
  ADD_ACTION:    "addAction",
  MODIFY_ACTION: "modifyAction",
  DELETE_ACTION: "deleteAction",
  RESET_ACTION:  "resetAction"
}

//**************************************************
// Store
//**************************************************

var Store = function(dispatcher, initialValue) {

  // public methods
  var exports = {
    register: register,
    get: get
  };

  // private data
  var _data = initialValue;
  var _registeredCallbacks = [];

  // returns current store state
  function get() {
    return _data;
  }

  // registers a function to call when state has changed
  function register(callback) {
    _registeredCallbacks.push(callback);
  }

  // calls all registered functions, passing itself as only param
  function updateRegisteredViews() {
    _registeredCallbacks.forEach(function(func) { func(exports); });
  }

  // handles actions from the dispatcher
  function handleAction(payload) {
    // payload delivered is object in the form:
    //   { actionType: ActionType, data: { id: Number, value: Any } }
    switch(payload.actionType) {
      case ActionType.ADD_ACTION:
        _data[payload.data.id] = payload.data.value;
        break;
      case ActionType.MODIFY_ACTION:
        _data[payload.data.id] = payload.data.value;
        break;
      case ActionType.DELETE_ACTION:
        delete _data[payload.data.id];
        break;
      case ActionType.RESET_ACTION:
        _data = payload.data.value;
      default:
        // this store does not support other actions
    }
    // then alert registered views of change
    updateRegisteredViews();
  }

  // register action handler with the dispatcher
  dispatcher.register(handleAction);

  return exports;
}

//**************************************************
// Action-Creator functions interact with the server
//**************************************************

var ActionCreator = function(serviceUrl, dispatcher) {

  // public methods
  var exports = {
    addRecord: addRecord,
    modifyRecord: modifyRecord,
    deleteRecord: deleteRecord,
    resetData: resetData
  };

  // private data
  var _serviceUrl = serviceUrl;
  var _dispatcher = dispatcher;

  function addRecord(value) {
    jQuery.ajax({
      type: "POST",
      url: _serviceUrl,
      contentType: 'application/json; charset=UTF-8',
      data: JSON.stringify(value),
      dataType: "json",
      success: function(data, textStatus, jqXHR) {
        _dispatcher.dispatch({ actionType: ActionType.ADD_ACTION, data: { id: data.id, value: value }});
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        alert("Error: Unable to create new record");
      }
    });
  }

  function modifyRecord(id, value) {
    jQuery.ajax({
      type: "PUT",
      url: _serviceUrl + "/" + id,
      contentType: 'application/json; charset=UTF-8',
      data: JSON.stringify(value),
      success: function(data, textStatus, jqXHR) {
        _dispatcher.dispatch({ actionType: ActionType.MODIFY_ACTION, data: { id: id, value: value }});
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        alert("Error: Unable to update record with ID " + id);
      }
    });
  }

  function deleteRecord(id) {
    jQuery.ajax({
      type: "DELETE",
      url: _serviceUrl + "/" + id,
      success: function(data, textStatus, jqXHR) {
        _dispatcher.dispatch({ actionType: ActionType.DELETE_ACTION, data: { id: id }});
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        alert("Error: Unable to delete record with ID " + id);
      }
    });
  }

  function resetData() {
    jQuery.ajax({
      type: "GET",
      url: _serviceUrl + "/reset",
      data: { expandRecords: true },
      success: function(data, textStatus, jqXHR) {
        _dispatcher.dispatch({ actionType: ActionType.RESET_ACTION, data: { value: data } });
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        alert("Error: Unable to reset record data");
      }
    });
  }

  return exports;
}

//**************************************************
// Page Initialization
//**************************************************

// singleton
var Page = (function() {

  var exports = {
    loadPage: loadPage
  };

  function wireApplication(serviceUrl, initialData) {

    // create dispatcher
    var dispatcher = new Dispatcher();

    // initialize the store with the fetched state
    var store = new Store(dispatcher, initialData);

    // create action creator container
    var ac = new ActionCreator(serviceUrl, dispatcher);

    // create top-level view-controller
    React.render(<ViewController store={store} ac={ac}/>, document.body);
  }

  function loadPage(serviceUrl) {
    jQuery.ajax({
      type: "GET",
      url: serviceUrl,
      data: { expandRecords: true },
      dataType: "json",
      success: function(data) {
        wireApplication(serviceUrl, data);
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        alert("Error: Unable to load initial data");
      }
    });
  }

  return exports;

})();

Page.loadPage(ServiceUrl);

