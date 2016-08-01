//getStopData.js
//ahenry

function getStop(lat, lon, submitDate, submitTime){
	if(!isNaN(lat) && !isNaN(lon)){
		$.getJSON("https://transit.land/api/v1/stops", {lat: lat, lon:lon, r:250 }, function(data){
			for(var i = 0; i < data.stops.length; i++) {
				var stop = data.stops[i];
				
				getDepartures(stop, submitDate, submitTime);
				
			}
		});
	}
}

function getDepartures(stop, submitDate, submitTime){
	//debugger;
	//console.log(stop);
	
	var t = submitTime.split(":");
	var e = parseInt(t[0]) + 3;
	var res = submitTime + "," + e + ":" + t[1] + ":" + t[2];
	//console.log(typeof(submitTime));
	
	//for(var i = 0; i < stop.routes_serving_stop.length; i++){
		//var newTime = time;
		//newTime.setHours(newTime.getHours + 1);
		//var timeInterval = time + "," + newTime
		var tempTimeInterval = "13:00:00,15:00:00";
		
		$.getJSON("https://transit.land/api/v1/schedule_stop_pairs", 
		{//route_onestop_id: stop.routes_serving_stop[i].route_onestop_id, 
			origin_onestop_id: stop.onestop_id, total: true, date: submitDate, origin_departure_between: tempTimeInterval}, function(data){				
				var times = "";
				
				for(var j = 0; j < data.schedule_stop_pairs.length; j++) {
					var pairs = data.schedule_stop_pairs[j];
					var p = pairs.route_onestop_id.split("-");
					if(times.indexOf(p[p.length-1]) >= 0) {
						times += p[p.length-1] + " -> " + pairs.origin_arrival_time + "<br>";
					}
					else {
						times += "<br>" + p[p.length-1] + " -> " + pairs.origin_arrival_time + "<br>";
					}
				}
				//console.log(times);
				
				setMarker(stop.geometry.coordinates, stop.name, times);
			});
		
		
	//}
}

$(document).ready(function(){
	//Dummy data
	/*
	var lat = 47.492708;
	var lon = -117.5857637;
	var stop = getStop(lat, lon);
	*/
});