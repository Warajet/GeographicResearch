// -------------------------------------------------------------------------------- //
// ---------------------------------- admin.js ------------------------------------ //
// -------------------------------------------------------------------------------- //

// admin.js file used to handle all the operations required in admin.html 
// Declare all references to the document elements within view
var samples_table = document.getElementById("sample_table");
var sample_date_control = document.getElementById("date-control");
var sample_zone_control = document.getElementById("zoning-control");
let form = document.getElementById("submit-data-form");

// Declare all the required variables
var date_list = [];
var location_list = [];
var selected_date;
var selected_zone;
var data = [];
var sample_list = [];

// Variables related to Firebase realtime database
var firebase_db = firebase.database();
var sample_dbRef = firebase_db.ref().child('sampling_data');

// declare the constant
const SAMPLE_START = 0;
const SAMPLE_PER_PAGE = 30;

// Handling the operation after clicking Add Button
$("#modal-btn-add").on("click", () => {
    alert("New sample has been added");
    $("#insertionModal").modal('hide');
});

// Function used to handle the operation to filter list of samples based on Date and Zone
async function filterByDateAndZone(date, zone) {
    sample_list = [];
    return sample_dbRef.once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childVal = childSnapshot.val();
            var sample_location = childVal.location;
            var sample_collected_date = childVal.collectedDate;
            if ((sample_location === zone || zone === "any") && (sample_collected_date === date || date === "any")) {
                sample_list.push(childSnapshot);
            }
        });
        return sample_list;
    });
}

// Adding EventListener to all components used for filtering
sample_zone_control.addEventListener('change', function() {
    var selected_date = sample_date_control.options[sample_date_control.selectedIndex];
    var selected_zone = sample_zone_control.options[sample_zone_control.selectedIndex];
    displaySampleTable(filterByDateAndZone(selected_date.value, selected_zone.value));
});

sample_date_control.addEventListener('change', function() {
    var selected_date = sample_date_control.options[sample_date_control.selectedIndex];
    var selected_zone = sample_zone_control.options[sample_zone_control.selectedIndex];
    displaySampleTable(filterByDateAndZone(selected_date.value, selected_zone.value));
});

// Adding EventListener for adding new sample to the system
form.addEventListener("submit", function(event) {
    event.preventDefault();
    var formData = new FormData(form);

    var object = {};
    formData.forEach(function(value, key) {
        object[key] = value;
    });
    var json = JSON.stringify(object);

    console.log(json);

    addSample(json);

});

// Function used to display samples onto the table in the view
async function displaySampleTable(sample) {
    sample_list = [];
    $("#sample_table tbody").empty();
    document.getElementById("text-start").innerHTML = SAMPLE_START;
    document.getElementById("text-end").innerHTML = SAMPLE_PER_PAGE;
    var sample_list = await sample;
    for (i = 0; i < sample_list.length; i++) {
        var tableRef = samples_table.getElementsByTagName('tbody')[0];

        // Insert a row in the table at the last row
        var newRow = tableRef.insertRow();

        // Insert a cell in the row at index 0
        var node_id_cell = newRow.insertCell(0);
        var field_cell = newRow.insertCell(1);
        var latitude_cell = newRow.insertCell(2);
        var longitude_cell = newRow.insertCell(3);
        var date_cell = newRow.insertCell(4);
        var ph_cell = newRow.insertCell(5);
        var ec_cell = newRow.insertCell(6);
        var no3_cell = newRow.insertCell(7);
        var ca_cell = newRow.insertCell(8);
        var k_cell = newRow.insertCell(9);
        var edit_cell = newRow.insertCell(10);
        var delete_cell = newRow.insertCell(11);

        // Append a text node to the cell --> Adding the text to all attributes
        var sample_key = document.createTextNode(sample_list[i].key);
        var sample_val = sample_list[i].val();

        node_id_cell.appendChild(sample_key);
        field_cell.appendChild(document.createTextNode(sample_val.location));
        latitude_cell.appendChild(document.createTextNode(sample_val.latitude));
        longitude_cell.appendChild(document.createTextNode(sample_val.longitude));
        date_cell.appendChild(document.createTextNode(sample_val.collectedDate));
        ph_cell.appendChild(document.createTextNode(sample_val.pH));
        ec_cell.appendChild(document.createTextNode(sample_val.EC));
        no3_cell.appendChild(document.createTextNode(sample_val.NO3));
        ca_cell.appendChild(document.createTextNode(sample_val.Ca));
        k_cell.appendChild(document.createTextNode(sample_val.K));

        // Insert Save, Edit, and Delete Buttons to each row(sample) in the table
        var save_btn = createButton("Save", "save" + sample_list[i].key);
        save_btn.style.display = "none";
        edit_cell.appendChild(createButton("Edit", "edit" + sample_list[i].key));
        edit_cell.appendChild(save_btn);
        delete_cell.appendChild(createButton("Delete", "del" + sample_list[i].key));
    }
    // Display n samples in each page to prevent too long scrolling
    document.getElementById("text-start").innerHTML = SAMPLE_START;
    var size_li = $("#sample_table tbody tr").length;
    var end = SAMPLE_PER_PAGE;
    document.getElementById("text-total").innerHTML = "Total: " + size_li;
    if (size_li < end) {
        document.getElementById("text-end").innerHTML = size_li;
        end = size_li;
    }
    displaySliceOfTableList(SAMPLE_START, end);

    adjustList();
}

