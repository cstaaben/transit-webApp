import MapManager from './MapManager-compiled.js';
import Requester from './Requester-compiled.js';

export default class RouteManager {
    static populateListWithRoutes(list){
        $.getJSON(_routesURL, "", function(data){ _onRoutesReceived(data, list); });
    }

    static renderRouteToMap(routeId, routeGeometry, map){
        _renderRoute(routeGeometry);
        _drawBuses(routeId);
        //TODO: draw stops

        $("#divRoutesLoader").removeClass("active");
    }

    static stopRequestingBusData(){
        clearInterval(busDataIntervalId);
    }
}

const _routesURL = "https://transit.land/api/v1/routes?operated_by=o-c2kx-spokanetransitauthority";

const _onRoutesReceived = function(data) {
    const routes = data.routes;
    let necessaryRouteData = [];

    //Iterates through the array to get all of the route numbers & names
    for (let r = 0; r < routes.length; r++) {
        const num = routes[r].name;
        const longName = routes[r].tags.route_long_name;
        const id = routes[r].onestop_id;

        if (isNaN(parseInt(num)))                       //transit.land has routes with "X" in name, but STA doesn't - no lineDirInfo for such lines
            continue;

        //Fills Array with all stops
        necessaryRouteData[r] = {
            "num": num,
            "longName": longName,
            "id": id
        };
    }

    //Sort the Array
    necessaryRouteData.sort(function(a, b){
        if (!isNaN(parseInt(a.num)) && !isNaN(parseInt(b.num)))
            return a.num - b.num;
        else {
            if (a.num > b.num)
                return 1;
            if (a.num < b.num)
                return -1;
            return 0;
        }
    });

    //Populates the Form
    for (let x = 0; x < necessaryRouteData.length; x++) {
        const str = "<option value = '" + necessaryRouteData[x].id + "'>" + necessaryRouteData[x].num + " - " + necessaryRouteData[x].longName + "</option>";
        $("#allRoutesList").append(str);
    }

    if (!data.hasOwnProperty("next"))
        $("#divGetFullRoute").removeClass("loading");

};

//TODO: put in map
const _getViewportBound = function(boundA, boundB){
    return (Math.abs(boundA) > Math.abs(boundB)) ? boundA : boundB;
};

const _renderRoute = function(routeGeometry){
    const dir0 = routeGeometry[0];
    const dir1 = routeGeometry[1];
    const latCenter = dir0['latCenter'];
    const lonCenter = dir0['lonCenter'];

    const dir0lines = _buildPolylines(dir0['Points'], dir0['Color']);
    const dir1lines = _buildPolylines(dir1['Points'], dir1['Color']);

    const northBound = _getViewportBound(dir0['latNorth'], dir1['latNorth']);
    const eastBound = _getViewportBound(dir0['lonEast'], dir1['lonEast']);
    const southBound = _getViewportBound(dir0['latSouth'], dir1['latSouth']);
    const westBound = _getViewportBound(dir0['lonWest'], dir1['lonWest']);

    MapManager.initMapWithBounds(latCenter, lonCenter, northBound, eastBound, southBound, westBound);

    let map = MapManager.getMap();

    $.each(dir0lines, function(index, value){value.setMap(map);});
    $.each(dir1lines, function(index, value){value.setMap(map);});
};

//region route functions

const _buildPolylines = function(routeSegments, color){
    let polylines = [];
    for (let i = 0; i < routeSegments.length; i++) {
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
};

const _buildBusMarkersForDirection = function(direction){
    let busMarkers = [];
    let map = MapManager.getMap();
    for (let i = 0; i < direction.length; i++) {
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
};

//endregion

//region bus functions

var busDataIntervalId = -1;

const _drawBuses = function(routeId){
    fetchBusData(routeId);
    if (busDataIntervalId != -1)
        clearInterval(busDataIntervalId);
    busDataIntervalId = setInterval(function(){fetchBusData(routeId);}, 10 * 1000);     //update every 10 seconds
};

//TODO: handle bad response
function fetchBusData(routeId){
    Requester.requestBusData(routeId).then(function(data){_addBusMarkers(data);});
}

var busMarkers = [];

const _addBusMarkers = function(busCoords){
    const bc_keys = Object.keys(busCoords);
    const dir0 = busCoords[bc_keys[0]];
    const dir1 = busCoords[bc_keys[1]];
    const newBusMarkers = _buildBusMarkersForDirection(dir0).concat(_buildBusMarkersForDirection(dir1));

    //clear existing markers before adding new ones
    for (let m = 0; m < busMarkers.length; m++)
        busMarkers[m].setMap(null);

    let map = MapManager.getMap();
    $.each(newBusMarkers, function(index, value){value.setMap(map);});
    busMarkers = newBusMarkers;
};

//endregion
