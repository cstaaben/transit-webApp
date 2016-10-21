function requestRoutes() {
    var link = "https://transit.land/api/v1/routes?operated_by=o-c2kx-spokanetransitauthority";
    $.getJSON(link, "", onRoutesReceived);
}

function onRoutesReceived(data) {
    var routes = data.routes;
    var necessaryRouteData = [];

    //Iterates through the array to get all of the route numbers & names
    for (var r = 0; r < routes.length; r++) {
        var num = routes[r].name;
        var longName = routes[r].tags.route_long_name;
        var id = routes[r].onestop_id;

        //Fills Array with all stops
        necessaryRouteData[r] = {
            "num": num,
            "longName": longName,
            "id": id
        };
    }

    //Sort the Array
    necessaryRouteData.sort(function(a, b) {
        return a.num - b.num;
    });

    //Populates the Form
    for (var x = 0; x < necessaryRouteData.length; x++) {
        var str = "<option value = '" + necessaryRouteData[x].id + "'>" + necessaryRouteData[x].num + " - " + necessaryRouteData[x].longName + "</option>";
        $("#allRoutesList").append(str);
    }

    if (!data.hasOwnProperty("next"))
        $("#divGetFullRoute").removeClass("loading");

}// end onRoutesReceived

function initRouteMap(routeId, routeGeometry) {
    drawRoute(routeGeometry);
    drawBuses(routeId);
    //TODO: draw stops

    $("#divRoutesLoader").removeClass("active");
}

function getViewportBound(boundA, boundB){
    return (Math.abs(boundA) > Math.abs(boundB)) ? boundA : boundB;
}

function drawRoute(routeGeometry){
    var dir0 = routeGeometry[0];
    var dir1 = routeGeometry[1];
    var latCenter = dir0['latCenter'];
    var lonCenter = dir1['lonCenter'];

    var dir0lines = buildPolylines(dir0['Points'], dir0['Color']);
    var dir1lines = buildPolylines(dir1['Points'], dir1['Color']);

    $.each(dir0lines, function(index, value){value.setMap(map);});
    $.each(dir1lines, function(index, value){value.setMap(map);});

    var northBound = getViewportBound(dir0['latNorth'], dir1['latNorth']);
    var eastBound = getViewportBound(dir0['lonEast'], dir1['lonEast']);
    var southBound = getViewportBound(dir0['latSouth'], dir1['latSouth']);
    var westBound = getViewportBound(dir0['lonWest'], dir1['lonWest']);


    initMapWithBounds(latCenter, lonCenter, northBound, eastBound, southBound, westBound);
}

//region route functions

function buildPolylines(routeSegments, color){
    var polylines = [];
    for (var i = 0; i < routeSegments.length; i++) {
        polylines.push(
            new google.maps.Polyline({
                path: routeSegments[i],
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: 2
            })
        );
    }
    return polylines;
}

function buildBusMarkersForDirection(direction){
    var busMarkers = [];
    for (var i = 0; i < direction.length; i++) {
        busMarkers.push(
            new google.maps.Marker({
                position: {lat: direction[i].lat, lng: direction[i].lng},
                map: map,
                icon: {url:"/transit-webApp/img/ic_directions_bus.png", anchor: new google.maps.Point(12,12)}
            })
        );

        busMarkers.push(
            new google.maps.Marker({
                position: {lat: direction[i].lat, lng: direction[i].lng},
                map: map,
                icon: {
                    anchor: new google.maps.Point(0,10),
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 2,
                    rotation: direction[i].heading}
            })
        );
    }
    return busMarkers;
}

//endregion

//region bus functions

var busDataIntervalId = -1;

function drawBuses(routeId){
    fetchBusData(routeId);
    if (busDataIntervalId != -1)
        clearInterval(busDataIntervalId);
    busDataIntervalId = setInterval(function(){fetchBusData(routeId);}, 10 * 1000);     //update every 10 seconds
}

function fetchBusData(routeId){
    requestBusData(routeId).then(function(data){addBusMarkers(data);});
}

var busMarkers = [];

function addBusMarkers(busCoords){
    var bc_keys = Object.keys(busCoords);
    var dir0 = busCoords[bc_keys[0]];
    var dir1 = busCoords[bc_keys[1]];
    var newBusMarkers = buildBusMarkersForDirection(dir0).concat(buildBusMarkersForDirection(dir1));

    //clear existing markers before adding new ones
    for (var m = 0; m < busMarkers.length; m++)
        busMarkers[m].setMap(null);

    $.each(newBusMarkers, function(index, value){value.setMap(map);});
    busMarkers = newBusMarkers;
}

//endregion