var map;

$(document).ready(function() {

    $("#divMap").hide();
    $(".menu .item").tab();
    //$("p").css("padding", "10px");
    $("#routeMap").hide();
    $("#divStops").hide();
    $("h3").hide();
    $(".ui.modal").modal('hide');

    getRoutes();
    initForm();
    setMenu();
    
    $("#divInputForm").form({
    		    fields: {
    		    	    location: {
    		    	    	    identifier: 'location',
    		    	    	    rules: [
    		    	    	    	    {
    		    	    	    	    	    type: 'empty',
    		    	    	    	    	    prompt: 'Please enter a location'
    		    	    	    	    }
    		    	    	    ]
    		    	    },
    		    	    date: {
				    identifier: 'stopDate',
				    rules: [
				    	    {
				    	    	    type: 'empty',
				    	    	    prompt: 'Please enter a date'
				    	    }
				    ]
			    }
    		    }
    });
    		    	    

    //console.log( "ready!" );

    $("#btnSubmit").click(submitClick);
    $("#btnTripSubmit").click(tripSubmit);
    $("#btnRouteSubmit").click(getRoute);
    $("#fullRouteAddFave").click(saveFavoriteRoute);
    $("#favExistsBtn").click(function() { $(".ui.small.modal").modal('hide'); });
});

function getDate() {
    //GET CURRENT DATE/TIME
    var date = new Date($.now());

    //SET TIME AND DATE DATA TO WORK FOR INPUT FIELDS
    var month = date.getMonth() + 1;
    if (month < 10)
        month = "0" + month;

    var day = date.getDate();
    if (day < 10)
        day = "0" + day;

    //SET TIME AND DATE TO CORRECT FORMAT
    return date.getFullYear() + "-" + month + "-" + day;

}

function getTime() {
    var date = new Date($.now());
    var hour = date.getHours();
    if (hour < 10)
        hour = "0" + hour;

    var minutes = date.getMinutes();
    if (minutes < 10)
        minutes = "0" + minutes;

    return hour + ":" + minutes;
}

function initForm() {
    //POPULATE FORM
    var currentTime = getTime;
    var currentDate = getDate;

    $("#time").val(currentTime);
    $("#date").val(currentDate)
}

function submitClick() {
    var locationToSearch = $("#inputLocation").val();
    if (locationToSearch == "") {
        console.log("empty Location");
        stopsValidation();
    } else {
        $(".invalid").hide();
        $("#divStops").slideDown(500);

        // automatically scroll down to stops div
        $('html,body').animate({
                scrollTop: $("#divStops").offset().top
            },
            'slow');

        var date = new Date($.now());
        var time = $("#time").val() + ":" + date.getSeconds();
        var submitDate = $("#date").val();
        getGeocoding(locationToSearch, submitDate, time);
    }//end else
}

function tripSubmit() {
    $(".invalid").hide();
    var origin = $("#inputTripStarting").val();
    var destination = $("#inputTripDestination").val();

    if (origin == "" || destination == "") {
        routeValidation();
        return;
    }

    $("#routes").empty();
    var date = $("#date2").val();
    var time = $("#time2").val();
    var sortBy = $("#timeType").val() === "arriveBy";
    getTrips(origin, destination, date, time, sortBy);
}


function setMenu() {
    $(".findStopsMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideForms();
        $("#divFindStops").show();
    });

    $(".planTripMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideForms();
        $("#divPlanTrip").show();
        populateRouteForm();
    });

    $(".showRoutesMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideForms();
        $("#divGetRoute").show();
        populateRouteDate();
    });

    $(".favoritesMenu").click(function() {
        $("li.active").removeClass("active");
        $(this).addClass("active");
        hideForms();
        $("#divFavorites").show();
    });

    $(".menuTab").click(function(){clearInterval(busDataIntervalId);});   //stop requesting bus data
}

function hideForms() {
    $(".formBody").hide();
    $(".invalid").hide();
    $("#divMap").hide();
    $("#divStops").hide();
}

function populateRouteDate() {
    var date = getDate;
    $("#routeDate").val(date);
}

function populateRouteForm() {
    var dateTime = new Date($.now());

    //POPULATE FORM
    $("#time2").val(getTimeFormatted(dateTime));
    $("#date2").val(getDateFormatted(dateTime));
}

//format time data to work for input fields
function getTimeFormatted(dateTime) {
    var hour = dateTime.getHours();
    if (hour < 10)
        hour = "0" + hour;

    var minutes = dateTime.getMinutes();
    if (minutes < 10)
        minutes = "0" + minutes;

    return hour + ":" + minutes;
}

//format date data to work for input fields
function getDateFormatted(dateTime) {
    var month = dateTime.getMonth() + 1;
    if (month < 10)
        month = "0" + month;

    var day = dateTime.getDate();
    if (day < 10)
        day = "0" + day;

    return dateTime.getFullYear() + "-" + month + "-" + day;
}


function stopsValidation() {
    $(".invalid").show();
}

function routeValidation() {
    var origin = $("#starting").val();
    var destination = $("#destination").val();

    if (origin == "") {
        $(".start").show();
    }
    else if (destination == "") {
        $(".destination").show();
    }
    if (origin == "" && destination == "") {
        $(".invalid").show();
    }
}

// saves route to cookie, displays modal error message from Semantic UI when necessary
function saveFavoriteRoute() {
    var routeName = "Route: ";
    routeName += $("#allRoutes").find("option:selected").text();
    var routeId = $("#allRoutes").val();

    if (getFavorites() !== undefined && faveExists(routeName)) {
        //alert(routeName + " is already in your favorites!");
        $("#favExistsMsg").empty().append($("#allRoutes").find("option:selected").text() + " is already in your favorites!");
        $('.ui.small.modal').modal('show');
    } else {
        addToFaves(routeName, routeId);
        alert("favorite saved: " + routeName);
    }
}