var map, heatmap;

var census_min = document.getElementById('census-min');
var census_max = document.getElementById('census-max');
var param_recommend_panel = document.getElementById('param-recommend-content');

var parameters_selector = document.getElementById('attribute-control');
var centering_selector = document.getElementById('centering-control');
var sampling_date_selector = document.getElementById('sampling-date-control');
var zoning_selector = document.getElementById('zoning-control');

var controlDiv = document.getElementById('floating-panel');
var info_floating_panel = document.getElementById('info-floating-panel');
var param_floating_panel = document.getElementById("param-floating-panel");
var legend = document.getElementById("legend");
var upload_file_btn = document.getElementById("upload-file-btn");

info_floating_panel.style.display = "none";

// Array used for zoning
var zonePolygon = [];
let markers = [];

var nonParamList = ["Order", "sampleId", "latitude","longitude", "collectedDate","location"];
var coordinateList = ["latitude", "longitude"];
var raw_data = [];

function initMap(){
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: {lat: 6.6779094, lng: 100.4396873},
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.LEFT_BOTTOM
          }
      });

    map.controls[google.maps.ControlPosition.LEFT_TOP].push(controlDiv);
    controlDiv.style.display = "block";
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(info_floating_panel);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(param_floating_panel);
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(legend);
    heatmap = new google.maps.visualization.HeatmapLayer({ data: [], map: map, radius:20 });

    getZoningCoordinates();
}

upload_file_btn.addEventListener("click", () => {
  if(raw_data === ""){
    // eslint-disable-next-line no-alert
    alert("No file to be uploaded yet!");
  }
  else{
    // uploadFileDataToDB(raw_data);
  }
});

//  Eventlistener to zoning
zoning_selector.addEventListener("change", function(){
        handleZoning();
});


    //  Eventlistening to centering
centering_selector.addEventListener("change", () => {
  selected_center = centering_selector.options[centering_selector.selectedIndex];
    switch(selected_center.value){
        case 'sadao':
          map.setCenter(new google.maps.LatLng({lat: 6.6779094, lng: 100.4396873}));
          break;
        case 'chalung':
          map.setCenter(new google.maps.LatLng({lat: 6.9824032, lng: 100.2744747}));
          break;
    }
  }, false);

//  Eventlistener to parameters
parameters_selector.addEventListener("change", function(){
  selected_param = parameters_selector.options[parameters_selector.selectedIndex];
  selected_date = sampling_date_selector.options[sampling_date_selector.selectedIndex];
  heatmap.setData([]);
  if(selected_param.value !== 'None'){
      plotData(raw_data[0], selected_param.value, selected_date.value);
  }
  switch(selected_param.value){
    case 'pH':
      setParamRecommendContent("ค่าpH ที่เหมาะสมควรอยู่ที่ <br> 4.5 - 5.5");
      break;
    case 'EC':
      setParamRecommendContent("ค่าEC ที่เหมาะสมควรอยู่ที่ <br> 25 (µs/cm) - 50 (µs/cm)");
      break;
    case 'NO3':
      setParamRecommendContent("ค่าไนโตรเจน ที่เหมาะสมควรอยู่ที่ <br> 50 PPM - 200 PPM");
      break;
    case 'Ca':
      setParamRecommendContent("ค่าแคลเซียม ที่เหมาะสมควรอยู่ที่ <br> > 0.3 PPM");
      break;
    case 'K':
      setParamRecommendContent("ค่าโพแทสเซียม ที่เหมาะสมควรอยู่ที่ <br> > 40 PPM");
      break;
    case 'None':
      setParamRecommendContent("กรุณาเลือกค่าที่ต้องการแสดงผล");
      break;
  }
});

sampling_date_selector.addEventListener('change', function(){
  selected_param = parameters_selector.options[parameters_selector.selectedIndex];
  selected_date = sampling_date_selector.options[sampling_date_selector.selectedIndex];
  heatmap.setData([]);
  if(selected_param.value !== 'None'){
      plotData(raw_data[0], selected_param.value, selected_date.value);
  }
});

