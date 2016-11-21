//TODO: cool stuff:
//when routes are requested, load them and their stops into memory here before drawing
//when a user uses "Find stops", let them pick a stop, then draw the routes serviced by that stop, and their stops

import RouteManager from './RouteManager-compiled.js';
import FavoritesManager from './FavoritesManager-compiled.js';
import Requester from './Requester-compiled.js';
import MapManager from './MapManager-compiled.js';

var map;

//region initialization

$(document).ready(function() {
    new FavoritesManager();

    $(".menu .item").tab(); //initialize semantic-ui tabs

    //fetch and populate
    RouteManager.populateListWithRoutes();// requestRoutes();
    populateDateTimeFieldsForDiv("#divPlanTrip");

    //setup event handlers
    initMenuHandlers();
    $("#btnSubmitTrip").click(onSubmitTrip);
    $("#allRoutesList").change(onSubmitRoute);
    $("#btnSubmitStops").click(onSubmitStops);
    $("#btnAddFaveRoute").click(onSaveFavoriteRoute);
    $("#favExistsBtn").click(function() { $("#favExistsAlert").modal('hide'); });
    $("#favSavedBtn").click(function() { $("#favSavedAlert").modal("hide"); });
});

function initMenuHandlers() {

    //do nothing if this tab is already active
    $(".menuTab").click(function(event){
        if ($(this).hasClass("active"))
            event.stopImmediatePropagation();
        else
            RouteManager.stopRequestingBusData();
    });

    $(".planTripMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideFormsExcept("#divPlanTrip");

        //restore routes and map if already have them
        if (document.getElementById("routesGrid").hasChildNodes())
            onSubmitTrip();
        else
            populateDateTimeFieldsForDiv("#divPlanTrip");
    });

    $(".showRoutesMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideFormsExcept("#divViewRoutes");

        //restore route if selected
        if ($("#allRoutesList").val().charAt(0) == 'r')
            onSubmitRoute();

    });

    $(".findStopsMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideFormsExcept("#divFindStops");

        //restore results
        if ($("#inputLocationStops").val() != "")
            //onSubmitStops();
            $("#divStops:hidden").transition("slide left");
        else
            populateDateTimeFieldsForDiv("#divFindStops");
    });

    $(".favoritesMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideFormsExcept("#divFavorites");
    });
}

//endregion

//region event handlers

function onSubmitTrip() {
    $(".invalid").hide();
    $(".error .message").hide();
    var origin = $("#inputTripStarting").val();
    var destination = $("#inputTripDestination").val();

    if (origin == "" || destination == "") {
        showRouteValidationWarnings();
        return;
    }

    $("#btnSubmitTrip").addClass("disabled").addClass("loading");
    $("#routesGrid").empty();

    var divPlanTrip = $("#divPlanTrip");
    var date = divPlanTrip.find(".dateField").val();
    var time = divPlanTrip.find(".timeField").val();
    var sortBy = $("#timeType").val() === "arriveBy";
    requestTrips(origin, destination, date, time, sortBy);
}

function onSubmitRoute() {
    var allRoutesList = $("#allRoutesList");
    var routeId = allRoutesList.val();
    allRoutesList.find("option").remove(".selectListPlaceholder");
    $("#divRoutesLoader").addClass("active");

    Requester.requestRouteGeometry(routeId).then(function(data){RouteManager.renderRouteToMap(routeId, data, map);});
}

/* Removed until the STA gets it together and adds their stops back into transit.land
function onSubmitStops() {
    var locationToSearch = $("#inputLocationStops").val();
    if (locationToSearch == "") {                                   //TODO: fix stopsValidation to handle this case
        stopsValidation();
    } else {
    	$(".error.message").hide();
        $(".invalid").hide();

        if ($("#divStops").is(":visible"))
            $("#divStopsSegment").addClass("loading");
        $("#btnSubmitStops").addClass("loading").addClass("disabled");

        var date = new Date($.now());
        var time = $("#time").val() + ":" + date.getSeconds();
        var submitDate = $("#date").val();
        getGeocoding(locationToSearch, submitDate, time);

    }//end else
}
*/

function onSubmitStops(){
    if ($("#divStops").is(":visible"))
        $("#divStopsSegment").addClass("loading");
    $("#btnSubmitStops").addClass("loading").addClass("disabled");

    var location = $("#inputLocationStops").val();
    requestGeocoding(location, onGeocodingRequestComplete);
}

var stopSearchRadius = 250;
var stopSearchLat = 0.0;
var stopSearchLng = 0.0;

