// -------------------------------------------------------------------------------- //
// ---------------------------------- heatmap.js ---------------------------------- //
// -------------------------------------------------------------------------------- //

// heatmap.js file used to handle all the operations required in heatmap.html 

// Initialization variables for handling maps
var map, heatmap;
var heatmapAboveRange, heatmapBelowRange, heatmapInRange;
var dataAboveRange = [];
var dataBelowRange = []
var dataInRange = [];

// Declaring the color range for Red, Yellow and Green Color used to plot on heatmap
var yellowRGBA = [
    'rgba(255, 255, 0, 0)',
    'rgba(255, 255, 0, 1)'
];

var redRGBA = [
    'rgba(255, 0, 0, 0)',
    'rgba(255, 0, 0, 1)'
];

var greenRGBA = [
    'rgba(0, 255, 0, 0)',
    'rgba(0, 255, 0, 1)'
];

var zonePolygon = [];
let dataMarkers = [];
let markers = [];

//Initialization variables related to the UI
var census_min = document.getElementById('census-min');
var census_max = document.getElementById('census-max');
var param_recommend_panel = document.getElementById('param-recommend-content');

var parameters_selector = document.getElementById('attribute-control');
var centering_selector = document.getElementById('centering-control');
var sampling_date_selector = document.getElementById('sampling-date-control');
var zoning_selector = document.getElementById('zoning-control');
var sample_value_selector = document.getElementById('sample-value-control');

var controlDiv = document.getElementById('floating-panel');
var info_floating_panel = document.getElementById('info-floating-panel');
var param_floating_panel = document.getElementById("param-floating-panel");
var legend = document.getElementById("legend");

info_floating_panel.style.display = "none";

// Initialization variables related to Firebase realtime database
var firebase_db = firebase.database();
var sample_dbRef = firebase_db.ref().child('sampling_data');
var param_dbRef = firebase_db.ref().child('parameters');

var data = [];
var csv = 'Order,sampleId,location,latitude,longitude,collectedDate,pH,NO3,K,EC,Ca\n';