function handleZoning(){
    selected_zoning = zoning_selector.options[zoning_selector.selectedIndex];
    switch(selected_zoning.value){
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


// Handle information to display the information floating panel
function handleInformation(){
    if(info_floating_panel.style.display === "none"){
      info_floating_panel.style.display = "block";
    }else{
      info_floating_panel.style.display = "none";
    }
}

function addSample(sample_body){
  var body = JSON.stringify(sample_body);
  var xhr = new XMLHttpRequest();

  // Set up our request
  xhr.open( "POST", "/samples", true );
  var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  xhr.setRequestHeader("Content-Type","application/json");
  xhr.setRequestHeader("X-CSRF-TOKEN", token);
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4 && xhr.status === 200){
      // var json = JSON.parse(xhr.responseText);
    }
  };
   // The data sent is what the user provided in the form (string)
  xhr.send(body);
 
  console.log("Add Sample function is triggered");
}


function uploadDataToDatabase(){
    var data = JSON.parse(raw_data);
    console.log("Upload data");
    console.log(data);
    for(var i = 0 ; i  < data.length; i++){
      addSample(data[i]);
    }
    // eslint-disable-next-line no-alert
    alert("Sample data in the file has been uploaded successfully");  
}

var CSVToJSON = function(){
    this.parseCSV = function(file){
      let fileReader = new FileReader();
      json_object = [];
      raw_data = [];
      fileReader.readAsText(file);

      fileReader.onload = function(e){
        var data = e.target.result;
        data = data.replace(/\r/gm,"");
        var lines= data.split("\n");
      
        var headers = lines[0].split(",");
      
        for(var i=1;i<lines.length;i++){
      
            var obj = {};
            var currentline=lines[i].split(",");
      
            for(var j=0;j<headers.length;j++){
                obj[headers[j]] = currentline[j];
            }
      
            json_object.push(obj);
      
        }
        console.log(json_object);
        if(validateFileColumns(json_object)){
          setParameterSelector(getParameterList(json_object));
          setDateSelector(getUniqueDate(json_object));
          raw_data.push(JSON.stringify(json_object));
          console.log(raw_data);
        }
        // raw_data.push(result);
        // if(validateFileColumns(JSON.parse(result))){
        //   setParameterSelector(getParameterList(JSON.parse(result)));
        //   setDateSelector(getUniqueDate(JSON.parse(result)));
        //   raw_data.push(result);
        //   console.log(raw_data);
        // }
      }
    };
}

var ExcelToJSON = function(){
    this.parseExcel = function(file){
        let  fileReader = new FileReader();
        raw_data = [];

        fileReader.onload = function(e){
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type:'binary'
            });
            workbook.SheetNames.forEach((sheetname) => {
                var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetname]);
                var json_object = JSON.stringify(XL_row_object);
                console.log(json_object);
                if(validateFileColumns(JSON.parse(json_object))){
                  setParameterSelector(getParameterList(JSON.parse(json_object)));
                  setDateSelector(getUniqueDate(JSON.parse(json_object)));
                  raw_data.push(json_object);
                  console.log(raw_data);
                }
                else{
                  // eslint-disable-next-line no-alert
                  alert("Excel file must contain 'Order', 'sampleId', 'latitude','longitude', 'collectedDate','location'");
                }
            });
        };
        fileReader.onerror = function(ex){
            console.log(ex);
        };
        fileReader.readAsBinaryString(file);
    };
};

function handleSelectedFile(event){
    var files = event.target.files;
    var fileName = files[0].name;
    var fileExtension = fileName.split('.').pop();
    var fileToJSON;
    if(fileExtension === 'xlsx'){
      fileToJSON = new ExcelToJSON();
      fileToJSON.parseExcel(files[0]);
    }
    else if(fileExtension === 'csv'){
      fileToJSON = new CSVToJSON();
      fileToJSON.parseCSV(files[0]);
    }
    // var xl2json = new ExcelToJSON();
    // xl2json.parseExcel(files[0]);
}


function plotData(data, attr, date){
    data = JSON.parse(data);
    data.forEach(obj => {
      if((obj['collectedDate'] === date || date === "any" || attr !== 'none') && (typeof obj[attr] !== 'undefined')){
        var coordinate = new google.maps.LatLng(
            {lat: parseFloat(obj[coordinateList[0]]), lng: parseFloat(obj[coordinateList[1]])}
        );
        console.log("attr: " + attr + " " + obj[attr]);
        var data = { location: coordinate, weight: parseFloat(obj[attr]) };
        heatmap.getData().push(data);
        console.log("----------------------");
      }
    });

    // Set the max and min value to the legend
    setMaxLegend(getMaxAttr(data, attr));
    setMinLegend(getMinAttr(data, attr));
}


