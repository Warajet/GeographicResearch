var samples_table = document.getElementById("sample_table");
var sample_date_control = document.getElementById("date-control");
var sample_zone_control = document.getElementById("zoning-control");
let form = document.getElementById("submit-raw-sample-form");

var date_list = [];
var location_list = [];
var selected_date;
var selected_zone;
var data = [];
var sample_list = [];
const SAMPLE_START = 0;
const SAMPLE_PER_PAGE = 30;

// Variables related to Firebase realtime database
var firebase_db = firebase.firestore();
const SAMPLES = "samples";
var sample_dbRef = firebase_db.collection(SAMPLES);

$("#modal-btn-add").on("click", () => {
  // eslint-disable-next-line no-alert
  alert("Raw sample has been modified");
  $("#sampleTestModal").modal('hide');
  // $(document).off('focusin.modal');
});


async function filterByDateAndZone(date, zone){
  sample_list = [];
  console.log(date);
  var initial_date = new Date(date);
  var initial_date_milli = initial_date.getTime();

  var final_date = new Date(date);
  final_date.setDate(final_date.getDate() + 1);
  var final_date_milli = final_date.getTime();

  if(date === "any"){
    initial_date = new Date(1000);
    initial_date_milli = initial_date.getTime();

    final_date = new Date();
    final_date_milli = final_date.getTime();
  }
  if(zone==="any"){
    return sample_dbRef.where("collectedDate",">=", initial_date).where("collectedDate", "<", final_date).get()
    .then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
          console.log(childSnapshot.data());
          sample_list.push(childSnapshot);
      });
      return sample_list;
    });
  }
  else{
    return sample_dbRef.where("collectedDate",">=", initial_date)
    .where("collectedDate", "<", final_date)
    .where('field','==', zone).get()
    .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
        console.log(childSnapshot.data());
        sample_list.push(childSnapshot);
    });
    return sample_list;
  });
  }
 
}

sample_zone_control.addEventListener('change', function(){
  var selected_date = sample_date_control.options[sample_date_control.selectedIndex];
  var selected_zone = sample_zone_control.options[sample_zone_control.selectedIndex];
  displaySampleTable(filterByDateAndZone(selected_date.value, selected_zone.value));
});

sample_date_control.addEventListener('change',function(){
  var selected_date = sample_date_control.options[sample_date_control.selectedIndex];
  var selected_zone = sample_zone_control.options[sample_zone_control.selectedIndex];
  displaySampleTable(filterByDateAndZone(selected_date.value, selected_zone.value));
});


async function displaySampleTable(sample){
    sample_list = [];
    $("#sample_table tbody").empty();
    document.getElementById("text-start").innerHTML= SAMPLE_START;
    document.getElementById("text-end").innerHTML= SAMPLE_PER_PAGE;
    var sample_list = await sample;
    console.log(sample_list);
    for(i = 0; i < sample_list.length; i++){
        var tableRef = samples_table.getElementsByTagName('tbody')[0];

        // Insert a row in the table at the last row
        var newRow   = tableRef.insertRow();

        // Insert a cell in the row at index 0
        var node_id_cell  = newRow.insertCell(0);
        var field_cell  = newRow.insertCell(1);
        var latitude_cell  = newRow.insertCell(2);
        var longitude_cell  = newRow.insertCell(3);
        var date_cell  = newRow.insertCell(4);
        var ph_cell  = newRow.insertCell(5);
       
        var ec_cell  = newRow.insertCell(6);
        
        var edit_cell = newRow.insertCell(7);
        var delete_cell = newRow.insertCell(8);

        // Append a text node to the cell
        var sample_data = sample_list[i].data();
        var sample_key  = document.createTextNode(sample_data.sampleNumber);
        var sample_collected_date = sample_data.collectedDate.toDate();

        node_id_cell.appendChild(sample_key);
        field_cell.appendChild(document.createTextNode(sample_data.sampleName));
        latitude_cell.appendChild(document.createTextNode(sample_data.ownerId));
        longitude_cell.appendChild(document.createTextNode(sample_data.field));
        date_cell.appendChild(document.createTextNode(sample_data.latitude));
        ph_cell.appendChild(document.createTextNode(sample_data.longitude));
        ec_cell.appendChild(document.createTextNode(formatDate(sample_collected_date)));

        var save_btn = createButton("Save","save"+ sample_data.sampleNumber);
        save_btn.style.display = "none";
        edit_cell.appendChild(createButton("Test", "test"+sample_data.sampleNumber));
        edit_cell.appendChild(save_btn);
        delete_cell.appendChild(createButton("Delete", "del"+sample_data.sampleNumber));
    }
    document.getElementById("text-start").innerHTML= SAMPLE_START;
    var size_li = $("#sample_table tbody tr").length;
    var end = SAMPLE_PER_PAGE;
    document.getElementById("text-total").innerHTML= "Total: " + size_li;
    if(size_li < end){
      document.getElementById("text-end").innerHTML= size_li;
      end  = size_li;
    }
    displaySliceOfTableList(SAMPLE_START, end);

    adjustList();
}
function displaySliceOfTableList(start, end){
    $("#sample_table tbody tr").hide();
    $("#sample_table tbody tr").slice(start, end).show();
}