//  Initialize map 
function initMap() {
    // Initializat the map with the given parameters
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: { lat: 6.6779094, lng: 100.4396873 },
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.LEFT_BOTTOM
        }
    });

    // Adding the blocks onto different sides of the map layout
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(controlDiv);
    controlDiv.style.display = "block";
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(info_floating_panel);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(param_floating_panel);
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(legend);

    // Addingt the listener to the map in case of the zoom level has been adjusted
    map.addListener('zoom_changed', function() {
        console.log("Zoom Level: " + map.getZoom());
        controlDataMarkerVisibility();
    });

    // Initialize the Heatmap Layer to stack over the map that was initialized earlier
    heatmap = new google.maps.visualization.HeatmapLayer({ data: [], map: map, radius: 20 });

    // Initialize the heatmap layer with value above the average
    heatmapAboveRange = new google.maps.visualization.HeatmapLayer({
        data: dataAboveRange,
        map: map,
        radius: 20
    });

    // Initialize the heatmap layer with value in between the average
    heatmapInRange = new google.maps.visualization.HeatmapLayer({
        data: dataInRange,
        map: map,
        radius: 20
    });

    // Initialize the heatmap layer with value below the average
    heatmapBelowRange = new google.maps.visualization.HeatmapLayer({
        data: dataBelowRange,
        map: map,
        radius: 20
    });

    // Set the gradient from the xxxRGBA corresponding to each heatmap layer
    // Above Average : green
    // In Range : Yellow
    // Below Average : Red
    heatmapAboveRange.set('gradient', heatmapAboveRange.get('gradient') ? null : greenRGBA);
    heatmapInRange.set('gradient', heatmapInRange.get('gradient') ? null : yellowRGBA);
    heatmapBelowRange.set('gradient', heatmapBelowRange.get('gradient') ? null : redRGBA);

    // changeGradient();
    getZoningCoordinates();

    // Setup the date to sampling date dropdown menu
    getDistinctDate();

    displayLocationList();
    //  Eventlistener to zoning
    zoning_selector.addEventListener("change", function() {
        console.log("Zoning change is triggered");
        handleZoning();
    });

    //  Eventlistener to parameters
    parameters_selector.addEventListener("change", function() {
        selected_param = parameters_selector.options[parameters_selector.selectedIndex];
        selected_date = sampling_date_selector.options[sampling_date_selector.selectedIndex];
        selected_center = centering_selector.options[centering_selector.selectedIndex];
        console.log("Parameter change is triggered");
        switch (selected_param.value) {
            case 'pH':
                displayParamByDate(selected_date.value, selected_param.value);
                setParamRecommendContent("ค่าpH ที่เหมาะสมควรอยู่ที่ <br> 4.5 - 5.5");
                break
            case 'EC':
                displayParamByDate(selected_date.value, selected_param.value);
                setParamRecommendContent("ค่าEC ที่เหมาะสมควรอยู่ที่ <br> 25 (µs/cm) - 50 (µs/cm)");
                break;
            case 'NO3':
                displayParamByDate(selected_date.value, selected_param.value);
                setParamRecommendContent("ค่าไนโตรเจน ที่เหมาะสมควรอยู่ที่ <br> 50 PPM - 200 PPM");
                break;
            case 'Ca':
                displayParamByDate(selected_date.value, selected_param.value);
                setParamRecommendContent("ค่าแคลเซียม ที่เหมาะสมควรอยู่ที่ <br> > 0.3 PPM");
                break;
            case 'K':
                displayParamByDate(selected_date.value, selected_param.value);
                setParamRecommendContent("ค่าโพแทสเซียม ที่เหมาะสมควรอยู่ที่ <br> > 40 PPM");
                break;
            case 'None':
                displayParamByDate(selected_date.value, selected_param.value);
                setParamRecommendContent("กรุณาเลือกค่าที่ต้องการแสดงผล");
                break;
        }

        console.log(selected_param.value + " " + selected_center.value + " " + selected_date.value);
        getSamplesByLocationAndDate(selected_center.value, selected_date.value);
    }, false);

    //  Eventlistening to centering
    centering_selector.addEventListener("change", function() {
        console.log("Centering change is triggered");
        selected_center = centering_selector.options[centering_selector.selectedIndex];
        selected_param = parameters_selector.options[parameters_selector.selectedIndex];
        selected_date = sampling_date_selector.options[sampling_date_selector.selectedIndex];
        switch (selected_center.value) {
            case 'sadao':
                map.setCenter(new google.maps.LatLng({ lat: 6.6779094, lng: 100.4396873 }));
                break;
            case 'chalung':
                map.setCenter(new google.maps.LatLng({ lat: 6.9824032, lng: 100.2744747 }));
                break;
        }
        console.log(selected_param.value + " " + selected_center.value + " " + selected_date.value);
        getSamplesByLocationAndDate(selected_center.value, selected_date.value);
    }, false);

    // Eventlistener to sampling date
    sampling_date_selector.addEventListener("change", function() {
        selected_param = parameters_selector.options[parameters_selector.selectedIndex];
        selected_date = sampling_date_selector.options[sampling_date_selector.selectedIndex];
        selected_center = centering_selector.options[centering_selector.selectedIndex];
        console.log("Sampling date change is triggered");
        console.log(selected_param.value + " " + selected_center.value + " " + selected_date.value);
        displayParamByDate(selected_date.value, selected_param.value);
        getSamplesByLocationAndDate(selected_center.value, selected_date.value);
    });

    // Add the EventListener to handle the state on changing the parameters
    sample_value_selector.addEventListener("change", function() {
        handleDataDisplay();
    });
}

// Handle information to display the information floating panel
function handleInformation() {
    if (info_floating_panel.style.display === "none") {
        info_floating_panel.style.display = "block";
    } else {
        info_floating_panel.style.display = "none";
    }
}

