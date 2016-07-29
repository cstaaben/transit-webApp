/*https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyDNjqAjndVUEOxXE3r1i3PdGx-uPHZDBgI*/

//KEY YOs
//AIzaSyDNjqAjndVUEOxXE3r1i3PdGx-uPHZDBgI


function getGeoCoding(location)
{
	var link = "https://maps.googleapis.com/maps/api/geocode/json?address="+location+"&key=AIzaSyDNjqAjndVUEOxXE3r1i3PdGx-uPHZDBgI";
	$.getJSON(link, "", getDone);
}

function getDone(data){
	//console.log('WORKED');
	//console.log(data.results[0].geometry.location);
	var fullLocation = data.results[0].geometry.location;
	
	var lat = fullLocation.lat;
	var lng = fullLocation.lng;
	
	console.log(lat+", "+lng);
}