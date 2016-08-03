/*https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyDNjqAjndVUEOxXE3r1i3PdGx-uPHZDBgI*/

//KEY YOs
//AIzaSyDNjqAjndVUEOxXE3r1i3PdGx-uPHZDBgI


function getGeoCoding(location, submitDate, submitTime)
{
	
	var link = "https://maps.googleapis.com/maps/api/geocode/json?address="+location+"&key=AIzaSyDNjqAjndVUEOxXE3r1i3PdGx-uPHZDBgI";
	$.getJSON(link, "", function(data) {
			getDone(data, submitDate, submitTime);
	});
}

function getDone(data, submitDate, submitTime){
	//console.log('WORKED');
	//console.log(data.results[0].geometry.location);
	if(data["status"] == "OK") {
		var latLng = data.results[0].geometry.location;
		
		initMap(latLng);
		getStop(latLng.lat, latLng.lng, submitDate, submitTime);
	}
	else {
		alert("Geocode failed: " + data["status"]);
	}

}