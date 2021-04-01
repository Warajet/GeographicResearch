var params_table = document.getElementById("parameters_table");
var params_list = [];

  // Variables related to Firebase realtime database
  var firebase_db = firebase.database();
  var params_dbRef = firebase_db.ref().child('parameters');

  async function getParameterList(){
    params_list = [];
    return params_dbRef.once('value').then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
          params_list.push(childSnapshot);
      });
      return params_list;
    });
  }

  async function displayParameterTable(params){
    params_list = [];
    $("#parameters_table tbody").empty();
    var params_list = await params;
    for(i = 0; i < params_list.length; i++){
        var tableRef = parameters_table.getElementsByTagName('tbody')[0];

        // Insert a row in the table at the last row
        var newRow   = tableRef.insertRow();

        // Insert a cell in the row at index 0
        var param_cell  = newRow.insertCell(0);
        var max_cell  = newRow.insertCell(1);
        var min_cell  = newRow.insertCell(2);

        var edit_cell = newRow.insertCell(3);

        // Append a text node to the cell
        var sample_key  = document.createTextNode(params_list[i].key);
        var sample_val = params_list[i].val();

        param_cell.appendChild(sample_key);
        max_cell.appendChild(document.createTextNode(sample_val.max));
        min_cell.appendChild(document.createTextNode(sample_val.min));

        var save_btn = createButton("Save","save"+params_list[i].key);
        save_btn.style.display = "none";
        edit_cell.appendChild(createButton("Edit", "edit"+params_list[i].key));
        edit_cell.appendChild(save_btn);
    }
}

function createButton(button_label, id){
    var button = document.createElement("button");
    button.id = id;
    button.innerText = button_label;
  
    switch(button_label){
      case "Edit":
        button.className = "btn btn-info ";
        break;
      case "Delete":
        button.className = "btn btn-danger";
        break;
      case "Save":
        button.className = "btn btn-success";
    }
  
    button.addEventListener("click", function(){
      switch(button_label){
        case "Edit":
          editCell(button);
          break;
        case "Save":
          saveColumnChange(button);
      }
    });
    return button;
}

function editCell(button){
    var activeRow = button.parentNode.parentNode.rowIndex;
    var tab = params_table.rows[activeRow];
    var columns = tab.getElementsByTagName("td").length;
    for(i = 1; i < columns - 1;i++){
        var td = tab.getElementsByTagName("td")[i];
        var ele = document.createElement("input");
        ele.setAttribute('type', 'text');
        ele.setAttribute('value', td.innerText);
        td.innerText = '';
        td.appendChild(ele);
    }
  
    var save_btn = document.getElementById("save"+params_list[activeRow-1].key);
    console.log("Save Button for ID: " + save_btn.id);
    save_btn.setAttribute('style', 'display:block;');
    // HIDE THIS BUTTON.
    button.setAttribute('style', 'display:none;');
}


function saveColumnChange(button){
    console.log("Save is triggered");
    var activeRow = button.parentNode.parentNode.rowIndex;
    var tab = params_table.rows[activeRow];
    var columns = tab.getElementsByTagName("td").length;
  
    var param_td = params_list[activeRow-1].key;
    var max_td = tab.getElementsByTagName("td")[1].childNodes[0].value;
    var min_td = tab.getElementsByTagName("td")[2].childNodes[0].value;

    if(parseFloat(max_td) < parseFloat(min_td)){
      // eslint-disable-next-line no-alert
      alert("Please set the minimum and maximum value carefully");
    }
    else{
      var sent_data = {
        paramId: param_td,
        max: parseFloat(max_td),
        min: parseFloat(min_td),
      };
    
      var xhr = new XMLHttpRequest();
      var url = "/settings/"+param_td;
      var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("X-CSRF-TOKEN", token);
      xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && xhr.status === 200) {
              var json = JSON.parse(xhr.responseText);
              reloadData();
          }
      };
      var data = JSON.stringify(sent_data);
      console.log(data)
      xhr.send(data);
    }
  }

function reloadData(){
    displayParameterTable(getParameterList());
}

displayParameterTable(getParameterList());