// Helper function to set the visibility of the marker
function handleDataDisplay() {
    selected_sample_value = sample_value_selector.options[sample_value_selector.selectedIndex];
    switch (selected_sample_value.value) {
        case 'Enabled':
            controlDataMarkerVisibility();
            break;
        case 'Disabled':
            hideDataMarkers();
            break;
    }
}

// Function used to toggle the visibility of the zone on the map
function handleZoning() {
    selected_zoning = zoning_selector.options[zoning_selector.selectedIndex];
    switch (selected_zoning.value) {
        case 'Enabled':
            zonePolygon.forEach(function(polygons) {
                polygons.setVisible(true);
                showMarkers();
            });
            break;
        case 'Disabled':
            zonePolygon.forEach(function(polygons) {
                polygons.setVisible(false);
                clearMarkers();
            });
            break;
    }
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

// Function handling the sampling date dropdown menu
async function getDistinctDate() {
    var res = await getDateList();
    let unique = [...new Set(res)];
    console.log(unique);
    for (i = 0; i < unique.length; i++) {
        var option = document.createElement("option");
        option.text = unique[i];
        sampling_date_selector.add(option);
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

// Function used to display all of the dates that the sample has been recorded
async function displayLocationList() {
    var res = await getLocationList();
    let unique = [...new Set(res)];
    console.log(unique);
    for (i = 0; i < unique.length; i++) {
        var option = document.createElement("option");
        option.text = unique[i];
        centering_selector.add(option);
    }
}

// Function used to get the list of all sampples and assign to rows
async function getSamplesByLocationAndDate(location, date) {
    csv = 'Order,sampleId,location,latitude,longitude,collectedDate,pH,NO3,K,EC,Ca\n';
    let order = 0;
    data = [];
    return sample_dbRef.once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var childVal = childSnapshot.val();
            var sample_name = childSnapshot.key;
            var sample_location = childVal.location;
            var sample_latitude = parseFloat(childVal.latitude);
            var sample_longitude = parseFloat(childVal.longitude);
            var sample_collected_date = childVal.collectedDate;
            var sample_pH = parseFloat(childVal.pH);
            var sample_NO3 = parseFloat(childVal.NO3);
            var sample_K = parseFloat(childVal.K);
            var sample_EC = parseFloat(childVal.EC);
            var sample_Ca = parseFloat(childVal.Ca);
            if ((location === "Default" || sample_location === location) && (date === "any" || sample_collected_date === date)) {
                order = order + 1;
                let row = [order, sample_name, sample_location, sample_latitude, sample_longitude, sample_collected_date, sample_pH, sample_NO3, sample_K, sample_EC, sample_Ca];
                data.push(row);
            }
        });
        return data;
    });
}

// Function to query the parameter by name
async function getParameterByName(PARAM) {
    return await firebase.database().ref(`parameters/${PARAM}`).once('value');
}

//  Function used to display parameters with respect to date
async function displayParamByDate(date, paramName) {
    clearHeatmapData();
    clearDataMarkers();
    console.log("Data has been cleared");
    let paramRef = await getParameterByName(paramName);
    let paramMin = paramRef.child("min").val();
    let paramMax = paramRef.child("max").val();

    sample_dbRef.once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            // Display by specific date
            if (childSnapshot.val().collectedDate === date || date === 'any') {
                var lat = parseFloat(childSnapshot.val().latitude);
                var lng = parseFloat(childSnapshot.val().longitude);
                var coordinate = new google.maps.LatLng({ lat: lat, lng: lng });
                if (!childSnapshot.child(paramName).exists()) {
                    clearHeatmapData();
                    clearDataMarkers();
                } else {
                    var paramVal = parseFloat(childSnapshot.child(paramName).val());
                    if (paramVal >= paramMin && paramVal <= paramMax) {
                        console.log("In range has been added");
                        heatmapInRange.getData().push(coordinate);
                    } else if (paramVal < paramMin) {
                        console.log("Below has been added");
                        heatmapBelowRange.getData().push(coordinate);
                    } else {
                        console.log("Above has been added");
                        heatmapAboveRange.getData().push(coordinate);
                    }
                    addDataMarker(coordinate, map, paramVal.toString());
                    controlDataMarkerVisibility();

                    // var coorWithParamVal = {location:coordinate, weight: paramVal};
                    //heatmap.getData().push(coorWithParamVal);
                }

            }
        });
    });
    setCensusMax(paramMax);
    setCensusMin(paramMin);
}

