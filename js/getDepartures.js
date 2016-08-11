
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
							"<button class='btnAddFave ui mini icon button'><i class='star icon'></i></button>"+
							"<br><table id=\"" + 
							jq_id(value.onestop_id) + "\" border=\"1\"" + " class=\"tblFindStops\">" +
							"<thead><th>Route</th><th>Time</th><th></th></thead><tbody></tbody></table>");
						
						$(".viewStopBtn").click(function() {
								var latLng = $(this).attr("data-coords");
								var t = latLng.split(",");
								
								initMap();
								moveMap(t);
								//google.maps.event.trigger(map, "resize");
								setMarker(t, stop.name);
						});
						
						getDepartures(value, submitDate, submitTime);
						
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
					origin_departure_between: tempTimeInterval,
					per_page: 1000
				},
			success: function(data) { 
						//console.log(data);
						buildRouteList(data, stop);
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
						if(jq_id(pair.route_onestop_id) == pid) {
							$("table#" + jq_id(stop.onestop_id) + " tbody").append("<tr><td>" + route.route_name + 
								": " + dest + "</td><td>" + convertTime(pair.origin_arrival_time) + "</td><td> " +
								"<input type=\"button\"" + " class=\"routeViewBtn  ui" +
								" mini blue button\" data-id=\"" + pid + "\" value=\"View Route\">"+
								"<button class='btnAddFave ui mini icon button'><i class='star icon'></i></button></td></tr>");
						}
				});
			} // end if inArray
			
	}); // end .each(stop.routes)
	
	$(".routeViewBtn").click(function() {
			$("#stops").slideUp(500);
			$(".getRouteMenu").trigger("click");
			$("#allRoutes").val($("option[value=\"" + $(this).attr("data-id") + "\"]").val());
			$("#btnRouteSubmit").trigger("click");
	});
}

function getAllStops(route, submitDate) {
	
	//if(!isNaN(route) && !isNaN(submitDate)) {
		$.getJSON("./services/route_stop_patterns.php", { 
				traversed_by: route
			}, 
			function(data){
					var pat = data.route_stop_patterns[0];
					setAllStops(pat, submitDate);
			}); 
	//}
}

function setAllStops(pat, submitDate) {
	var stops = "";
	
	$.each(pat.stop_pattern, function(i, s) {
			stops += s;
			if(i < pat.stop_pattern.length - 1) {
				stops += ",";
			}
	});
	
	$.getJSON("./services/stops.php", 
			{onestop_id: stops}, 
			function(data) {
				$("#tblAllStops").find("tr:gt(0)").remove();
				$.each(data.stops, function(i, stop) {
						$("#tblAllStops").append("<tr id=\"" + jq_id(stop.onestop_id) +
							"\"><td>" + stop.name + "</td></tr>");
				});
				
				setAllDepartures(stops, submitDate);
			}
	);
}

function setAllDepartures(stops, submitDate) {
	$.ajax({
			method: "GET",
			url: "./services/schedule_stop_pairs.php",
			data: {
					total: true,
					origin_onestop_id: stops,
					date: submitDate,
					origin_departure_between: "00:00:00,23:59:59",
					per_page: 1000
			},
			success: buildSchedule,
			dataType: "json"
	});
			
}

function buildSchedule(data) {
	var row;
	var pairs = data.schedule_stop_pairs;
	
	pairs.sort(function(a,b) {
			var x = parseInt(a.origin_arrival_time.split(":")[0]);
			var y = parseInt(b.origin_arrival_time.split(":")[0]);
			
			if(x == y) {
				var s = parseInt(a.origin_arrival_time.split(":")[1]);
				var t = parseInt(b.origin_arrival_time.split(":")[1]);
				
				return s-t;
			}
			else {
				return x-y;
			}
	});
	
	$.each(data.schedule_stop_pairs, function(i, pair) {
			$("#" + jq_id(pair.origin_onestop_id)).append("<td>" + convertTime(pair.origin_departure_time) +
				"</td>");
	});
	
	
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
