//planTrip
//Kevin Ungerecht
//audrey henry

var SPOKANE_COORDINATES = {
    lat: 47.6588,
    lng: -117.4260
};

var routeResults = null;

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

//TODO: change to semantic-ui warning message
function onDirectionsReceived(results, status) {
    if (status !== 'OK') {
        console.error("directionsResult status: " + status);
        console.error(results);
        return;
    }

    if (results.routes.length < 1) {
        console.log("no direction results received");
        return;
    }

    routeResults = results;                                                                 //save for rendering routes

    setupFavoriteButton(results);

    //show the first result
    var firstResult = buildRouteFromIndex(results, 0);
    $("#divMap").empty().show();
    map = initializeGMap();
    var directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    directionsRenderer.setDirections(firstResult);

    //build the route results interface
    for (var r = 0; r < results.routes.length; r++) {
        var routeRowId = '#rr' + r;
        var routeResult = buildRouteFromIndex(results, r);                                      //build route object
        $("#routesGrid").append(buildRouteHTML(routeResult.routes[0], r));                      //append route HTML
        $(routeRowId).click(function() { onRouteRowSelected(directionsRenderer, $(this)); });   //attach route handler
        
        setupDetailsButton(routeRowId, directionsRenderer);
    }

    $("#rr0").addClass('selected');
    //$("#divTripRoutesList").transition("swing down");
    $("#divTripRoutesList").show();
}

function setupDetailsButton(routeRowId, directionsRenderer){

    //wire button
    var detailsButton = $(routeRowId).find(".btnShowDetails");
    detailsButton.click(function(){
        var dirPanel = $(this).closest(".routeRow").next(".divDirectionsPanel")[0];
        if ($(this).find("i").hasClass("down")) {
            $(this).find("i").removeClass("down").addClass("up");

            $(".divDirectionsPanel.visible").transition("slide up");
            $(dirPanel).transition("slide down");
            directionsRenderer.setPanel(dirPanel);
        } else {
            $(this).find("i").removeClass("up").addClass("down");
            $(dirPanel).transition("slide down");
        }
    });
}

function buildTripFavId(orig, dest) {
	return {
		trip_orig: orig,
		trip_dest: dest
	};
}

//builds a route object from a given index and set of results
function buildRouteFromIndex(results, index) {
    var lat_lngs = results.routes[index].legs[0].steps[0].lat_lngs;
    var lat_lng_str = "";
    for (var ll = 0; ll < lat_lngs.length; ll++)
        lat_lng_str += lat_lngs[ll].lat() + ", " + lat_lngs[ll].lng() + "\n";

    return {
        geocoded_waypoints: results.geocoded_waypoints,
        routes: [results.routes[index]],
        status: results.status,
        request: results.request
    };
}

function setupFavoriteButton(results){
    var origin = results.request["origin"];
    var destination = results.request["destination"];

    var fi = buildTripFavId(origin, destination);
    var favId = JSON.stringify(fi);
    var routeFavBtn = $("#btnFavTrip");

    routeFavBtn.attr({
        "data-id": favId,
        "data-name": origin + " to " + destination
    });

    routeFavBtn.click(function() {
        var favoriteId = $.parseJSON($(this).attr("data-id"));
        var favoriteName = "Trip: " + $(this).attr("data-name");
        
        if(faveExists(favoriteName)) {
            $('#favExistsMsg').empty().append(favoriteName + ' is already in your favorites!');
            $('#favExistsAlert').modal('show');
        }
        else {
            $("#favSavedMsg").empty().append(favoriteName + " has been saved to your favorites.");
            $("#favSavedAlert").modal("show");
            addToFaves(favoriteName, favoriteId);
        }
    });

    routeFavBtn.click(onRouteFavorited);
}

function initializeGMap() {
    return new google.maps.Map(document.getElementById('divMap'), {
        zoom: 12,
        center: SPOKANE_COORDINATES,
        scrollwheel: false
    });
}

function buildRouteHTML(routeResult, routeIndex) {
    var routeRowId = "rr" + routeIndex + "";
    var fare = (routeResult.legs[0].hasOwnProperty("fare")) ? '<p class="routeFare">Fare: ' + routeResult.fare.text + '</p>' : '';
    var departureTime = routeResult.legs[0].departure_time.text;
    var arrivalTime = routeResult.legs[routeResult.legs.length-1].arrival_time.text;
    var duration = routeResult.legs[0].duration.text;
    var distance = routeResult.legs[0].distance.text;

    var routeRow = '<div class="routeRow five column row" id="' + routeRowId + '" data-route-number="' + routeIndex + '">' +
            '<div class="two wide column"><button class="ui icon button btn-bus"><i class="big bus icon"></i></button></div>' +
            '<div class="four wide column">' + departureTime + ' - ' + arrivalTime + '</div>' +
            '<div class="four wide column">' + duration + '</div>' +
            '<div class="three wide column">' + distance + '</div>' +
            '<div class="two wide column"><button class="btnShowDetails ui icon button" id="' + routeRowId + 'Details"' + '><i class="chevron down icon"></i></button></div>' +
        '</div>' +
        '<div class="divDirectionsPanel" id="' + routeRowId + 'dirPanel" style="display: none;"></div><br>';
    return routeRow;
}

function onRouteRowSelected(directionsRenderer, selectedRow){
    if (selectedRow.hasClass("selected"))
        return;                                                 //don't re-render

    $(".btnShowDetails").find("i").removeClass("up").addClass("down");
    $(".divDirectionsPanel.visible").transition("slide down");                   //close directions

    var routeNum = selectedRow.attr("data-route-number");
    directionsRenderer.setDirections(buildRouteFromIndex(routeResults, routeNum));

    $(".routeRow").removeClass('selected');
    selectedRow.addClass('selected');
}

function onRouteFavorited() {
    var routeRowRoute = $.parseJSON($(this).attr("value"));
    console.log("route favorited: " + routeRowRoute);
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