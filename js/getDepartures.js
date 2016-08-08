
//getStopData.js
//ahenry
//comment
function getStop(lat, lon, submitDate, submitTime){
	if(!isNaN(lat) && !isNaN(lon)){
		$.getJSON("./services/stops.php", {lat: lat, lon:lon, r:250 }, function(data){
				$("#stopList").empty();
				$.each(data.stops, function(index, value) {
						
						$("#stopList").append("<li id=\"" + value.onestop_id + "\">" + value.name + "</li>");
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

function getArrivals(stop, submitTime, submitDate) {
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
					destination_arrival_between: tempTimeInterval
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
	var sublist;
	var pid;
	
	//console.log(stop);
	//console.log(data);
	
	$.each(stop.routes_serving_stop, function(i, route) {
			
			$.each(data.schedule_stop_pairs, function(j, pair) {
					if(pair.route_onestop_id == route.route_onestop_id) {
						dest = pair.trip_headsign;
					}
			});
			
			sublist = "<ul><li>" + route.route_name + ": " + dest + "<ul>";
			
			$.each(data.schedule_stop_pairs, function(j, pair) {
					//debugger;
					if(pair.route_onestop_id == route.route_onestop_id) {
						sublist += "<li>" + pair.origin_arrival_time + " <input type=\"button\" data-coords=\"" + 
						stop.geometry.coordinates + "\" value=\"View Map\" class=\"viewStopBtn\"></li>";
						pid = pair.route_onestop_id; 
					}
			});
			
			sublist += "</ul></li></ul>";
			//console.log(stop.onestop_id + " -> " + sublist[i]);
			$("li:contains(\"" + stop.name + "\")").append(" <input type=\"button\" class=\"routeViewBtn\" data-id=\"" +
					pid + "\"" + (($("li:contains(\"" + stop.name + "\")").length > 0) ? "" : " disabled") + 
					"value=\"View Route\">" + sublist);
			
			$(".routeViewBtn").click(function() {
					$("#stops").slideUp(500);
					$(".getRouteMenu").trigger("click");
					$("#allRoutes").val($("option[value=\"" + pid + "\"]").val());
					$("#btnRouteSubmit").trigger("click");
			});
			
			$(".viewStopBtn").click(function() {
					var latLng = $(this).attr("data-coords");
					var t = latLng.split(",");
					
					$("#map").slideDown(500);
					initMap(t);
					google.maps.event.trigger(map, "resize");
					setMarker(t, stop.name);
			});
			
	});
}
