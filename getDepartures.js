//getStopData.js
//ahenry

function getStop(lat, lon){
	if(!isNaN(lat) && !isNaN(lon)){
		$.getJSON("https://transit.land/api/v1/stops", {lat: lat, lon:lon, r:250 }, function(data){
			if(data.stops.length > 0){
				//Pull in first stop, though if multiple stops, should test for nearest one.
				var stop = data.stops[0];
				getDepartures(stop);
			}
			else{
			return null;
			}
		});
	}
}

function getDepartures(stop){
	debugger;
	for(var i = 0; i < stop.routes_serving_stop.length; i++){
		//var newTime = time;
		//newTime.setHours(newTime.getHours + 1);
		//var timeInterval = time + "," + newTime
		var tempTimeInterval = "13:00:00, 15:00:00";
		$.getJSON("https://transit.land/api/v1/schedule_stop_pairs", 
		{route_onestop_id: stop.routes_serving_stop[i].route_onestop_id, 
			origin_onestop_id: stop.onestop_id}, function(data){
				console.log(data);
			});
	}
}

$(document).ready(function(){
	//Dummy data
	var lat = 47.492708;
	var lon = -117.5857637;
	var stop = getStop(lat, lon);
});