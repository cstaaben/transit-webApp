
//getStopData.js
//ahenry
//comment
function getStop(lat, lon, submitDate, submitTime){
	if(!isNaN(lat) && !isNaN(lon)){
		$.getJSON("./services/stops.php", {lat: lat, lon:lon, r:250 }, function(data){
				
				// Paragraph version of parsing data 
				$("#stops").empty();
				$.each(data.stops, function(index, value) {
						//console.log(value);
						$("#stops").append("<h2>" + value.name + "</h2><input type=\"button\"" +
							" data-coords=\"" + value.geometry.coordinates + "\" value=\"View Map\"" + 
							" class=\"viewStopBtn ui mini blue button\">"+
							'<button class="btnAddFave ui icon button" id="stopAddFave'+index+'"><i class="star icon"></i></button>'+
							"<br><table id=\"" + 
							jq_id(value.onestop_id) + "\" border=\"1\"" + " class=\"tblFindStops\">" +
							"<thead><th>Route</th><th>Time</th><th></th></thead><tbody></tbody></table>");
						
						
						$("#stopAddFave"+index).click(function() {
								
								var stopName = "Stop: ";
								stopName += value.name;
								var stopId = value.onestop_id;
								
								var fArray = getFavorites();
								
								if(fArray === undefined){//favorites is empty
									addToFaves(stopName, stopId);
								}else{
									if(lookForFave(stopName)){//route exists in favorites already
										alert(stopName +" is already in your favorites!");
									}else{
										addToFaves(stopName,stopId);
									}
								}
						});
						
						getDepartures(value, submitDate, submitTime);
						
				});
				$(".viewStopBtn").click(function() {

						var latLng = $(this).attr("data-coords");
						var t = latLng.split(",");
						
						initMap();
						moveMap(t);
						//google.maps.event.trigger(map, "resize");
						setMarker(t, stop.name);
				});
				
				$(".routeViewBtn").click(function() {
						console.log("click");
						$("#stops").slideUp(500);
						$(".getRouteMenu").trigger("click");
						$("#allRoutes").val($("option[value=\"" + $(this).attr("data-id") + "\"]").val());
						$("#btnRouteSubmit").trigger("click");
				});
				
				$(".routeAddFave").click(function() {
						var fArray = getFavorites();
						var routeName = "Route: ";
						routeName += $(this).attr("value");
						var routeId = $(this).attr("data-id");
						
						if(fArray === undefined){//favorites is empty
							addToFaves(routeName, routeId);
						}else{
							if(lookForFave(routeName)){//route exists in favorites already
								alert(routeName +" is already in your favorites!");
							}else{
								addToFaves(routeName,routeId);
							}
						}
				});
				
		});
	}
	
}

function getDepartures(stop, submitDate, submitTime){
	
	var t = submitTime.split(":");
	var e = parseInt(t[0]) + 3;
	var res = submitTime + "," + e + ":" + t[1] + ":" + t[2];

	var tempTimeInterval = "13:00:00,15:00:00";
	
	$.ajax({
			method: "GET",
			url: "./services/schedule_stop_pairs.php", 
			data: 
				{ 
					origin_onestop_id: stop.onestop_id, 
					total: true, 
					date: submitDate, 
					origin_departure_between: tempTimeInterval
				},
			success: function(data) { 
						//console.log(data);
						buildRouteList(data, stop);
				},
			dataType: "json",
			async: false
	});
	
}

function getAllStops(route, submitDate) {
	if(!isNaN(route) && !isNaN(submitDate)) {
		$.getJSON("./services/stops.php", {
				served_by: route
			}, 
			function(data){
					$("#tblAllStops").empty();
					$.each(data.stops, function(i, stop) {
							setAllDepartures(stop, submitDate);
					});
			}); 
	}
}

function setAllDepartures(stop, submitDate) {
	$.ajax({
			method: "GET",
			url: "./services/schedule_stop_pairs.php",
			data: {
					total: true,
					origin_onestop_id: stop.onestop_id,
					date: submitDate,
					per_page: 1000
			},
			success: function(data) {
					//buildSchedule(data, stop);
					console.log(data);
			},
			dataType: "json",
			async: false
	});
			
}

function buildRouteList(data, stop) {
	var dest;
	var pid;
	var rids = [];
	
	//console.log(stop);
	//console.log(data);
	
	$.each(data.schedule_stop_pairs, function(i, p) {
			if($.inArray(p.route_onestop_id, rids) < 0) {
				rids.push(p.route_onestop_id);
			}
	});

	$.each(stop.routes_serving_stop, function(i, route) {
			pid = jq_id(route.route_onestop_id);
			
			if($.inArray(pid, rids) != -1) {

				$.each(data.schedule_stop_pairs, function(j, pair) {
						if(pair.route_onestop_id == route.route_onestop_id) {
							dest = pair.trip_headsign;
						}
				});
				
				// Paragraph Version
				$.each(data.schedule_stop_pairs, function(j, pair) {
						if(pair.route_onestop_id == pid) {
							var rName = route.route_name + " - " + dest;
							$("table#" + jq_id(stop.onestop_id) + " tbody").append("<tr><td>" + rName + "</td><td>" +
								convertTime(pair.origin_arrival_time) + "</td><td> " +
								"<input type=\"button\"" + " class=\"routeViewBtn  ui" +
								" mini blue button\" data-id=\"" + pid + "\" value=\"View Route\">"+
								"<button class='routeAddFave btnAddFave ui icon button' value=\""+ rName+"\" data-id=\"" + pid + "\"><i class='star icon'></i></button></td></tr>");
						}
				});
			} // end if inArray
			
	}); // end .each(stop.routes)
	
}

function buildSchedule(data, stop) {
	
}

function jq_id(id) {
	var s = id.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
	return s.replace( /~/g, "_");
}

function convertTime(time) { //credit to user HBP on StackOverflow for conversion code inspiration
  // Check correct time format and split into components
  time = time.toString().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice(1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join(''); // return adjusted time or original string
}
