import Requester from './Requester.js';


let _map = {};
let _busStopMarkers = {};

export default class MapManager {

    static getMap(){
        return _map;
    }

    static initMap() {
        const mapDiv = document.getElementById('divMap');
        _map = new google.maps.Map(mapDiv, {
            center: {lat: 47.658779, lng: -117.426048},
            zoom: 10
        });

        $("#divMap").show();
    }

    static initMapWithBounds(latCenter, lonCenter, northBound, eastBound, southBound, westBound) {
        const bound = {north: northBound, east: eastBound, south: southBound, west: westBound};

        const myStyles = [
            {
                featureType: "transit.station.bus",
                elementType: "labels",
                stylers: [
                    {visibility: "off"}
                ]
            }
        ];

        $("#divMap").empty().transition("fly right in");

        const mapDiv = document.getElementById('divMap');
        _map = new google.maps.Map(mapDiv, {
            center: {lat: latCenter, lng: lonCenter},
            zoom: 12,
            styles: myStyles
        });

        _map.fitBounds(bound);

        this.drawBusStopsFromMarkers();
    }

    ///Callback: method to pass the stops now in view
    static updateStopsWhenNecessary() {
        _map.addListener('dragend', function() {
            _onMapBoundsChanged();
        });
        _map.addListener('zoom_changed', function() {
            _onMapBoundsChanged();
        });
    }

    static moveMap(latLng) {
        const lat = parseFloat(latLng[1]);
        const lng = parseFloat(latLng[0]);

        _map.panTo({lat: lat, lng: lng});
        google.maps.event.addListenerOnce(_map, "idle", function() {
            _map.setZoom(16);
        });

    }

    static setMarker(latLng, name) {

        const marker = new google.maps.Marker({
            position: {lat: parseFloat(latLng[1]), lng: parseFloat(latLng[0])},
            draggable: false,
            title: name,
            animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow();
        marker.addListener("click", function() {
            infoWindow.close();
            infoWindow.setContent(name);
            infoWindow.open(_map, marker);
        });
    }

    static drawBusStopsFromMarkers() {
        for (let key in _busStopMarkers) {
            if (_busStopMarkers.hasOwnProperty(key)) {
                _busStopMarkers[key].setMap(_map);
            }
        }
    }

    static drawBusStopsFromData(stops){
        console.log(stops);

        for (let stop = 0; stop < stops.length; stop++){
            MapManager.buildBusStopMarker(stops[stop]);
        }
        MapManager.drawBusStopsFromMarkers();
    }

    static buildBusStopMarker(busStop) {
        const lat = parseFloat(busStop.point.lat);
        const lng = parseFloat(busStop.point.lon);

        const marker = new google.maps.Marker({
            position: {lat: lat, lng: lng},
            draggable: false,
            icon: '../transit-webApp/img/bus_stop.png',
            title: busStop.name,
            animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow();
        marker.addListener("click", function() {
            infoWindow.close();
            infoWindow.setContent(busStop.name);
            infoWindow.open(_map, marker);
        });

        if (!_busStopMarkers.hasOwnProperty(busStop.abbr)) {
            _busStopMarkers[busStop.abbr] = marker;
        }
    }

    static getViewportBound(boundA, boundB){
        return (Math.abs(boundA) > Math.abs(boundB)) ? boundA : boundB;
    };

}

const _onMapBoundsChanged = function() {
    console.log("bounds changed");
    const bounds = _map.getBounds();
    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const northBound = northEast.lat();
    const eastBound = northEast.lng();
    const southBound = southWest.lat();
    const westBound = southWest.lng();

    Requester.requestStopsInBounds(northBound, eastBound, southBound, westBound).then(function(data) {
        MapManager.drawBusStopsFromData(data);
    });
};