// Function which clear all the data on the map
function clearHeatmapData() {
    heatmapInRange.setData([]);
    heatmapAboveRange.setData([]);
    heatmapBelowRange.setData([]);
}

//  Set the value of the census max
function setCensusMax(max_num) {
    census_max.innerHTML = max_num;
}

//  Set the value of the census min
function setCensusMin(min_num) {
    census_min.innerHTML = min_num;
}

//  Set the content of recommendation floating panel
function setParamRecommendContent(content) {
    console.log("content: " + content);
    param_recommend_panel.innerHTML = content;
}

// Function used to get the maximum value corresponding to each param
function getMaxAttr(attr) {
    switch (attr) {
        case 'pH':
            sample_dbRef.orderByChild('pH').limitToLast(1).on("child_added", function(snapshot) {
                var max_attr = snapshot.val().pH;
                console.log(max_attr);
                setCensusMax(max_attr);
            });
            break;
        case 'NO3':
            sample_dbRef.orderByChild('NO3').limitToLast(1).on("child_added", function(snapshot) {
                var max_attr = snapshot.val().NO3;
                console.log(max_attr);
                setCensusMax(max_attr);
            });
            break;
        case 'K':
            sample_dbRef.orderByChild('K').limitToLast(1).on("child_added", function(snapshot) {
                var max_attr = snapshot.val().K;
                console.log(max_attr);
                setCensusMax(max_attr);
            });
            break;
        case 'EC':
            sample_dbRef.orderByChild('EC').limitToLast(1).on("child_added", function(snapshot) {
                var max_attr = snapshot.val().EC;
                console.log(max_attr);
                setCensusMax(max_attr);
            });
            break;
        case 'Ca':
            sample_dbRef.orderByChild('Ca').limitToLast(1).on("child_added", function(snapshot) {
                var max_attr = snapshot.val().Ca;
                console.log(max_attr);
                setCensusMax(max_attr);
            });
            break;
    }
}

// Function used to get the minimum value corresponding to each param
function getMinAttr(attr) {
    switch (attr) {
        case 'pH':
            sample_dbRef.orderByChild('pH').limitToFirst(1).on("child_added", function(snapshot) {
                var min_attr = snapshot.val().pH;
                console.log(min_attr);
                setCensusMin(min_attr);
            });
            break;
        case 'NO3':
            sample_dbRef.orderByChild('NO3').limitToFirst(1).on("child_added", function(snapshot) {
                var min_attr = snapshot.val().NO3;
                console.log(min_attr);
                setCensusMin(min_attr);
            });
            break;
        case 'K':
            sample_dbRef.orderByChild('K').limitToFirst(1).on("child_added", function(snapshot) {
                var min_attr = snapshot.val().K;
                console.log(min_attr);
                setCensusMin(min_attr);
            });
            break;
        case 'EC':
            sample_dbRef.orderByChild('EC').limitToFirst(1).on("child_added", function(snapshot) {
                var min_attr = snapshot.val().EC;
                console.log(min_attr);
                setCensusMin(min_attr);
            });
            break;
        case 'Ca':
            sample_dbRef.orderByChild('Ca').limitToFirst(1).on("child_added", function(snapshot) {
                var min_attr = snapshot.val().Ca;
                console.log(min_attr);
                setCensusMin(min_attr);
            });
            break;
    }
}

// Helper to download the data as Excel file
function downloadAsExcel() {
    console.log(data);
    var today = new Date();
    var download_date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var download_time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    selected_date = sampling_date_selector.options[sampling_date_selector.selectedIndex];
    selected_center = centering_selector.options[centering_selector.selectedIndex];

    data.forEach(function(row) {
        csv += row.join(',');
        csv += "\n";
    });

    console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = selected_center.value + '-' + selected_date.value + "-loadat-" + download_date + "-" + download_time + '.csv';
    hiddenElement.click();
}

