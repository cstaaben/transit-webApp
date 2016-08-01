function initMap() {
	
	var mapDiv = document.getElementById('map');
	map = new google.maps.Map(mapDiv, {
		  center: {lat: 47.6588, lng: -117.4260},
		  zoom: 10
	});
	infowindow = new google.maps.InfoWindow();
	markers = [];
	
}

function moveMap(latLng) {
	
	map.panTo(latLng);
	google.maps.event.addListenerOnce(map, "idle", function() {
			map.setZoom(16);
	});
	
	//map.addListener("center_changed", clearMarker);
}

function setMarker(latLng, name) {
	m = new google.maps.Marker({
		map: map,
		position: {lat: latLng[0], lng: latLng[1]},
		draggable: false,
		title: name,
		animation: google.maps.Animation.DROP
	});
	
	markers.push(m);
	
	return m;
}

function setInfo(mark, info) {
	mark.addListener("click", function() {
			infowindow.close();
			infowindow.setContent(info);
			infowindow.open(map, marker);
	});
}

function clearMarkers() {
	for(var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
}

function getShortestDist(orLat, orLng, destAra) {
	var o;
	o = orLat + "," + orLng;
	
	for(var i = 0; i < destAra.length; i++) {
		console.log(destAra[i]);
	}
	
	//var req = "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + o + 
	//		"&destinations=" + dest + "&key=AIzaSyBnnmS81Gsx73eGbCi7rt5ERc1XdUy7Vf8";
	//$.getJSON(req, "");
}