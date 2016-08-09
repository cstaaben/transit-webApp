//PlanTrip-arriveBy.js
//audrey henry

/*I decided to put this into its own file for now, as I don't want to clog up the busForm.js file.*/

function getTrips_arriveBy(origin, destination, date, time){
	var arriveByRequest = new google.maps.DirectionsService;
	var directionsDisplay = new google.maps.DirectionsRenderer;
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 7, center: {lat: 41.85, lng: -87.65}
        });
    directionsDisplay.setMap(map);
	arriveByRequest.route({origin: origin, destination: destination, travelMode: 'TRANSIT'}, function(response, status){
		if(status === 'OK'){
			directionsDisplay.setDirections(response);
			debugger;
		} else{
			window.alert("Houston we have a problem");
			debugger;
		}
	});
}
