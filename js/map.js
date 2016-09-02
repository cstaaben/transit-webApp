function initMap() {
	var mapDiv = document.getElementById('divMap');
	map = new google.maps.Map(mapDiv, {
		  center: {lat: 47.658779, lng: -117.426048},
		  zoom: 10
	});

	$("#divMap").show();
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
		map: map,
		position: {lat: parseFloat(latLng[1]), lng: parseFloat(latLng[0])},
		draggable: false,
		title: name,
		animation: google.maps.Animation.DROP,
	});
	
	
	var infoWindow = new google.maps.InfoWindow();
	marker.addListener("click", function() {
			infoWindow.close();
			infoWindow.setContent(name);
			infoWindow.open(map, marker);
	});
}
