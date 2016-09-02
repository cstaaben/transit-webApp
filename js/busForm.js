$(document).ready(function() {

    //initForm();
    $("#map").hide();
    $(".menu .item").tab();
    $("p").css("padding", "10px");
    $("#routeMap").hide();
    $("#stops").hide();
    $("h3").hide();

    getRoutes();
    initForm();
    setMenu();

    //console.log( "ready!" );

    $("#btnSubmit").click(submitClick);
    $("#btnTripSubmit").click(tripSubmit);
    $("#btnRouteSubmit").click(getRoute);
    $("#fullRouteAddFave").click(saveFavoriteRoute);

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
    var locationToSearch = $("#location").val();
    if (locationToSearch == "") {
        console.log("empty Location");
        stopsValidation();
    } else {
        $(".invalid").hide();
        $("#stops").slideDown(500);
        //clearMarkers();
        // automatically scroll down to stops div
        $('html,body').animate({
                scrollTop: $("#stops").offset().top
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
    var origin = $("#starting").val();
    var destination = $("#destination").val();

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
        $("li").removeClass("active");
        $(".findStopsMenu").addClass("active");
        hideForms();
        $("#findStops").show();
    });

    $(".planTripMenu").click(function() {
        $("li").removeClass("active");
        $(".planTripMenu").addClass("active");
        hideForms();
        $("#planTrip").show();
        populateRouteForm();
    });

    $(".favoritesMenu").click(function() {
        $("li").removeClass("active");
        $(".favoritesMenu").addClass("active");
        hideForms();
        $("#favorites").show();
    });

    $(".getRouteMenu").click(function() {
        $("li").removeClass("active");
        $(".getRouteMenu").addClass("active");
        hideForms();
        $("#getRoute").show();
        populateRouteDate();
    });
}

function hideForms() {
    $(".formbody").hide();
    $(".invalid").hide();
    $("#map").hide();
    $("#routeMap").hide();
    $("#stops").hide();
}

function populateRouteDate() {
    var date = getDate;
    $("#routeDate").val(date);
}

function populateRouteForm() {
    console.log("Route Clicked");
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
    console.log("stopsValidation");
    $(".invalid").show();
}

function routeValidation() {
    var origin = $("#starting").val();
    var destination = $("#destination").val();

    if (origin == "") {
        console.log("Starting Fucked");
        $(".start").show();
    }
    else if (destination == "") {
        $(".destination").show();
    }
    if (origin == "" && destination == "") {
        $(".invalid").show();
    }
}

//TODO: replace alert() with alerts as in https://getbootstrap.com/components/#alerts
function saveFavoriteRoute() {
    var routeName = "Route: ";
    routeName += $("#allRoutes").find("option:selected").text();
    var routeId = $("#allRoutes").val();

    if (getFavorites() !== undefined && faveExists(routeName)) {
        alert(routeName + " is already in your favorites!");
    } else {
        addToFaves(routeName, routeId);
        alert("favorite saved: " + routeName);
    }
}