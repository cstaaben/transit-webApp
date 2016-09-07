function getRoutes() {
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
        $("#allRoutes").append(str);
    }

}// end onRoutesReceived

function getRoute() {
    var routeId = $("#allRoutes").val();
    $.get(
        "https://transit.land/api/v1/route_stop_patterns?&traversed_by=" +routeId,
        function(data) {
            var patterns = selectBestRouteStopPattern(data);
            initRouteMap(patterns);
        }
    );
}

//TODO: tame this megafunction
function initRouteMap(patterns) {
    //Estimate center of map as the center coordinates in the geometry.coordinates array
    var centerLon = patterns[0].geometry.coordinates[Math.floor(patterns[0].geometry.coordinates.length / 2)][0];
    var centerLat = patterns[0].geometry.coordinates[Math.floor(patterns[0].geometry.coordinates.length / 2)][1];
    var mapDiv = document.getElementById('divMap');
    map = new google.maps.Map(mapDiv, {
        center: {lat: centerLat, lng: centerLon},
        zoom: 12
    });

    $("#divMap").slideDown(500, function() {
        google.maps.event.trigger(map, 'resize');
        var bounds = new google.maps.LatLngBounds();
        var routeCoords = [];

        var stopIds = "";
        for (var p = 0; p < patterns.length; p++) {
            //Extend the boundaries of the map to include all of the stops
            //Also add each geometry point to the routeCoords, so we can draw the path
            for (var c = 0; c < patterns[p].geometry.coordinates.length; c++) {
                bounds.extend(new google.maps.LatLng(patterns[p].geometry.coordinates[c][1], patterns[p].geometry.coordinates[c][0]));
                routeCoords.push({lat: patterns[p].geometry.coordinates[c][1], lng: patterns[p].geometry.coordinates[c][0]})
            }

            //Build a string of all of the onestop_ids for the request
            for (var s = 0; s < patterns[p].stop_pattern.length; s++)
                stopIds += patterns[p].stop_pattern[s] + ",";
        }
        stopIds = stopIds.slice(0, stopIds.length-1);   //remove trailing comma

        //Request data for all of the stops in the route
        $.getJSON("https://transit.land/api/v1/stops?onestop_id=" + stopIds,
            function(data) {
                var stops = data.stops;
                var infoWindow = new google.maps.InfoWindow();

                //Create a marker for each of the stops and add it to the map.
                for (var i = 0; i < stops.length; i++) {
                    var newMarker = new google.maps.Marker({
                        position: {lat: stops[i].geometry.coordinates[1], lng: stops[i].geometry.coordinates[0]},
                        map: map,
                        title: stops[i].name
                    });

                    //Sort the routes by route name, so they show up in order when the user clicks on the marker
                    stops[i].routes_serving_stop.sort(function(a, b) {
                        return parseInt(a.route_name) - parseInt(b.route_name);
                    });

                    //get the routes served by a stop
                    var routes_served = "";
                    for (var j = 0; j < stops[i].routes_serving_stop.length; j++) {
                        routes_served += stops[i].routes_serving_stop[j].route_name;
                        if (j < stops[i].routes_serving_stop.length - 1) {
                            routes_served += ", ";
                        }
                    }

                    //add marker content
                    var content = '<div id="content"><h3 id="firstHeading" class="firstHeading">' + stops[i].name + '</h3><p>Connects with routes: ' + routes_served + ' </p></div>';
                    google.maps.event.addListener(newMarker, 'click', (function(newMarker, map, content) {
                        return function() {
                            infoWindow.close();
                            infoWindow.setContent(content);
                            infoWindow.open(map, newMarker);
                        };
                    }(newMarker, map, content)));

                    newMarker.setMap(map);
                }
            }
        );

        //Initialize the route path using the routeCoords
        var routePath = new google.maps.Polyline({
            path: routeCoords,
            geodesic: true,
            strokeColor: '#0099ff',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        routePath.setMap(map);      //Attach the path to the map
        map.fitBounds(bounds);      //Fit the map to include all of our coordinates

        //window.scrollTo(0, document.body.scrollHeight);

    });

    //Ok, it just pops down. I can't figure out how to make it slide down smoothly
    $("html, body").animate({scrollTop: $(document).height()}, 1000);

}

//chooses the "most correct" route_stop_pattern from a list of results, based on a set of criteria
//TODO: choose route based on schedule for date input
function selectBestRouteStopPattern(data){
    var routeStopPatterns = data.route_stop_patterns;
    if (routeStopPatterns.length === 1)
        return routeStopPatterns[0];

    //get routes which don't simply consist of n points for n stops
    //see the first two paragraphs of https://transit.land/documentation/datastore/routes-and-route-stop-patterns.html
    var roadbindingRoutes = routeStopPatterns.filter(function(routeStopPattern){
        return routeStopPattern.is_generated === false;
    });

    if (roadbindingRoutes.length === 1)
        return roadbindingRoutes;

    //get the route with the most GTFS Identifiers
    var bestRoute = getRouteWithMostGTFSIds(roadbindingRoutes);
    roadbindingRoutes.splice(roadbindingRoutes.indexOf(bestRoute),1);   //remove from list

    var GEOHASH_PRECISION = 7;      //7 chars of geohash precision for finding stops connecting "inbound" and "outbound" routes
    var bestRouteFirstStopGeohash = extractGeohashFromOnestopId(bestRoute.stop_pattern[0]).substr(0, GEOHASH_PRECISION);
    var bestRouteLastStopGeohash = extractGeohashFromOnestopId(bestRoute.stop_pattern[bestRoute.stop_pattern.length-1]).substr(0, GEOHASH_PRECISION);
    var bestRouteStartSectors = [bestRouteFirstStopGeohash];
        bestRouteStartSectors.push(GeoHash.calculateNeighborCodes(bestRouteFirstStopGeohash));
    var bestRouteEndSectors = [bestRouteLastStopGeohash];
        bestRouteEndSectors.push(GeoHash.calculateNeighborCodes(bestRouteLastStopGeohash));


    //find the outbound to its inbound or inbound to its outbound
    var potentialMateRoutes = roadbindingRoutes.filter(function(route){
        var mateStartGeohash = extractGeohashFromOnestopId(route.stop_pattern[0]).substr(0, GEOHASH_PRECISION);
        var mateEndGeohash = extractGeohashFromOnestopId(route.stop_pattern[route.stop_pattern.length-1]).substr(0, GEOHASH_PRECISION);

        return bestRouteStartSectors.indexOf(mateEndGeohash) > -1 && bestRouteEndSectors.indexOf(mateStartGeohash) > -1;
    });

    if (potentialMateRoutes.length === 0)
        return [bestRoute];

    var mateRoute = getRouteWithMostGTFSIds(potentialMateRoutes);

    return [bestRoute, mateRoute];
}

// onestop_ids have the form s-geohash-name
function extractGeohashFromOnestopId(onestop_id){
    onestop_id = onestop_id.substring(onestop_id.indexOf('-')+1);
    onestop_id = onestop_id.substring(0, onestop_id.indexOf('-'));
    return onestop_id;
}

function getRouteWithMostGTFSIds(routes){
    var max_GTFS_Ids = 0;
    for (var r = 0; r < routes.length; r++){
        var num_GTFS_Ids = $.grep(routes[r].identifiers,
            function(identifier){ return identifier.startsWith("gtfs://"); }).length;

        if (num_GTFS_Ids > max_GTFS_Ids){
            max_GTFS_Ids = num_GTFS_Ids;
            routeWithMostGTFSIds = routes[r];
        }
    }

    return routeWithMostGTFSIds;
}