var map;

//region initialization

$(document).ready(function() {

    $(".menu .item").tab(); //initialize semantic-ui tabs

    //fetch and populate
    requestRoutes();
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
            clearInterval(busDataIntervalId);           //stop requesting bus data
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

    getRouteGeometry(routeId).then(function(data){initRouteMap(routeId, data);});
}

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

// saves route to cookie, displays modal error message from Semantic UI when necessary
function onSaveFavoriteRoute() {
    var routeName = "Route: ";
    var allRoutes = $("#allRoutesList");
    routeName += allRoutes.find("option:selected").text();
    var routeId = allRoutes.val();
    //console.log(routeName + "\n" + routeId);

    if (getFavorites() !== undefined && faveExists(routeName)) {
        //alert(routeName + " is already in your favorites!");
        $("#favExistsMsg").empty().append(allRoutes.find("option:selected").text() + " is already in your favorites!");
        $('#favExistsAlert').modal('show');
    } else {
        addToFaves(routeName, routeId);
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