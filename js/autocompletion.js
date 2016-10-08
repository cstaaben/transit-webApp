// Create the autocomplete object and associate it with the UI input control.
// Restrict the search to the default country, and to place type "cities".

function initAutocomplete(){
    var options = {
        bounds: {north: 47.77548, east: -117.04168, south: 47.47, west: -117.725},
        componentRestrictions: {'country': 'us'}
    };

    new google.maps.places.Autocomplete((document.getElementById('inputLocationStops')), options);
    new google.maps.places.Autocomplete((document.getElementById('inputTripStarting')), options);
    new google.maps.places.Autocomplete((document.getElementById('inputTripDestination')),options);

}