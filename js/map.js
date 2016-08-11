function initMap(coords) {
	
	$("#map").show();
	
	var mapDiv = document.getElementById('map');
	map = new google.maps.Map(mapDiv, {
		  center: {lat: 47.658779, lng: -117.426048},
		  zoom: 10
	});
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
	
	//console.log(info);
	
	var m = new google.maps.Marker({
		map: map,
		position: {lat: parseFloat(latLng[1]), lng: parseFloat(latLng[0])},
		draggable: false,
		title: name,
		animation: google.maps.Animation.DROP,
	});
	
	
	var infowindow = new google.maps.InfoWindow();
	m.addListener("click", function() {
			infowindow.close();
			infowindow.setContent(name);
			infowindow.open(map, marker);
	});
}

function closeWindows() {
	for(var i = 0; i < windows.length; i++) {
		windows[i].close();
	}
}

function clearMarkers() {
	for(var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	
	markers = [];
}