// Get the zoning coordinates specified in the file sadao_zone.csv
function getZoningCoordinates() {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://us-central1-sadao-f4a1e.cloudfunctions.net/zoningMap', true);
    console.log("getZoningCoordinates is invoked");
    request.onload = function() {
        var data = JSON.parse(this.response);
        if (request.status >= 200 && request.status < 400) {
            data.forEach(coordinates => {
                var coor_arr = Object.values(coordinates);
                var zoneCoords = [];
                for (i = 1; i < coor_arr.length; i += 2) {
                    if (coor_arr[i] !== "") {
                        zoneCoords.push({ lat: parseFloat(coor_arr[i]), lng: parseFloat(coor_arr[i + 1]) });
                    }
                }
                var newPolygon = new google.maps.Polygon({
                    paths: zoneCoords,
                    strokeColor: '#ADD8E6',
                    strokeOpacity: 1.0,
                    strokeWeight: 1.0,
                    fillColor: '#ADD8E6',
                    fillOpacity: 0.00
                });
                addMarkerAsLabel(centerPolygon(zoneCoords), map, coor_arr[0]);
                zonePolygon.push(newPolygon);
                newPolygon.setMap(map);
            });
        } else {
            console.log('error');
        }
    }
    request.send();
}

// Function to add the data marker to the map
function addDataMarker(position, map, t) {
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        label: t,
        draggable: false,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0
        }
    });

    // marker.addListener("click", () => {
    //   if(map.getZoom() >= 16){
    //     console.log("marker cursor on");
    //     marker.setVisible(true);
    //   }
    //   else{
    //     marker.setVisible(false);
    //   }
    // });
    // marker.addListener("mouseout", () => {
    //   marker.setVisible(false);
    // });

    dataMarkers.push(marker);
}

// Function to control the data marker visibility
function controlDataMarkerVisibility() {
    // dataMarkers[i].addListener("mouseover", () => {
    //   if(map.getZoom() >= 16){
    //     console.log("marker cursor on");
    //     dataMarkers[i].setVisible(true);
    //   }
    //   else{
    //     dataMarkers[i].setVisible(false);
    //   }
    // });

    // dataMarkers[i].addListener("mouseout", () => {
    //   dataMarkers[i].setVisible(false);
    // });

    if (map.getZoom() >= 16) {
        showDataMarkers();
    } else {
        hideDataMarkers();
    }
}

function hideDataMarkers() {
    for (var i = 0; i < dataMarkers.length; i++) {
        dataMarkers[i].setVisible(false);
    }
}

function showDataMarkers() {
    for (var i = 0; i < dataMarkers.length; i++) {
        dataMarkers[i].setVisible(true);
    }
}

function clearDataMarkers() {
    for (let i = 0; i < dataMarkers.length; i++) {
        dataMarkers[i].setMap(null);
    }
    dataMarkers = [];
}

// Function to replace the marker as the text label
function addMarkerAsLabel(position, map, t) {
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        label: t,
        draggable: false,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0
        }
    });

    // google.maps.event.addListener(marker, "mouseover",
    //  function (e) {
    //     console.log("Mouse Over " + marker.label); 
    //   });

    // google.maps.event.addListener(marker, "mouseout",
    //  function (e) {
    //     console.log("Mouse Out " + marker.label); 
    //   });

    markers.push(marker);
}

// Function to compute the center of the polygon of particular zone
function centerPolygon(coords) {
    var bounds = new google.maps.LatLngBounds();
    var i;
    for (i = 0; i < coords.length; i++) {
        bounds.extend(coords[i]);
    }
    return bounds.getCenter();
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}

// Function to toggle the heatmap
function toggleHeatmap() {
    heatmap.setMap(heatmap.getMap() ? null : map);
}

function changeGradient() {
    var gradient = [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
    ]
    heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
}

function changeRadius() {
    heatmap.set('radius', heatmap.get('radius') ? null : 20);
}

function changeOpacity() {
    heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
}