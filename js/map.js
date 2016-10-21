function initMap() {
	var mapDiv = document.getElementById('divMap');
	map = new google.maps.Map(mapDiv, {
		  center: {lat: 47.658779, lng: -117.426048},
		  zoom: 10
	});

	$("#divMap").show();
}

function initMapWithBounds(latCenter, lonCenter, northBound, eastBound, southBound, westBound){
	var bound = {north: northBound, east: eastBound, south: southBound, west: westBound};

	var myStyles =[
		{
			featureType: "transit.station.bus",
			elementType: "labels",
			stylers: [
				{ visibility: "off" }
			]
		}
	];

	$("#divMap").empty().transition("fly right in");

	var mapDiv = document.getElementById('divMap');
	map = new google.maps.Map(mapDiv, {
		center: {lat: latCenter, lng: lonCenter},
		zoom: 12,
		styles: myStyles
	});

	//var origin = {lat: latCenter, lng: lonCenter};
	//var clickHandler = new ClickEventHandler(map, origin);
	console.log(bound);

	map.fitBounds(bound);

	drawBusStops();
	console.log("map init done");
}

function updateStopsWhenNecessary(){
	map.addListener('dragend', function(){onMapBoundsChanged();});
	map.addListener('zoom_changed', function(){onMapBoundsChanged();});
}

function onMapBoundsChanged(){
	console.log("bounds changed");
	var bounds = map.getBounds();
	var northEast = bounds.getNorthEast();
	var southWest = bounds.getSouthWest();
	var northBound = northEast.lat();
	var eastBound = northEast.lng();
	var southBound = southWest.lat();
	var westBound = southWest.lng();

	requestStopsInBounds(northBound, eastBound, southBound, westBound).then(function(data){ onStopsReceived(data); });
}

function moveMap(latLng) {
	var lat = parseFloat(latLng[1]);
	var lng = parseFloat(latLng[0]);
	
	map.panTo({lat: lat, lng: lng});
	google.maps.event.addListenerOnce(map, "idle", function() {
			map.setZoom(16);
	});

}

function setMarker(latLng, name) {

	var marker = new google.maps.Marker({
		position: {lat: parseFloat(latLng[1]), lng: parseFloat(latLng[0])},
		draggable: false,
		title: name,
		animation: google.maps.Animation.DROP
	});
	
	var infoWindow = new google.maps.InfoWindow();
	marker.addListener("click", function() {
			infoWindow.close();
			infoWindow.setContent(name);
			infoWindow.open(map, marker);
	});
}

var ClickEventHandler = function(map, origin) {
	this.origin = origin;
	this.map = map;
	this.directionsService = new google.maps.DirectionsService;
	this.directionsDisplay = new google.maps.DirectionsRenderer;
	this.infowindow = new google.maps.InfoWindow;
	this.directionsDisplay.setMap(map);
	this.placesService = new google.maps.places.PlacesService(map);

	// Listen for clicks on the map.
	this.map.addListener('click', this.handleClick.bind(this));
};

ClickEventHandler.prototype.handleClick = function(event) {
	console.log('You clicked on: ' + event.latLng);
	// If the event has a placeId, use it.
	if (event.placeId) {
		console.log('You clicked on place:' + event.placeId);

		// Calling e.stop() on the event prevents the default info window from
		// showing.
		// If you call stop here when there is no placeId you will prevent some
		// other map click event handlers from receiving the event.
		event.stop();
		this.calculateAndDisplayRoute(event.placeId);
		this.getPlaceInformation(event.placeId);
	}
};

ClickEventHandler.prototype.calculateAndDisplayRoute = function(placeId) {
	var me = this;
	this.directionsService.route({
		origin: this.origin,
		destination: {placeId: placeId},
		travelMode: 'WALKING'
	}, function(response, status) {
		if (status === 'OK') {
			me.directionsDisplay.setDirections(response);
		} else {
			window.alert('Directions request failed due to ' + status);
		}
	});
};

ClickEventHandler.prototype.getPlaceInformation = function(placeId) {
	var me = this;
	this.placesService.getDetails({placeId: placeId}, function(place, status) {
		console.log(place);
		if (status === 'OK') {
			me.infowindow.close();
			me.infowindow.setPosition(place.geometry.location);
			me.infowindow.setContent(
				'<div><img src="' + place.icon + '" height="16" width="16"> '
				+ '<strong>' + place.name + '</strong><br>' + 'Place ID: '
				+ place.place_id + '<br>' + place.formatted_address + '</div>');
			me.infowindow.open(me.map);
		}
	});
};

var busStopMarkers = {};

function drawBusStops(){
	for (var key in busStopMarkers){
		if (busStopMarkers.hasOwnProperty(key)) {
			busStopMarkers[key].setMap(map);
		}
	}
}

function buildBusStopMarker(busStop){
	var lat = parseFloat(busStop.point.lat);
	var lng = parseFloat(busStop.point.lon);

	var marker = new google.maps.Marker({
		position: {lat: lat, lng: lng},
		draggable: false,
		icon: '../transit-webApp/img/bus_stop.png',
		title: busStop.name,
		animation: google.maps.Animation.DROP
	});

	var infoWindow = new google.maps.InfoWindow();
	marker.addListener("click", function() {
		infoWindow.close();
		infoWindow.setContent(busStop.name);
		infoWindow.open(map, marker);
	});

	if (!busStopMarkers.hasOwnProperty(busStop.abbr)) {
		busStopMarkers[busStop.abbr] = marker;
	}
}