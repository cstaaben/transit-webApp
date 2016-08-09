
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
						stop.geometry.coordinates + "\" value=\"View Map\" class=\"viewStopBtn ui mini blue button\"></li>";
						pid = pair.route_onestop_id; 
					}
			});
			
			sublist += "</ul></li></ul>";
			//console.log(stop.onestop_id + " -> " + sublist[i]);
			$("li:contains(\"" + stop.name + "\")").append(" <input type=\"button\" class=\"routeViewBtn ui mini blue button\" data-id=\"" +
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


//getStopData.js
//ahenry

var departures = [];
var arrivals = [];
var numDepartures = 0;

function getArrivalsDepartures(lat, lon){
	if(!isNaN(lat) && !isNaN(lon)){
		$.getJSON("https://transit.land/api/v1/stops", {lat: lat, lon:lon, r:250 }, function(data){
			if(data.stops.length > 0){
				//Pull in first stop, though if multiple stops, should test for nearest one.
				var stop = data.stops[0];
				getDepartures(stop);
				getArrivals(stop);
			}
			else{
			return null;
			}
		});
	}
}

function updateDepartures(){
	if(departures.length > 0){
		departures.sort(function(a, b){
			var x = Date.parse(a.origin_departure_time);
			var y = Date.parse(b.origin_departure_time);
			if(x < y) return -1;
			else if(x > y) return 1;
			else return 0;
		});
	}
	refreshDepartureTable();
}

function updateArrivals(){
	if(arrivals.length > 0){
		arrivals.sort(function(a, b){
			var x = Date.parse(a.destination_arrival_time);
			var y = Date.parse(b.destination_arrival_time);
			if(x < y) return -1;
			else if(x > y) return 1;
			else return 0;
		});
	}
	refreshArrivalTable();
}

var getStopTitles = function(schedule_stop_pair){
	return function(data){
		this.destination_title = data.name;
		departures.push(this);
		updateDepartures();
	}
}
/*
function getDepartures(stop){
	departures = [];
	var time = "06:55:00";//Date.now().getHours();
	//time += Date.now().toString(":mm:ss");
	var date = Date.now().toString("yyyy-MM-dd");
	for(var i = 0; i < stop.routes_serving_stop.length; i++){
		
		$.getJSON("https://transit.land/api/v1/schedule_stop_pairs", 
		{route_onestop_id: stop.routes_serving_stop[i].route_onestop_id, origin_onestop_id: stop.onestop_id,
			date: date, origin_departure_between: time}, function(data){
				//For each route
				$(data).each(function(){
					//For each schedule stop pair
					for(var j = 0; j < this.schedule_stop_pairs.length; j++){
						var currentPair = this.schedule_stop_pairs[j];
						currentPair.origin_departure_time_formatted = Date.parse(currentPair.origin_departure_time).toString("h:mm tt");
						currentPair.origin_arrival_time_formatted = Date.parse(currentPair.origin_arrival_time).toString("h:mm tt");
						currentPair.destination_departure_time_formatted = Date.parse(currentPair.destination_departure_time).toString("h:mm tt");
						currentPair.destination_arrival_time_formatted = Date.parse(currentPair.destination_arrival_time).toString("h:mm tt");
						$.getJSON("https://transit.land/api/v1/stops", {onestop_id: currentPair.origin_onestop_id}, (function(currentPair){ 
							return function(data){
								currentPair.origin_stop = data.stops[0].name;
								$.getJSON("https://transit.land/api/v1/stops", {onestop_id: currentPair.destination_onestop_id}, function(data){
									currentPair.destination_stop = data.stops[0].name;
									$.getJSON("https://transit.land/api/v1/routes", {onestop_id: currentPair.route_onestop_id}, function(data){
										currentPair.route_name = data.routes[0].name;
										departures.push(currentPair);
										updateDepartures();
									});
								});
							};
					}(currentPair)));
					} 
				});
			});
	}
}
*/
function getArrivals(stop){
	arrivals = [];
	var time = Date.now().getHours();
	time += Date.now().toString(":mm:ss");
	var date = Date.now().toString("yyyy-MM-dd");
	for(var i = 0; i < stop.routes_serving_stop.length; i++){
		
		$.getJSON("https://transit.land/api/v1/schedule_stop_pairs", 
		{route_onestop_id: stop.routes_serving_stop[i].route_onestop_id, destination_onestop_id: stop.onestop_id,
			date: date, destination_arrival_between: time}, function(data){
				//For each route
				$(data).each(function(){
					//For each schedule stop pair
					for(var j = 0; j < this.schedule_stop_pairs.length; j++){
						var currentPair = this.schedule_stop_pairs[j];
						currentPair.origin_departure_time_formatted = Date.parse(currentPair.origin_departure_time).toString("h:mm tt");
						currentPair.origin_arrival_time_formatted = Date.parse(currentPair.origin_arrival_time).toString("h:mm tt");
						currentPair.destination_departure_time_formatted = Date.parse(currentPair.destination_departure_time).toString("h:mm tt");
						currentPair.destination_arrival_time_formatted = Date.parse(currentPair.destination_arrival_time).toString("h:mm tt");
						$.getJSON("https://transit.land/api/v1/stops", {onestop_id: currentPair.origin_onestop_id}, (function(currentPair){ 
							return function(data){
								currentPair.origin_stop = data.stops[0].name;
								$.getJSON("https://transit.land/api/v1/stops", {onestop_id: currentPair.destination_onestop_id}, function(data){
									currentPair.destination_stop = data.stops[0].name;
									$.getJSON("https://transit.land/api/v1/routes", {onestop_id: currentPair.route_onestop_id}, function(data){
										currentPair.route_name = data.routes[0].name;
										arrivals.push(currentPair);
										updateArrivals();
									});
								});
							};
					}(currentPair)));
					} 
				});
			});
	}
}

function refreshDepartureTable(){
	$("#tblDepartures").find("tr:gt(0)").remove();
	var newRows = "";
	for(var i = 0; i < departures.length; i++){
		newRows += "<tr><td>";
		newRows += departures[i].origin_departure_time_formatted;
		newRows += "</td><td>";
		newRows += departures[i].route_name;
		newRows += "</td><td>";
		newRows += departures[i].destination_stop;
		newRows += "</td></tr>";
	}
	$("#tblDepartures").append(newRows);
	$("#tblDepartures").show();
}

function refreshArrivalTable(){
	$("#tblArrivals").find("tr:gt(0)").remove();
	var newRows = "";
	for(var i = 0; i < arrivals.length; i++){
		if(Date.parse(arrivals[i].destination_arrival_time) > Date.now()){
			newRows += "<tr><td>";
			newRows += arrivals[i].destination_arrival_time_formatted;
			newRows += "</td><td>";
			newRows += arrivals[i].route_name;
			newRows += "</td><td>";
			newRows += arrivals[i].origin_stop;
			newRows += "</td></tr>";
		} 
	}
	$("#tblArrivals").append(newRows);
	$("#tblArrivals").show();
}

/*$(document).ready(function(){
	$("#btnGetDepartures").click(function(){
		//Dummy data
		var lat = 47.492708;
		var lon = -117.5857637;
		getArrivalsDepartures(lat, lon);
	});
});*/
