
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
		var routeCoords = [];
		//Extend the boundaries of the map to include all of the stops
		//Also add each geometry point to the routeCoords, so we can draw the path
		for(var i = 0; i < pattern.geometry.coordinates.length; i++){
			bounds.extend(new google.maps.LatLng(pattern.geometry.coordinates[i][1], pattern.geometry.coordinates[i][0]));
			routeCoords.push({lat: pattern.geometry.coordinates[i][1], lng: pattern.geometry.coordinates[i][0]})
		}

		/*So I just found out that you can request multiple onestop_ids in a "get stop" request. I spent all morning trying to synchronize a bunch of
		conflicting AJAX calls and was going to implement a horribly inefficient recursive method to create the stops. 
		Now that I've realized that we can request mulitple stops by onestop_id in a request, all I have to do is build a string with all of the onestop_ids
		and make one request to get that data. Once we have all of the data for the stops, all that needs to be done is create a marker for each one. All of the
		stops are now displayed on the map, and they populate very quickly. My soul can now be at rest.*/
		//Build a string of all of the onestop_ids for the request
		var stopIds = "";
		for(var i = 0; i < pattern.stop_pattern.length; i++){
			stopIds += pattern.stop_pattern[i];
			if(i < pattern.stop_pattern.length - 1){
				stopIds += ",";
			}
		}
		//Request data for all of the stops in the route
		$.getJSON("http://localhost/transit-webApp/services/stops.php", {onestop_id: stopIds}, function(data){
			var stops = data.stops;
			var infoWindow = new google.maps.InfoWindow();
			//Create a marker for each of the stops and add it to the map.
			for(var i = 0; i < stops.length; i++){
				var newMarker =  new google.maps.Marker({
					position: {lat: stops[i].geometry.coordinates[1], lng: stops[i].geometry.coordinates[0]},
					map: map,
					title: stops[i].name
				});
				var routes_served = "";
				for(var j = 0; j < stops[i].routes_serving_stop.length; j++){
					routes_served += stops[i].routes_serving_stop[j].route_name;
					if(j < stops[i].routes_serving_stop.length - 1){
						routes_served += ", ";
					}
				}
				var content = '<div id="content"><h3 id="firstHeading" class="firstHeading">' + stops[i].name + '</h3><p>Connects with routes: ' + routes_served + ' </p></div>';
				google.maps.event.addListener(newMarker, 'click', (function(newMarker, map, content){
					return function(){
						infoWindow.close();
						infoWindow.setContent(content);
						infoWindow.open(map, newMarker);
					};
				}(newMarker, map, content)));
				newMarker.setMap(map);
			}
		});	

		//Initialize the route path using the routeCoords
		var routePath = new google.maps.Polyline({
			path: routeCoords,
			geodesic: true,
			strokeColor: '#0099ff',
			strokeOpacity: 1.0,
    		strokeWeight: 2
		});
		//Attach the path to the map
		routePath.setMap(map);
		//Fit the map to include all of our coordinates
		map.fitBounds(bounds);
		//window.scrollTo(0, document.body.scrollHeight);

	});
	//Ok, it just pops down. I can't figure out how to make it slide down smoothly
	$("html, body").animate({ scrollTop: $(document).height()}, 1000);

}