function adjustList(){
  var start = SAMPLE_START;
  var end = SAMPLE_PER_PAGE;
  size_li = $("#sample_table tbody tr").length;
  document.getElementById("text-total").innerHTML= "Total: " + size_li;
  $('#previous-btn').click(function () {
     if(start >0)
     {
         $("#sample_table tbody tr").hide();
         start = start - SAMPLE_PER_PAGE;
         end = end - SAMPLE_PER_PAGE;
         displaySliceOfTableList(start, end);
         document.getElementById("text-start").innerHTML= start;
         document.getElementById("text-end").innerHTML= end;
     }
  });
  
  $('#next-btn').click(function () {
     if(end < size_li)
     {
         $("#sample_table tbody tr").hide();
         start = start + SAMPLE_PER_PAGE;
         end = end + SAMPLE_PER_PAGE;
         displaySliceOfTableList(start, end);
         document.getElementById("text-start").innerHTML= start;
         if(end + SAMPLE_PER_PAGE > size_li){
          document.getElementById("text-end").innerHTML= size_li;
         }else{
          document.getElementById("text-end").innerHTML= end;
         }
     }
  });
}


function createButton(button_label, id){
  var button = document.createElement("button");
  button.id = id;
  button.innerText = button_label;

  switch(button_label){
    case "Test":
      button.className = "btn btn-info ";
      break;
    case "Delete":
      button.className = "btn btn-danger";
      break;
  }

  button.addEventListener("click", function(){
    switch(button_label){
      case "Delete":
        deleteCell(button);
        break;
      case "Test":
        editCell(button);
        break;
    }
  });
  return button;
}

function deleteCell(button){
  var activeRow = button.parentNode.parentNode.rowIndex;
  var tab = samples_table.rows[activeRow];
  let sample_id_td =  tab.getElementsByTagName("td")[1].innerText
  console.log(sample_id_td);
  deleteData(sample_id_td);
}

function editCell(button){
  var activeRow = button.parentNode.parentNode.rowIndex;
  var tab = samples_table.rows[activeRow];
  var columns = tab.getElementsByTagName("td").length;
  console.log("Edit Cell function is triggered");
  $('#sampleTestModal').modal('show');

  $('#sampleId').val(tab.getElementsByTagName("td")[1].innerText);
  $('#collectedDate').val(tab.getElementsByTagName("td")[6].innerText);
  $('#field').val(tab.getElementsByTagName("td")[3].innerText);
  $('#latitude').val(tab.getElementsByTagName("td")[4].innerText);
  $('#longitude').val(tab.getElementsByTagName("td")[5].innerText);
}