// Helper function used to handle the Slice of the table list --> Use to show n items per page
function displaySliceOfTableList(start, end) {
    $("#sample_table tbody tr").hide();
    $("#sample_table tbody tr").slice(start, end).show();
}

function adjustList() {
    var start = SAMPLE_START;
    var end = SAMPLE_PER_PAGE;
    size_li = $("#sample_table tbody tr").length;
    document.getElementById("text-total").innerHTML = "Total: " + size_li;
    // Handle state on Previous button
    $('#previous-btn').click(function() {
        if (start > 0) {
            $("#sample_table tbody tr").hide();
            start = start - SAMPLE_PER_PAGE;
            end = end - SAMPLE_PER_PAGE;
            displaySliceOfTableList(start, end);
            document.getElementById("text-start").innerHTML = start;
            document.getElementById("text-end").innerHTML = end;
        }
    });
    // Handle state on Next button
    $('#next-btn').click(function() {
        if (end < size_li) {
            $("#sample_table tbody tr").hide();
            start = start + SAMPLE_PER_PAGE;
            end = end + SAMPLE_PER_PAGE;
            displaySliceOfTableList(start, end);
            document.getElementById("text-start").innerHTML = start;
            if (end + SAMPLE_PER_PAGE > size_li) {
                document.getElementById("text-end").innerHTML = size_li;
            } else {
                document.getElementById("text-end").innerHTML = end;
            }
        }
    });
}


// Helper function to create buttons in this view + adding its EventListener to each one
function createButton(button_label, id) {
    var button = document.createElement("button");
    button.id = id;
    button.innerText = button_label;

    switch (button_label) {
        case "Edit":
            button.className = "btn btn-info ";
            break;
        case "Delete":
            button.className = "btn btn-danger";
            break;
        case "Save":
            button.className = "btn btn-success";
    }

    button.addEventListener("click", function() {
        switch (button_label) {
            case "Delete":
                deleteCell(button);
                break;
            case "Edit":
                editCell(button);
                break;
            case "Save":
                saveColumnChange(button);
        }
    });
    return button;
}

// Helper function used to delete a cell in the table
function deleteCell(button) {
    var activeRow = button.parentNode.parentNode.rowIndex;
    deleteData(sample_list[activeRow - 1].key);
}

// Helper function used to edit a cell in the table
function editCell(button) {
    var activeRow = button.parentNode.parentNode.rowIndex;
    var tab = samples_table.rows[activeRow];
    var columns = tab.getElementsByTagName("td").length;
    console.log("edit Cell: " + activeRow);
    for (i = 1; i < columns - 2; i++) {
        var td = tab.getElementsByTagName("td")[i];
        var ele = document.createElement("input");
        if (i === 4) {
            ele.setAttribute('type', 'date');
        } else {
            ele.setAttribute('type', 'text');
        }
        ele.setAttribute('value', td.innerText);
        td.innerText = '';
        td.appendChild(ele);
    }

    var save_btn = document.getElementById("save" + sample_list[activeRow - 1].key);
    save_btn.setAttribute('style', 'display:block;');
    // HIDE THIS BUTTON.
    button.setAttribute('style', 'display:none;');
}

