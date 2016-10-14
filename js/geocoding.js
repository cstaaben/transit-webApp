/**
 * @example https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=key
 */

//SHELVED: until STA gets it together and adds their stops back to transit.land
/*
function getGeocoding(location, submitDate, submitTime) {

    var link = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=" + API_KEY_UNRESTRICTED;
    $.getJSON(link, "", function(data) {
        getGeoCodeDone(data, submitDate, submitTime);
    });
}

function getGeoCodeDone(data, submitDate, submitTime) {
    if (data["status"] == "OK") {
        var latLng = data.results[0].geometry.location;
        getStops(latLng.lat, latLng.lng, submitDate, submitTime);
    } else {
        alert("Geocode failed: " + data["status"] + "\n" + data["error_message"]);
    }
}
*/

function requestGeocoding(location, callback){
    var requestAddress = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=" + API_KEY_UNRESTRICTED;
    $.getJSON(requestAddress, "", function(data) { callback(data); });
}