function setParameterSelector(params){
  removeOptions(parameters_selector);
  var option = document.createElement("option");
  option.text = 'none';
  parameters_selector.add(option);
    for(var i = 0; i < params.length; i++){
        option = document.createElement("option");
        option.text = params[i];
        parameters_selector.add(option);
    }
}

function getParameterList(data){
    console.log(data);
    var param_list = [];
    for(key in data[0]){
        if(nonParamList.indexOf(key) === -1){
            param_list.push(key);
        }
    }
    return param_list;
}

function validateFileColumns(data){
  result = [];
  for(var i in data[0])
    result.push(i);
  // eslint-disable-next-line eqeqeq
  for(var num = 0; num < nonParamList.length; num++){
    if(result.indexOf(nonParamList[num]) === -1){
      return false;
    }
  }
  return true;
}


function getMaxAttr(data, attr){
    var max;
    for(var i = 0; i < data.length; i++){
        if(!max || parseFloat(data[i][attr]) > parseFloat(max[attr])){
            max = data[i];
        }
    }
    return max[attr];
}

function getMinAttr(data, attr){
    var min;
    for(var i = 0; i < data.length; i++){
        if(!min || parseFloat(data[i][attr]) < parseFloat(min[attr])){
            min = data[i];
        }
    }
    return min[attr];
}

function getUniqueDate(data){
  var lookupDate = {};
  var unique_date = [];
  for(var i = 0 ; i < data.length; i++){
    var collectedDate = data[i]['collectedDate'];
    if(!(collectedDate in lookupDate)){
      lookupDate[collectedDate] = 1;
      unique_date.push(collectedDate);
    }
  }
  return unique_date;
}

function setDateSelector(date){
  removeOptions(sampling_date_selector);
  var option = document.createElement("option");
  option.text = 'any';
  sampling_date_selector.add(option);
  for(var i = 0; i < date.length; i++){
    option = document.createElement("option");
    option.text = date[i];
    sampling_date_selector.add(option);
  }
}

function removeOptions(selectElement){
  var i, len = selectElement.options.length - 1;
  for(i = len; i >= 0; i--){
    selectElement.remove(i);
  }
}

function getZoningCoordinates(){
    var request = new XMLHttpRequest();
    request.open('GET', 'https://us-central1-sadao-f4a1e.cloudfunctions.net/zoningMap', true);
    console.log("getZoningCoordinates is invoked");
    request.onload = function(){
      var data = JSON.parse(this.response);
      if(request.status >= 200 && request.status < 400){
        data.forEach(coordinates => {
          var coor_arr = Object.values(coordinates);
          var zoneCoords = [];
          for(i = 1; i < coor_arr.length; i+= 2){
            if(coor_arr[i] !== ""){
              zoneCoords.push({lat:parseFloat(coor_arr[i]), lng: parseFloat(coor_arr[i + 1])});
            }
          }
          // console.log(zoneCoords);
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
      }
      else{
        console.log('error');
      }
    }
    request.send();
}

function addMarkerAsLabel(position, map, t){
    var marker = new google.maps.Marker({
      position:position,
      map: map,
      label:t,
      draggable: false,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0
    }
    });

    markers.push(marker);
  }

function centerPolygon(coords){
  var bounds = new google.maps.LatLngBounds();
  var i;  
  for (i = 0; i < coords.length; i++) {
    bounds.extend(coords[i]);
  }
  return bounds.getCenter();
}


  //  Set the content of recommendation floating panel
function setParamRecommendContent(content){
    console.log("content: " + content);
    param_recommend_panel.innerHTML = content;
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

function setMinLegend(value){
  census_min.innerHTML = value;
}

function setMaxLegend(value){
  census_max.innerHTML = value;
}

const fileSelector = document.getElementById("file-selector");
fileSelector.addEventListener('change', handleSelectedFile, false);






