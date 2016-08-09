//planTrip_departAt
//Kevin Ungerecht

//decided to follow same naming convention as audrey

function getTrips_departAt(origin, dest, date, time){
	
	var departAtRequest = new google.maps.DirectionsService();
	var directionsDisplay = new google.maps.DirectionsRenderer();
	
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 7, center: {lat: 47.6588, lng: -117.4260}
    });
	$("#map").show();
	
    directionsDisplay.setMap(map);
	
	var D = combineDateTime(date, time);
	
	departAtRequest.route({	origin: origin,	destination: dest, travelMode: 'TRANSIT',
					transitOptions: {	departureTime: D,
												modes: ['BUS'], 
												routingPreference: 'LESS_WALKING'
									},
					provideRouteAlternatives: Boolean(1) },
					function(results,status){
						
						if(status === 'OK'){
							directionsDisplay.setDirections(results);
							for(var j = 0; j < results.routes.length; j++){
								$("#routes").append(makeRoutes(results.routes[j]));
							}
							$("#routesList").show();
							
						} else{
							window.alert("Houston we have a problem");
						}
						
						$(".pRoutesRow").click(function(){
							console.log($(this));
							var v = $.parseJSON($(this).attr("data"));
							console.log(v);
						});
					
					});
}

function makeRoutes(result,j){
	
	var routeData = {rtdt: result.legs[0]};
	var rD = JSON.stringify(routeData);
	
	var div = '<div class="pRoutesRow" data=" '+rD+' ">\
					<i class="ui big bus icon pRouteBusIcon"></i>\
					<p class="routeDtoA">' + result.legs[0].departure_time.text + ' - '+ result.legs[0].arrival_time.text + '</p><br>'+
					'<p class="routeDist">' + result.legs[0].distance.text + '</p>'+
					'<p class="routeDur">' + result.legs[0].duration.text + '</p>'+
					'<button value="'+result+'" id="pRoutesAddFave" class="ui icon button">'+
						'<i class="ui large star icon"></i>\
					</button>\
			   </div><br>';
	return div;
}

function combineDateTime(date, time){
	
	var splitDate = date.split("-");
	var year = splitDate[0];
	var month = splitDate[1];
	var day = splitDate[2];
	
	var splitTime = time.split(":");
	var hour = splitTime[0];
	var min = splitTime[1];
	
	var D = new Date(year,month,day,hour,min);
	return D;

}

$( document ).ready(function() {
	

	
	
});


