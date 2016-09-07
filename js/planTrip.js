//planTrip
//Kevin Ungerecht
//audrey henry

var SPOKANE_COORDINATES = {
    lat: 47.6588,
    lng: -117.4260
};

//this is the only function called from outside this file
//TODO: encapsulate the rest
function getTrips(origin, dest, date, time, sortArrivingElseDeparting) {

    var directionsService = new google.maps.DirectionsService();
    var timeFormatted = concatDateTime(date, time);
    var options = {
        modes: ['BUS'],
        routingPreference: 'LESS_WALKING'
    };
    (sortArrivingElseDeparting) ? options.arrivalTime = timeFormatted : options.departureTime = timeFormatted;

    var request = {
        origin: origin,
        destination: dest,
        travelMode: 'TRANSIT',
        transitOptions: options,
        provideRouteAlternatives: true
    };

    directionsService.route(request, onDirectionsReceived);
}

//TODO: change to bootstrap alert or validation message
function onDirectionsReceived(results, status) {
    console.log("results");
    console.log(results);
    if (status !== 'OK') {
        window.alert("Houston we have a problem");
        console.error("directionsResult status: " + status);
        console.error(results);
        return;
    }

    if (results.routes.length < 1) {
        console.log("no direction results received");
        return;
    }

    var selectedRoute = 0;
    var firstResult = buildRouteFromIndex(results, 0);
    $("#divMap").empty().show();
    map = initializeGMap();
    var directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    directionsRenderer.setDirections(firstResult);

    for (var r = 0; r < results.routes.length; r++) {
        var routeResult = buildRouteFromIndex(results, r);
        $("#routes").append(buildRouteHTML(routeResult.routes[0], r));

        //add handlers to route rows
        $('#rr' + r).click(function() {
            var routeRowId = $(this).attr("id");
            routeRowId = parseInt(routeRowId.slice(-1));

            //don't redraw selected route
            if (routeRowId === selectedRoute)
                return;

            directionsRenderer.setDirections(buildRouteFromIndex(results, routeRowId));
            console.log(directionsRenderer.getDirections());
            selectedRoute = routeRowId;

            $(".pRoutesRow").removeClass('selected');
            $(this).addClass('selected');
        });

        //add handlers to route "favorite" buttons
        $('#pRoutesAddFave' + r).click(onRouteFavorited);
    }
    $("#rr"+ selectedRoute).addClass('selected');

    $("#divRoutesList").show();
}

//builds a route object from a given index and set of results
function buildRouteFromIndex(results, index) {
    console.log("buildRouteFromIndex: " + index);
    console.log(results);

    var lat_lngs = results.routes[index].legs[0].steps[0].lat_lngs;
    var lat_lng_str = "";
    for (var ll = 0; ll < lat_lngs.length; ll++)
        lat_lng_str += lat_lngs[ll].lat() + ", " + lat_lngs[ll].lng() + "\n";

    console.info(lat_lng_str);

    return {
        geocoded_waypoints: results.geocoded_waypoints,
        routes: [results.routes[index]],
        status: results.status,
        request: results.request
    };
}

function initializeGMap() {
    return new google.maps.Map(document.getElementById('divMap'), {
        zoom: 12,
        center: SPOKANE_COORDINATES,
        scrollwheel: false
    });
}

function buildRouteHTML(routeResult, routeIndex) {
    var stepString = "";
    for (var s = 0; s < routeResult.legs[0].steps.length; s++) {
        if (routeResult.legs[0].steps[s].travel_mode === "TRANSIT") {
            stepString += '<i class="ui big bus icon pRouteBusIcon"></i>';// <p> ' + routeResult.legs[0].steps[s].transit.line.short_name + ' </p>'; //TODO: integrate into display; make it look nice
        }
    }

    var routeRowId = "rr" + routeIndex + "";
    var fare = (routeResult.legs[0].hasOwnProperty("fare")) ? '<p class="routeFare">Fare: ' + routeResult.fare.text + '</p>' : '';
    var routeRow = '<div class="pRoutesRow" id="' + routeRowId + '">' +
        stepString +
        '<p class="routeDtoA">' + routeResult.legs[0].departure_time.text + ' - ' + routeResult.legs[0].arrival_time.text + '</p>' +
        '<p class="routeDur">' + routeResult.legs[0].duration.text + '</p>' +
        fare +
        '<p class="routeDist">' + routeResult.legs[0].distance.text + '</p>' +
        '</div><br>';
    return routeRow;
}

//TODO: implement saving routes
function onRouteFavorited() {
    var routeRowRoute = $.parseJSON($(this).attr("value"));
    console.log("route favorited: " + routeRowRoute);
    //var routeRow = $(this).attr("id");
    //routeRow = parseInt(routeRow.slice(-1));
}

function concatDateTime(date, time) {

    var splitDate = date.split("-");
    var year = splitDate[0];
    var month = splitDate[1]--;
    var day = splitDate[2];

    var splitTime = time.split(":");
    var hour = splitTime[0];
    var min = splitTime[1];

    return new Date(year, month, day, hour, min);
}