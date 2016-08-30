//planTrip_departAt
//Kevin Ungerecht

//decided to follow same naming convention as audrey

function getTrips_departAt(origin, dest, date, time){
	
	var departAtRequest = new google.maps.DirectionsService();

	var D = combineDateTime(date, time);
	
	var v;
	var v2;
	var directionsDisplay;
	var map;
	var selected;
	
	departAtRequest.route({	origin: origin,	destination: dest, travelMode: 'TRANSIT',
					transitOptions: {	departureTime: D,
												modes: ['BUS'], 
												routingPreference: 'LESS_WALKING'
									},
					provideRouteAlternatives: Boolean(1) },
					function(results,status){
						
						if(status === 'OK'){
							
							for(var j = 0; j < results.routes.length; j++){
								$("#routes").append(makeRoutes(results,j));
								if(j == 0){	
									directionsDisplay = new google.maps.DirectionsRenderer();
									$("#map").empty();
									map = new google.maps.Map(document.getElementById('map'), {
										zoom: 12, center: {lat: 47.6588, lng: -117.4260}, scrollwheel: false
									});
									$("#map").hide();
									directionsDisplay.setMap(map);
									directionsDisplay.setDirections(results);
									$("#map").show();
									selected = 0;
								}
								$('#rr'+j).click(function(){
									var pTmp = $(this).attr("id");
									pTmp = parseInt(pTmp.slice(-1));
									if(selected !== pTmp){
										v = $.parseJSON($(this).attr("value"));
										directionsDisplay = new google.maps.DirectionsRenderer();
										$("#map").empty();
										map = new google.maps.Map(document.getElementById('map'), {
											zoom: 12, center: {lat: 47.6588, lng: -117.4260}, scrollwheel: false
										});
										$("#map").hide();
										directionsDisplay.setMap(map);
										directionsDisplay.setDirections(v);
										$("#map").show();
										selected = pTmp;
									}
								});
								$('#pRoutesAddFave'+j).click(function(){
									v2 = $.parseJSON($(this).attr("value"));
									console.log(v2);
									var pTmp = $(this).attr("id");
									pTmp = parseInt(pTmp.slice(-1));
									
									//var name = ;
									
								});
								if(j === 4){
									j = results.routes.length;
								}
							}
							$("#routesList").show();

							
						} else{
							window.alert("Houston we have a problem");
						}
					
					});
}

function makeRoutes(results,j){
	
	var result = results.routes[j];
	var r = JSON.stringify(result);

	var res = {geocoded_waypoints: results.geocoded_waypoints, request: results.request, routes: [result], status: "OK"};
	var rD = JSON.stringify(res);
	var stepString = "";
	for(var i = 0; i < results.routes[j].legs[0].steps.length; i++){
		if(results.routes[j].legs[0].steps[i].travel_mode === "TRANSIT"){
			stepString += '<i class="ui big bus icon pRouteBusIcon"></i><p> ' + results.routes[j].legs[0].steps[i].transit.line.short_name + ' </p>';
			if(i < results.routes[j].legs[0].steps.length - 1 && results.routes[j].legs[0].steps[i+1].travel_mode === "TRANSIT"){
				stepString += '<i class="arrow right icon"></i>';
			}
		}

	}
	var tmpstr = "rr"+j+"";
	
	var div = '<div class="pRoutesRow" id="'+ tmpstr +'" value=\''+ rD +'\' >' +
					stepString + 
					'<p class="routeDtoA">' + result.legs[0].departure_time.text + ' - '+ result.legs[0].arrival_time.text + '</p><br>'+
					'<p class="routeDist">' + result.legs[0].distance.text + '</p>'+
					'<p class="routeDur">' + result.legs[0].duration.text + '</p>'+
					'<p class="routeFare">Fare: ' + res.routes[0].fare.text + '</p>'+
					'<p class="routeDist">' + result.legs[0].distance.text + '</p>'+
			   '</div><br>';
	return div;
}

//<i class="ui big bus icon pRouteBusIcon"></i>\

function combineDateTime(date, time){
	
	var splitDate = date.split("-");
	var year = splitDate[0];
	var month = splitDate[1];
	month--;
	var day = splitDate[2];
	
	var splitTime = time.split(":");
	var hour = splitTime[0];
	var min = splitTime[1];
	
	var D = new Date(year,month,day,hour,min);
	return D;
	console.log(D);

}


