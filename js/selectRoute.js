function getRoutes() {
    var link = "https://transit.land/api/v1/routes?operated_by=o-c2kx-spokanetransitauthority";
    $.getJSON(link, "", onRoutesReceived);
}

function onRoutesReceived(data) {
    console.log(data);
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
        $("#allRoutes").append(str);
    }

}// end onRoutesReceived

function getRoute() {
    var routeId = $("#allRoutes").val();
    console.log(routeId);
    var jqXHR1 = getRouteGeometry(routeId);
    var jqXHR2 = getStopsForRoute(routeId);
    var jqXHR3 = getBusData(routeId);

    $(document).ajaxStop(function(){
        var routeGeometry = $.parseJSON(jqXHR1.responseText);
        var routeStops = $.parseJSON(jqXHR2.responseText);
        var busData = $.parseJSON(jqXHR3.responseText);
        initRouteMap(routeId, routeGeometry, routeStops, busData);
    });
}

function addBusesToMap(busCoords){
    var busMarker = new google.maps.Marker({
        position: {lat: busCoords.lat, lng: busCoords.lng},
        map: map,
        icon: "../img/ic_directions_bus.png"
    });
    busMarker.setMap(map);
}

function initRouteMap(routeId, routeGeometry, routeStops, busData) {
    drawRoute(routeGeometry);
    //TODO: draw stops
    //TODO: draw bus and periodically update

    //TODO: scroll down to map
    //$("html, body").animate({scrollTop: $(document).height()}, 1000);

}

function drawRouteSegments(routeSegments, color){
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

function getBound(boundA, boundB){
    return (Math.abs(boundA) > Math.abs(boundB)) ? boundA : boundB;
}

function drawRoute(routeGeometry){
    var rg_keys = Object.keys(routeGeometry);
    var dir0 = routeGeometry[rg_keys[0]];
    var dir1 = routeGeometry[rg_keys[1]];
    var latCenter = dir0['latCenter'];
    var lonCenter = dir1['lonCenter'];

    var mapDiv = document.getElementById('divMap');
    map = new google.maps.Map(mapDiv, {
        center: {lat: latCenter, lng: lonCenter},
        zoom: 12
    });

    $("#divMap").slideDown(500);

    var dir0lines = drawRouteSegments(dir0['Points'], dir0['Color']);
    var dir1lines = drawRouteSegments(dir1['Points'], dir1['Color']);

    $.each(dir0lines, function(index, value){value.setMap(map);});
    $.each(dir1lines, function(index, value){value.setMap(map);});

    var northBound = getBound(dir0['latNorth'], dir1['latNorth']);
    var eastBound = getBound(dir0['lonEast'], dir1['lonEast']);
    var southBound = getBound(dir0['latSouth'], dir1['latSouth']);
    var westBound = getBound(dir0['lonWest'], dir1['lonWest']);
    var bound = {north: northBound, east: eastBound, south: southBound, west: westBound};
    map.fitBounds(bound);
}