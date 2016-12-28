//planTrip
//Kevin Ungerecht
//audrey henry

import FavoritesManager from './FavoritesManager.js';

const _SPOKANE_COORDINATES = {
    lat: 47.6588,
    lng: -117.4260
};

let _routeResults = null;
let _map = null;

export default class TripPlanner {
    static requestTrips(origin, dest, date, time, sortArrivingElseDeparting, map) {
        _map = map;

        const directionsService = new google.maps.DirectionsService();
        const timeFormatted = _concatDateTime(date, time);
        const options = {
            modes: ['BUS'],
            routingPreference: 'LESS_WALKING'
        };
        (sortArrivingElseDeparting) ? options.arrivalTime = timeFormatted : options.departureTime = timeFormatted;

        const request = {
            origin: origin,
            destination: dest,
            travelMode: 'TRANSIT',
            transitOptions: options,
            provideRouteAlternatives: true
        };

        directionsService.route(request, _onDirectionsReceived);
    }
}

//TODO: change to semantic-ui warning message
const _onDirectionsReceived = function(results, status) {
    const btnSubmitTrip = $("#btnSubmitTrip");

    if (status !== 'OK') {
        console.error("directionsResult status: " + status);
        console.error(results);
        btnSubmitTrip.removeClass("disabled").removeClass("loading");
        return;
    }

    if (results.routes.length < 1) {
        console.log("no direction results received");
        btnSubmitTrip.removeClass("disabled").removeClass("loading");
        return;
    }

    _routeResults = results;                                                             //save for rendering routes
    _setupFavoriteButton(results);

    $("#divTripRoutesList").transition("fly left in");
    $("#divMap").transition("fly right in");

    //initialize map and set directions for first result
    const firstResult = _buildRouteFromIndex(results, 0);
    _map = _initializeGMap();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(_map);
    directionsRenderer.setDirections(firstResult);

    //build the route results interface
    for (let r = 0; r < results.routes.length; r++) {
        const routeRowId = '#rr' + r;
        const routeResult = _buildRouteFromIndex(results, r);                                      //build route object
        $("#routesGrid").append(_buildRouteHTML(routeResult.routes[0], r));                      //append route HTML
        $(routeRowId).click(function() {
            _onRouteRowSelected(directionsRenderer, $(this));
        });   //attach route handler

        _setupDetailsButton(routeRowId, directionsRenderer);
    }

    $("#rr0").addClass('selected');
    btnSubmitTrip.removeClass("disabled").removeClass("loading");
};

const _setupDetailsButton = function(routeRowId, directionsRenderer) {
    //wire button
    const detailsButton = $(routeRowId).find(".btnShowDetails");
    detailsButton.click(function() {
        const dirPanel = $(this).closest(".routeRow").next(".divTripDirectionsPanel")[0];
        if ($(this).find("i").hasClass("down")) {
            $(this).find("i").removeClass("down").addClass("up");

            $(".divTripDirectionsPanel.visible").transition("slide up");
            $(dirPanel).transition("slide down");
            directionsRenderer.setPanel(dirPanel);
        } else {
            $(this).find("i").removeClass("up").addClass("down");
            $(dirPanel).transition("slide down");
        }
    });
};

const _buildTripFavId = function(orig, dest) {
    return {
        trip_orig: orig,
        trip_dest: dest
    };
};

//builds a route object from a given index and set of results
const _buildRouteFromIndex = function(results, index) {
    const lat_lngs = results.routes[index].legs[0].steps[0].lat_lngs;
    let lat_lng_str = "";
    for (let ll = 0; ll < lat_lngs.length; ll++)
        lat_lng_str += lat_lngs[ll].lat() + ", " + lat_lngs[ll].lng() + "\n";

    return {
        geocoded_waypoints: results.geocoded_waypoints,
        routes: [results.routes[index]],
        status: results.status,
        request: results.request
    };
};

const _setupFavoriteButton = function(results) {
    const origin = results.request["origin"];
    const destination = results.request["destination"];

    const fi = _buildTripFavId(origin, destination);
    const favId = JSON.stringify(fi);
    const routeFavBtn = $("#btnFavTrip");

    routeFavBtn.attr({
        "data-id": favId,
        "data-name": origin + " to " + destination
    });

    routeFavBtn.click(function() {
        const favoriteId = $.parseJSON($(this).attr("data-id"));
        const favoriteName = "Trip: " + $(this).attr("data-name");

        if (FavoritesManager.favoriteExists(favoriteName)) {
            $('#favExistsMsg').empty().append(favoriteName + ' is already in your favorites!');
            $('#favExistsAlert').modal('show');
        }
        else {
            $("#favSavedMsg").empty().append(favoriteName + " has been saved to your favorites.");
            $("#favSavedAlert").modal("show");
            FavoritesManager.addToFavorites(favoriteName, favoriteId);
        }
    });

    routeFavBtn.click(_onRouteFavorited);
};

const _initializeGMap = function() {
    return new google.maps.Map(document.getElementById('divMap'), {
        zoom: 12,
        center: _SPOKANE_COORDINATES,
        scrollwheel: false
    });
};

const _buildRouteHTML = function(routeResult, routeIndex) {
    const routeRowId = "rr" + routeIndex + "";
    const fare = (routeResult.legs[0].hasOwnProperty("fare")) ? '<p class="routeFare">Fare: ' + routeResult.fare.text + '</p>' : '';
    const departureTime = routeResult.legs[0].departure_time.text;
    const arrivalTime = routeResult.legs[routeResult.legs.length - 1].arrival_time.text;
    const duration = routeResult.legs[0].duration.text;
    const distance = routeResult.legs[0].distance.text;

    const routeRow = '<div class="routeRow row" id="' + routeRowId + '" data-route-number="' + routeIndex + '">' +
        '<div class="two wide column"><button class="ui icon button btn-bus"><i class="big bus icon"></i></button></div>' +
        '<div class="four wide column">' + departureTime + ' \- ' + arrivalTime + '</div>' +
        '<div class="four wide column">' + duration + '</div>' +
        '<div class="three wide column">' + distance + '</div>' +
        '<div class="two wide column"><button class="btnShowDetails ui icon button" id="' + routeRowId + 'Details"' + '><i class="chevron down icon"></i></button></div>' +
        '</div>' +
        '<div class="divTripDirectionsPanel" id="' + routeRowId + 'dirPanel" style="display: none;"></div><br>';
    return routeRow;
};

const _onRouteRowSelected = function(directionsRenderer, selectedRow) {
    if (selectedRow.hasClass("selected"))
        return;                                                 //don't re-render

    $(".btnShowDetails").find("i").removeClass("up").addClass("down");
    $(".divTripDirectionsPanel.visible").transition("slide down");                   //close directions

    const routeNum = selectedRow.attr("data-route-number");
    directionsRenderer.setDirections(_buildRouteFromIndex(_routeResults, routeNum));

    $(".routeRow").removeClass('selected');
    selectedRow.addClass('selected');
};

const _onRouteFavorited = function() {
    const routeRowRoute = $.parseJSON($(this).attr("value"));
    console.log("route favorited: " + routeRowRoute);
};

const _concatDateTime = function(date, time) {
    const splitDate = date.split("-");
    const year = splitDate[0];
    const month = splitDate[1]--;
    const day = splitDate[2];

    const splitTime = time.split(":");
    const hour = splitTime[0];
    const min = splitTime[1];

    return new Date(year, month, day, hour, min);
};