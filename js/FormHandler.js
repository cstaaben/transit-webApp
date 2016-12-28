//TODO: cool stuff:
//when routes are requested, load them and their stops into memory here before drawing
//when a user uses "Find stops", let them pick a stop, then draw the routes serviced by that stop, and their stops

import RouteManager from './RouteManager.js';
import FavoritesManager from './FavoritesManager.js';
import Requester from './Requester.js';
import MapManager from './MapManager.js';
import TripPlanner from './TripPlanner.js';

$(document).ready(function() {
    FormHandler.initialize();
});

let map = null;

export default class FormHandler {

    static initialize() {
        new FavoritesManager();

        $(".menu .item").tab();                         //initialize semantic-ui tabs

        //fetch and populate
        RouteManager.populateListWithRoutes();
        _populateDateTimeFieldsForDiv("#divPlanTrip");

        //setup event handlers
        _initMenuHandlers();
        $("#btnSubmitTrip").click(_onSubmitTrip);
        $("#allRoutesList").change(_onSubmitRoute);
        $("#btnSubmitStops").click(_onSubmitStops);
        $("#btnAddFaveRoute").click(_onSaveFavoriteRoute);

        $("#favExistsBtn").click(function() {
            $("#favExistsAlert").modal('hide');
        });
        $("#favSavedBtn").click(function() {
            $("#favSavedAlert").modal("hide");
        });
    }
};

const _initMenuHandlers = function() {

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
        _hideFormsExcept("#divPlanTrip");

        //restore routes and map if already have them
        if (document.getElementById("routesGrid").hasChildNodes())
            _onSubmitTrip();
        else
            _populateDateTimeFieldsForDiv("#divPlanTrip");
    });

    $(".showRoutesMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        _hideFormsExcept("#divViewRoutes");

        //restore route if selected
        if ($("#allRoutesList").val().charAt(0) == 'r')
            _onSubmitRoute();

    });

    $(".findStopsMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        _hideFormsExcept("#divFindStops");

        //restore results
        if ($("#inputLocationStops").val() != "")
            //onSubmitStops();
            $("#divStops:hidden").transition("slide left");
        else
            _populateDateTimeFieldsForDiv("#divFindStops");
    });

    $(".favoritesMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        _hideFormsExcept("#divFavorites");
    });
};

//endregion

//region event handlers

const _onSubmitTrip = function() {
    $(".invalid").hide();
    $(".error .message").hide();
    const origin = $("#inputTripStarting").val();
    const destination = $("#inputTripDestination").val();

    if (origin == "" || destination == "") {
        _showRouteValidationWarnings();
        return;
    }

    $("#btnSubmitTrip").addClass("disabled").addClass("loading");
    $("#routesGrid").empty();

    const divPlanTrip = $("#divPlanTrip");
    const date = divPlanTrip.find(".dateField").val();
    const time = divPlanTrip.find(".timeField").val();
    const sortBy = $("#timeType").val() === "arriveBy";
    TripPlanner.requestTrips(origin, destination, date, time, sortBy, map);
};

const _onSubmitRoute = function() {
    const allRoutesList = $("#allRoutesList");
    const routeId = allRoutesList.val();
    allRoutesList.find("option").remove(".selectListPlaceholder");
    $("#divRoutesLoader").addClass("active");

    Requester.requestRouteGeometry(routeId).then(function(data){RouteManager.renderRouteToMap(routeId, data);});
};

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

const _onSubmitStops = function(){
    if ($("#divStops").is(":visible"))
        $("#divStopsSegment").addClass("loading");
    $("#btnSubmitStops").addClass("loading").addClass("disabled");

    var location = $("#inputLocationStops").val();
    Requester.requestGeocoding(location, onGeocodingRequestComplete);
};

let _stopSearchRadius = 250;
let _stopSearchLat = 0.0;
let _stopSearchLng = 0.0;

const onGeocodingRequestComplete = function(data) {
    if (data["status"] != "OK") {
        alert("Geocode failed: " + data["status"] + "\n" + data["error_message"]);
        $("#btnSubmitStops").removeClass("loading").removeClass("disabled");
        return;
    }
    console.log(data);

    const placeGeometry = data['results'][0]['geometry'];
    const latCenter = placeGeometry['location']['lat'];
    const lonCenter = placeGeometry['location']['lng'];
    const northBound = placeGeometry['viewport']['northeast']['lat'];
    const eastBound = placeGeometry['viewport']['northeast']['lng'];
    const southBound = placeGeometry['viewport']['southwest']['lat'];
    const westBound = placeGeometry['viewport']['southwest']['lng'];

    MapManager.initMapWithBounds(latCenter, lonCenter, northBound, eastBound, southBound, westBound);

    const latLng = data.results[0].geometry.location;
    _stopSearchLat = latLng.lat;
    _stopSearchLng = latLng.lng;
    _stopSearchRadius = 250;
    Requester.requestStopsInBounds(northBound, eastBound, southBound, westBound).then(function(data){
        _onStopsReceived(data);
        MapManager.updateStopsWhenNecessary();
    });
    //requestStopsUntilRadiusTooLarge();

};

const _onStopsReceived = function(stops){
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
};

// saves route to cookie, displays modal error message from Semantic UI when necessary
const _onSaveFavoriteRoute = function() {
    const allRoutes = $("#allRoutesList");
    //don't save placeholder
    if (allRoutes.find("option:selected").hasClass("selectListPlaceholder")){
        return;
    }

    let routeName = "Route: ";
    routeName += allRoutes.find("option:selected").text();
    const routeId = allRoutes.val();
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
};

//endregion

//region helper functions

const _hideFormsExcept = function(divId) {
    $(".formBody.visible:not("+divId+"):not(divMap)").transition("fade out");
    $(".formBody").hide();
    $(".invalid").hide();
    $("#divStops").hide();
    $(divId).show();
};

const _populateDateTimeFieldsForDiv = function(divId){
    const div = $(divId);
    div.find(".timeField").val(_getCurrentTime());
    div.find(".dateField").val(_getCurrentDate());
};

//format time data to work for input fields
const _getCurrentTime = function() {
    const dateTime = new Date($.now());
    let hour = dateTime.getHours();
    if (hour < 10)
        hour = "0" + hour;

    let minutes = dateTime.getMinutes();
    if (minutes < 10)
        minutes = "0" + minutes;

    return hour + ":" + minutes;
};

//format date data to work for input fields
const _getCurrentDate = function() {
    const dateTime = new Date($.now());
    let month = dateTime.getMonth() + 1;
    if (month < 10)
        month = "0" + month;

    let day = dateTime.getDate();
    if (day < 10)
        day = "0" + day;

    return dateTime.getFullYear() + "-" + month + "-" + day;
};

const _showRouteValidationWarnings = function() {
    const origin = $("#inputTripStarting").val();
    const destination = $("#inputTripDestination").val();

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
};

const stopsValidation = function() {
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
};

//endregion