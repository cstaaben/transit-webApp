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
        var lat = parseFloat(latLng[1]);
        var lng = parseFloat(latLng[0]);

        _map.panTo({lat: lat, lng: lng});
        google.maps.event.addListenerOnce(_map, "idle", function() {
            _map.setZoom(16);
        });

    }

    static setMarker(latLng, name) {

        var marker = new google.maps.Marker({
            position: {lat: parseFloat(latLng[1]), lng: parseFloat(latLng[0])},
            draggable: false,
            title: name,
            animation: google.maps.Animation.DROP
        });

        var infoWindow = new google.maps.InfoWindow();
        marker.addListener("click", function() {
            infoWindow.close();
            infoWindow.setContent(name);
            infoWindow.open(_map, marker);
        });
    }

    static drawBusStopsFromMarkers() {
        for (var key in _busStopMarkers) {
            if (_busStopMarkers.hasOwnProperty(key)) {
                _busStopMarkers[key].setMap(_map);
            }
        }
    }

    static drawBusStopsFromData(stops){
        console.log(stops);

        for (var stop = 0; stop < stops.length; stop++){
            MapManager.buildBusStopMarker(stops[stop]);
        }
        MapManager.drawBusStopsFromMarkers();
    }

    static buildBusStopMarker(busStop) {
        var lat = parseFloat(busStop.point.lat);
        var lng = parseFloat(busStop.point.lon);

        var marker = new google.maps.Marker({
            position: {lat: lat, lng: lng},
            draggable: false,
            icon: '../transit-webApp/img/bus_stop.png',
            title: busStop.name,
            animation: google.maps.Animation.DROP
        });

        var infoWindow = new google.maps.InfoWindow();
        marker.addListener("click", function() {
            infoWindow.close();
            infoWindow.setContent(busStop.name);
            infoWindow.open(_map, marker);
        });

        if (!_busStopMarkers.hasOwnProperty(busStop.abbr)) {
            _busStopMarkers[busStop.abbr] = marker;
        }
    }

}

const _onMapBoundsChanged = function() {
    console.log("bounds changed");
    var bounds = _map.getBounds();
    var northEast = bounds.getNorthEast();
    var southWest = bounds.getSouthWest();
    var northBound = northEast.lat();
    var eastBound = northEast.lng();
    var southBound = southWest.lat();
    var westBound = southWest.lng();

    MapManager.requestStopsInBounds(northBound, eastBound, southBound, westBound).then(function(data) {
        MapManager.drawBusStopsFromData(data);
    });
};