// Helper function used to save changes after editing a cell in the table
function saveColumnChange(button) {
    var activeRow = button.parentNode.parentNode.rowIndex;
    var tab = samples_table.rows[activeRow];
    var columns = tab.getElementsByTagName("td").length;

    var sample_id_td = sample_list[activeRow - 1].key;
    var field_td = tab.getElementsByTagName("td")[1].childNodes[0].value;
    var lat_td = tab.getElementsByTagName("td")[2].childNodes[0].value;
    var lng_td = tab.getElementsByTagName("td")[3].childNodes[0].value;
    var date_td = tab.getElementsByTagName("td")[4].childNodes[0].value;
    var pH_td = tab.getElementsByTagName("td")[5].childNodes[0].value;
    var EC_td = tab.getElementsByTagName("td")[6].childNodes[0].value;
    var NO3_td = tab.getElementsByTagName("td")[7].childNodes[0].value;
    var Ca_td = tab.getElementsByTagName("td")[8].childNodes[0].value;
    var K_td = tab.getElementsByTagName("td")[9].childNodes[0].value;

    var sent_data = {
        sample_id: sample_id_td,
        location: field_td,
        latitude: parseFloat(lat_td),
        longitude: parseFloat(lng_td),
        collectedDate: date_td,
        pH: parseFloat(pH_td),
        EC: parseFloat(EC_td),
        NO3: parseFloat(NO3_td),
        Ca: parseFloat(Ca_td),
        K: parseFloat(K_td)
    };
    // Ajax framework used to perform HTTP POST request to update the sample
    var xhr = new XMLHttpRequest();
    var url = "/samples/" + sample_id_td;
    var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // var json = JSON.parse(xhr.responseText);
            reloadData();
        }
    };
    var data = JSON.stringify(sent_data);
    xhr.send(data);
}

// Helper function used to perform HTTP DELETE to delete a sample from the system
function deleteData(sample_id) {
    var xhr = new XMLHttpRequest();
    var url = "/samples/" + sample_id;
    var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            alert("The sample" + sample_id + " has been deleted");
            reloadData();
        }
    };
    xhr.send();
}
// Helper function used to perform HTTP POST to add a sample into the system
function addSample(sample_info) {
    var xhr = new XMLHttpRequest();

    // Set up our request
    xhr.open("POST", "/samples", true);
    var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // var json = JSON.parse(xhr.responseText);
            reloadData();
        }
    };
    // The data sent is what the user provided in the form
    xhr.send(sample_info);

}

// Helper function to reload the samples in the system
function reloadData() {
    var selected_date = sample_date_control.options[sample_date_control.selectedIndex].value;
    var selected_zone = sample_zone_control.options[sample_zone_control.selectedIndex].value;
    getDistinctDate();
    displayLocationList();
    displaySampleTable(filterByDateAndZone(selected_date, selected_zone)); // REFRESH THE TABLE
}

// Get the collectedDate of each sample
async function getDateList() {
    date_list = [];
    return sample_dbRef.once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var date = childSnapshot.val().collectedDate;
            date_list.push(date);
        });
        return date_list;
    });
}

// Function used to remove options in the view
function removeOptions(selectElement) {
    var i, len = selectElement.options.length - 1;
    for (i = len; i >= 0; i--) {
        selectElement.remove(i);
    }
}
// Function handling the sampling date dropdown menu
async function getDistinctDate() {
    var res = await getDateList();
    removeOptions(sample_date_control);
    var option = document.createElement("option");
    option.text = "any";
    sample_date_control.add(option);
    let unique = [...new Set(res)];
    for (i = 0; i < unique.length; i++) {
        option = document.createElement("option");
        option.text = unique[i];
        sample_date_control.add(option);
    }
}



// Get the collectedDate of each sample
async function getLocationList() {
    location_list = [];
    return sample_dbRef.once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var date = childSnapshot.val().location;
            location_list.push(date);
        });
        return location_list;
    });
}

// Helper function to display the availble location list in the location filter
async function displayLocationList() {
    var res = await getLocationList();
    removeOptions(sample_zone_control);
    var option = document.createElement("option");
    option.text = "any";
    sample_zone_control.add(option);
    let unique = [...new Set(res)];
    console.log(unique);
    for (i = 0; i < unique.length; i++) {
        option = document.createElement("option");
        option.text = unique[i];
        sample_zone_control.add(option);
    }
}

// Helper function used for initialization of the system to display the view
getDistinctDate();
displayLocationList();
displaySampleTable(filterByDateAndZone("any", "any"));