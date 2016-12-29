//getStopData.js
//ahenry
//comment

//SHELVED: until STA gets it together and adds their stops back to transit.land

function getStops(lat, lon, submitDate, submitTime) {

    var STOP_SEARCH_RADIUS = 250;   //search within 250 meters of given GPS coords

    if (isNaN(lat) || isNaN(lon)) {
        console.error("one or both of these are NaN. lat: " + lat + "; lng: " + lng);
        return;
    }

    var url = "https://transit.land/api/v1/stops?lat=" + lat + "&lon=" + lon + "&r=" + STOP_SEARCH_RADIUS;
    $.getJSON(url,
        function(data) {

            // Paragraph version of parsing data
            $("#divStops").empty();
            $.each(data.stops, function(index, stop) {
                $("#divStops").append("<h2>" + stop.name + "</h2><input type=\"button\"" +
                    " data-coords=\"" + stop.geometry.coordinates + "\" value=\"View Map\"" +
                    " class=\"viewStopBtn ui mini blue button\">" +
                    '<button class="btnAddFave ui icon button" id="stopAddFave' + index + '"><i class="star icon"></i></button>' +
                    "<br><table id=\"" +
                    jq_id(stop.onestop_id) + "\" border=\"1\"" + " class=\"tblFindStops\">" +
                    "<thead><th>Route</th><th>Time</th><th></th></thead><tbody></tbody></table>");


                $("#stopAddFave" + index).click(function() {
                    var stopName = "Stop: ";
                    stopName += stop.name;
                    var stopId = stop.onestop_id;

                if (faveExists(stopName)) {//route exists in favorites already
                   //alert(stopName + " is already in your favorites!");
                   $('.ui.modal').modal('show');
                } else {
                   addToFaves(stopName, stopId);
                }

                });

                getDepartures(stop, submitDate, submitTime);
            });

            $(".viewStopBtn").click(function() {

                var latLng = $(this).attr("data-coords");
                var t = latLng.split(",");

                initMap();
                moveMap(t);
                //google.maps.event.trigger(map, "resize");
                setMarker(t, stop.name);
            });

            $(".routeViewBtn").click(function() {
                console.log("click");
                $("#divStops").slideUp(500);
                $(".getRouteMenu").trigger("click");
                $("#allRoutes").val($("option[value=\"" + $(this).attr("data-id") + "\"]").val());
                $("#btnRouteSubmit").trigger("click");
            });

            $(".routeAddFave").click(function() {
                var fArray = getFavorites();
                var routeName = "Route: ";
                routeName += $(this).attr("value");
                var routeId = $(this).attr("data-id");

                if (fArray === undefined) {//favorites is empty
                    addToFaves(routeName, routeId);
                } else {
                    if (faveExists(routeName)) {//route exists in favorites already
                        alert(routeName + " is already in your favorites!");
                    } else {
                        addToFaves(routeName, routeId);
                    }
                }
            });

            $("#divStopsSegment").removeClass("loading");
            $("#btnSubmitStops").removeClass("loading").removeClass("disabled");
            $("#divStops:hidden").transition("slide left");

    }); //end callback
}   //end getStops

function getDepartures(stop, submitDate, submitTime) {

    var t = submitTime.split(":");
    var e = parseInt(t[0]) + 3;
    var resTime = (e-4) + ":" + t[1] + ":" + t[2] + "," + e + ":" + t[1] + ":" + t[2];
    

    var url = "https://transit.land/api/v1/schedule_stop_pairs?operator_onestop_id=o-c2kx-spokanetransitauthority&origin_onestop_id=" +
            stop.onestop_id + "&date=" + submitDate + "&origin_departure_between=" + resTime;

    $.get({
        url: url,
        success: function(data) {
            buildRouteList(data, stop);
        },
        dataType: "json",
        async: false
    });

}

//TODO: clean megafunction buildRouteList()
function buildRouteList(data, stop) {
    var dest;
    var pid;
    var rids = [];

    $.each(data.schedule_stop_pairs, function(i, p) {
        if ($.inArray(p.route_onestop_id, rids) < 0) {
            rids.push(p.route_onestop_id);
        }
    });

    $.each(stop.routes_serving_stop, function(i, route) {
        pid = jq_id(route.route_onestop_id);

        if ($.inArray(pid, rids) != -1) {

            $.each(data.schedule_stop_pairs, function(j, pair) {
                if (pair.route_onestop_id == route.route_onestop_id) {
                    dest = pair.trip_headsign;
                }
            });

            // Paragraph Version
            $.each(data.schedule_stop_pairs, function(j, pair) {
                if (jq_id(pair.route_onestop_id) == pid) {
                    var rName = route.route_name + " - " + dest;
                    $("table#" + jq_id(stop.onestop_id) + " tbody").append("<tr><td>" + rName + "</td><td>" +
                        convertTime(pair.origin_arrival_time) + "</td><td> " +
                        "<input type=\"button\"" + " class=\"routeViewBtn  ui" +
                        " mini blue button\" data-id=\"" + pid + "\" value=\"View Route\">" +
                        "<button class='routeAddFave btnAddFave ui icon button' value=\"" + rName + "\" data-id=\"" + 
                        pid + "\"><i class='star icon'></i></button></td></tr>");
                }
            });
        } // end if inArray

    }); // end .each(stop.routes)

}

function buildSchedule(data) {
    var row;
    var pairs = data.schedule_stop_pairs;

    pairs.sort(function(a, b) {
        var x = parseInt(a.origin_arrival_time.split(":")[0]);
        var y = parseInt(b.origin_arrival_time.split(":")[0]);

        if (x == y) {
            var s = parseInt(a.origin_arrival_time.split(":")[1]);
            var t = parseInt(b.origin_arrival_time.split(":")[1]);

            return s - t;
        }
        else {
            return x - y;
        }
    });

    $.each(data.schedule_stop_pairs, function(i, pair) {
        $("#" + jq_id(pair.origin_onestop_id)).append("<td>" + convertTime(pair.origin_departure_time) +
            "</td>");
    });
}

// cleans any "troublesome" characters from onestop_ids and escapes them, or replaces "~" with "_"
function jq_id(id) {
    var s = id.replace(/(:|\.|\[|\]|,)/g, "\\$1");
    return s.replace(/~/g, "_");
}

//credit to user HBP on StackOverflow for conversion code base
function convertTime(time) {
    //Checks correct time format and splits into components
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) {                      // If time format correct
        time = time.slice(1);                   // Remove full string match value
        time[5] = +time[0] < 12 ? 'AM' : 'PM';  // Set AM/PM
        time[0] = +time[0] % 12 || 12;          // Adjust hours
    }
    return time.join('');                       // return adjusted time or original string
}
