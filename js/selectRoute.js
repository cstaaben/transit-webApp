
function getRoutes(){
	var link = "https://transit.land/api/v1/routes?operated_by=o-c2kx-spokanetransitauthority"
	$.getJSON(link, "", getDone);

}//end getRoutes

function getDone(data){
	var data = data.routes;
	var array = [];

	//This will iterate through the array to get all of the route numbers & Names
	
	for(var x = 0; x < data.length; x++)
	{
		var num = data[x].name;
		var longName = data[x].tags.route_long_name;
		var id = data[x].onestop_id;

		//Fills Array with all stops
		array[x] = {
			"num" : num,
			"longName" : longName,
			"id" : id
		};

	}//End For Loop


	//Sort the Array
	array.sort( function(a,b){
		return a.num - b.num;
	});


	//Populates the Form
	for(var x = 0; x < array.length; x++)
	{
		var str = "<option value = '" + array[x].id + "'>" + array[x].num + " - " + array[x].longName + "</option>";
		$("#allRoutes").append(str);
		
	}//End For Loop
	$("#btnRouteSubmit").click(getRoute);

}// end getDone

function getRoute(){
	var routeId = $("#allRoutes").val();
	$.getJSON("http://localhost/transit-webApp/services/route_stop_patterns.php", {traversed_by: routeId}, function(data){
		var pattern = data.route_stop_patterns[0];
		initRouteMap(pattern);
	});
}

function initRouteMap(pattern){
	//Estimate center of map as the center coordinates in the geometry.coordinates array
	var centerLon = pattern.geometry.coordinates[Math.floor(pattern.geometry.coordinates.length/2)][0];
	var centerLat = pattern.geometry.coordinates[Math.floor(pattern.geometry.coordinates.length/2)][1];
	var mapDiv = document.getElementById('routeMap');
	map = new google.maps.Map(mapDiv, {
		  center: {lat: centerLat, lng: centerLon},
		  zoom: 12
	});
	var firstLon =  pattern.geometry.coordinates[0][0];
	var lastLon =  pattern.geometry.coordinates[pattern.geometry.coordinates.length - 1][0];
	var firstLat = pattern.geometry.coordinates[0][1];
	var lastLat = pattern.geometry.coordinates[pattern.geometry.coordinates.length - 1][1];
	$("#routeMap").slideDown(500, function(){
		google.maps.event.trigger(map, 'resize');
		var bounds = new google.maps.LatLngBounds();
		bounds.extend(new google.maps.LatLng(centerLat, centerLon));
		bounds.extend(new google.maps.LatLng(firstLat, firstLon));
		bounds.extend(new google.maps.LatLng(lastLat, lastLon));
		debugger;
		//map.panTo({lat: centerLat, lng:centerLon});
		map.fitBounds(bounds);

	});
}