function onGeocodingRequestComplete(data) {
    if (data["status"] != "OK") {
        alert("Geocode failed: " + data["status"] + "\n" + data["error_message"]);
        return;
    }

    var placeGeometry = data['results'][0]['geometry'];
    var latCenter = placeGeometry['location']['lat'];
    var lonCenter = placeGeometry['location']['lng'];
    var northBound = placeGeometry['viewport']['northeast']['lat'];
    var eastBound = placeGeometry['viewport']['northeast']['lng'];
    var southBound = placeGeometry['viewport']['southwest']['lat'];
    var westBound = placeGeometry['viewport']['southwest']['lng'];

    MapManager.initMapWithBounds(latCenter, lonCenter, northBound, eastBound, southBound, westBound);

    var latLng = data.results[0].geometry.location;
    stopSearchLat = latLng.lat;
    stopSearchLng = latLng.lng;
    stopSearchRadius = 250;
    Requester.requestStopsInBounds(northBound, eastBound, southBound, westBound).then(function(data){
        onStopsReceived(data);
        MapManager.updateStopsWhenNecessary();
    });
    //requestStopsUntilRadiusTooLarge();

}

function onStopsReceived(stops){
    /*
    if (stops == "{}") {
        if (stopSearchRadius *= 2 < 1001)
            requestStopsUntilRadiusTooLarge();
        else
            alert("no stops found for that location :(");       //TODO: better integrate alert into interface
        return;
    }*/

    MapManager.drawBusStopsFromData(stops);
    $("#divStopsSegment").removeClass("loading");
    $("#btnSubmitStops").removeClass("loading").removeClass("disabled");
    $("#divStops:hidden").transition("slide left");
}

// saves route to cookie, displays modal error message from Semantic UI when necessary
function onSaveFavoriteRoute() {
    var allRoutes = $("#allRoutesList");
    //don't save placeholder
    if (allRoutes.find("option:selected").hasClass("selectListPlaceholder")){
        return;
    }

    var routeName = "Route: ";
    routeName += allRoutes.find("option:selected").text();
    var routeId = allRoutes.val();
    //console.log(routeName + "\n" + routeId);

    if (FavoritesManager.getFavorites() !== undefined && FavoritesManager.favoriteExists(routeName)) {
        //alert(routeName + " is already in your favorites!");
        $("#favExistsMsg").empty().append(allRoutes.find("option:selected").text() + " is already in your favorites!");
        $('#favExistsAlert').modal('show');
    } else {

        FavoritesManager.addToFavorites(routeName, routeId);
        //alert("favorite saved: " + routeName);
        $("#favSavedMsg").empty().append(routeName + " has been saved to your favorites.");
        $("#favSavedAlert").modal("show");
    }
}

//endregion

//region helper functions

function hideFormsExcept(divId) {
    $(".formBody.visible:not("+divId+"):not(divMap)").transition("fade out");
    $(".formBody").hide();
    $(".invalid").hide();
    $("#divStops").hide();
    $(divId).show();
}

function populateDateTimeFieldsForDiv(divId){
    var div = $(divId);
    div.find(".timeField").val(getCurrentTime());
    div.find(".dateField").val(getCurrentDate());
}

//format time data to work for input fields
function getCurrentTime() {
    var dateTime = new Date($.now());
    var hour = dateTime.getHours();
    if (hour < 10)
        hour = "0" + hour;

    var minutes = dateTime.getMinutes();
    if (minutes < 10)
        minutes = "0" + minutes;

    return hour + ":" + minutes;
}

//format date data to work for input fields
function getCurrentDate() {
    var dateTime = new Date($.now());
    var month = dateTime.getMonth() + 1;
    if (month < 10)
        month = "0" + month;

    var day = dateTime.getDate();
    if (day < 10)
        day = "0" + day;

    return dateTime.getFullYear() + "-" + month + "-" + day;
}

function stopsValidation() {
    //$(".invalid").show();
    $(".ui.error.message").show();
    $("#divFindStops").form({
    		    fields: {
    		    	    location: {
    		    	    	    identifier: 'inputLocation',
    		    	    	    rules: [
    		    	    	    	    {
    		    	    	    	    	    type: 'empty',
    		    	    	    	    	    prompt: 'Please enter a location'
    		    	    	    	    }
    		    	    	    ]
    		    	    },
    		    	    date: {
				    identifier: 'date',
				    rules: [
				    	    {
				    	    	    type: 'empty',
				    	    	    prompt: 'Please enter a date'
				    	    }
				    ]
			    },
			    time: {
			    	    identifier: 'time',
			    	    rules: [
			    	    	    {
			    	    	    	    type: 'empty',
			    	    	    	    prompt: 'Please enter a time'
			    	    	    }
			    	    ]
			    }
    		    }
    });
}

function showRouteValidationWarnings() {
    var origin = $("#inputTripStarting").val();
    var destination = $("#inputTripDestination").val();
    
    console.log("starting: " + origin + "\ndest: " + destination);

    if (origin == "") {
        $(".start").show();
        console.log("invalid start");
    }
    else if (destination == "") {
        $(".destination").show();
        console.log("invalid dest");
    }
    if (origin == "" && destination == "") {
        $(".invalid").show();
        console.log("invalid both");
    }
}

//endregion