function deleteData(sample_id){
  var xhr = new XMLHttpRequest();
  var url = "/samples/raw/"+sample_id;
  var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  xhr.open("DELETE", url, true);
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.setRequestHeader("X-CSRF-TOKEN", token);
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4 && xhr.status === 200){
      // var json = JSON.parse(xhr.responseText);
      // eslint-disable-next-line no-alert
      alert("The sample" + sample_id + " has been deleted");
      reloadData();
    }
  };
  xhr.send();
}

form.addEventListener("submit", function(event) {
  event.preventDefault();
  var formData = new FormData(form);

  var object = {};
  formData.forEach(function(value, key){
    object[key] = value;
  });
  var json = JSON.stringify(object);

  console.log(json);

  addSample(json);

});

function addSample(sample_info){
  var xhr = new XMLHttpRequest();

  // Set up our request
  xhr.open( "POST", "/samples/raw", true );
  var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.setRequestHeader("X-CSRF-TOKEN", token);
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4 && xhr.status === 200){
      // var json = JSON.parse(xhr.responseText);
      reloadData();
    }
  };
  console.log(sample_info);
   // The data sent is what the user provided in the form
  xhr.send(sample_info);

}

function reloadData(){
    var selected_date = sample_date_control.options[sample_date_control.selectedIndex].value;
    var selected_zone = sample_zone_control.options[sample_zone_control.selectedIndex].value;
    getDistinctDate();
    displayLocationList();
    displaySampleTable(filterByDateAndZone(selected_date, selected_zone));     // REFRESH THE TABLE
}

  // Get the collectedDate of each sample
  async function getDateList(){
    date_list = [];
    return sample_dbRef.get().then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var date = childSnapshot.data().collectedDate;
          date_list.push(formatDate(date.toDate()));
        });
        return date_list;
      });
  }

  function removeOptions(selectElement){
    var i, len = selectElement.options.length - 1;
    for(i = len; i >= 0; i--){
      selectElement.remove(i);
    }
  }
    // Function handling the sampling date dropdown menu
    async function getDistinctDate(){
      var res = await getDateList();
      removeOptions(sample_date_control);
      var option = document.createElement("option");
      option.text = "any";
      sample_date_control.add(option);
      let unique = [...new Set(res)];
      for(i = 0 ; i < unique.length; i++){
        option = document.createElement("option");
        option.text = unique[i];
        sample_date_control.add(option);
      }
    }

  
  
    // Get the collectedDate of each sample
    async function getLocationList(){
      location_list = [];
      return sample_dbRef.get().then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            var location = childSnapshot.data().field;
            location_list.push(location);
          });
          return location_list;
        });
    }

    async function displayLocationList(){
      var res = await getLocationList();
      removeOptions(sample_zone_control);
      var option = document.createElement("option");
      option.text = "any";
      sample_zone_control.add(option);
      let unique = [...new Set(res)];
      console.log(unique);
      for(i = 0 ; i < unique.length; i++){
        option = document.createElement("option");
        option.text = unique[i];
        sample_zone_control.add(option);
      }
    }
    
  function formatDate(sample_collected_date){
    var formatted_collected_date = "";
    var sample_collected_month = "";
    var sample_collected_day = "";
    if(sample_collected_date.getMonth()+1 < 10 && sample_collected_date >= 1){
        sample_collected_month = "0" + (sample_collected_date.getMonth()+1)
    }
    else{
        sample_collected_month = (sample_collected_date.getMonth()+1)+"";
    }
    if(sample_collected_date.getDate() >= 1 && sample_collected_date.getDate() < 10){
        sample_collected_day = "0" + sample_collected_date.getDate();
    }
    else{
        sample_collected_day = sample_collected_date.getDate();
    }

    formatted_collected_date = sample_collected_date.getFullYear() + "-" + sample_collected_month + "-" + sample_collected_day;
    
    return formatted_collected_date;
  }


getDistinctDate();
displayLocationList();
displaySampleTable(filterByDateAndZone("any","any"));