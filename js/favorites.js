//Kevin Ungerecht
//Favorites with cookies!

var COOKIE_DURATION = 30; //cookies last 30 days

$(document).ready(function() {
    cleanFavorites();
    var favorites = getFavorites();
    if (favorites == undefined) { 	//if favorites cookie doesn't exist or is empty
        $.cookie('Favorites', "", -1);					//kill the cookie
        setNoFavesMsg();
    } else { 											//favorites cookie does already exist
        printFavorites(favorites);
    }
    
    $("#delFavCancelBtn").click(function() { $("#delFavConfirm").modal("hide"); });

    //TODO: implement favorites usage
    $(".btnFave")
        //.unbind("click")
        .click(onFavBtnClicked);

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });

});

function onFavBtnClicked() {
	var stopID = $(this).attr("data-id");
	var stopName = $(this).attr("id");
	alert("Favorites functionality not yet implemented - check back later!");
}

function addToFaves(routeName, routeId) {
    //console.log(routeName);
    //console.log(routeId);

    var favorites = getFavorites();
    if (favorites === undefined)
        favorites = [];
   
   var rid = JSON.stringify(routeId);
   //console.log(rid);

    var route = {id: rid, name: routeName};
    
    favorites.push(route);
    //console.log(favorites);
    cleanFavorites();
    saveFavorites(favorites);
    printFavorites(getFavorites());

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });

}

function faveExists(routeName) {
    var favorites = getFavorites();
    
    if(favorites === undefined) { return false; }
    
    for (var i = 0; i < favorites.length; i++)
        if (favorites[i]["name"] === routeName)
            return true;

    return false;
}


function onFavoriteDelBtnClick(favoriteId) {

    var favorites = getFavorites();
    var newFaves = [];
    var deleting;
    var f = 0;
    do {
        if (f !== favoriteId) {
            newFaves.push(favorites[f]);
        } else {
            deleting = favorites[f];
        }
    } while (f++ < favorites.length-1);
    
    //console.log(newFaves);

	$("#delFavMsg").empty().append("Are you sure you want to delete \"" + deleting["name"] + "\" from your favorites?");
	$("#delFavConfirm").modal("show");
	$("#delFavConfBtn").click(newFaves, function() {
	//if(confirm("Are you sure you want to delete \"" + deleting["name"] + "\" from your favorites?")) {
			cleanFavorites();
			saveFavorites(newFaves);
			//console.log(getFavorites());
			if (newFaves.length > 0) {
			  printFavorites(getFavorites());
			} else {
			  setNoFavesMsg();
			}
			
			$("#delFavConfirm").modal("hide");
			
			$(".btnDelFave").click(function() {
					var ddata = parseInt($(this).attr("value"));
					onFavoriteDelBtnClick(ddata);
			});
	});
}

//cleans the favorites table
function cleanFavorites() {
    $(" #faves ").empty();
}

function saveFavorites(favorites) {
    //Save favorites array to cookie
    if ($.isEmptyObject(favorites)) {
        $.cookie('Favorites', "", -1);	//kill the cookie
    } else {
        $.cookie('Favorites', JSON.stringify(favorites), {expires: COOKIE_DURATION});
    }
}

function getFavorites() {
    var favorites = $.cookie('Favorites');
    if ($.isEmptyObject(favorites)) {
        return undefined;
    } else {
        return $.parseJSON(favorites);
    }
}

function printFavorites(favorites){
    var makeFavoriteRow = function(favorite, index){
        var divRow = '<div class="faveRow row">\
            <div class="one wide column">\
                <button id="' + favorite["name"] + '" data-id=' + favorite["id"] + ' class="ui icon button btnFave">\
					<i class="bus icon"></i>\
				</button>\
            </div>\
            \
            <div class="one wide column">\
                <button class="ui icon negative button btnDelFave" value="' + index + '">\
                    <i class="small remove icon"></i>\
                </button>\
            </div>\
            \
            <div class="six wide column">\
                <span>' + favorite["name"] + '</span>\
            </div>\
            \
        </div>';
        return divRow;
    };

    //Print cookies to the page
    for (var j = 0; j < favorites.length; j++) {
        $("#faves").append(makeFavoriteRow(favorites[j], j));
    }

    $(".btnFave")
        .unbind("click")
        .click(function() {
            var stopID = $(this).attr("data-id");
            var stopName = $(this).attr("id");
            console.log(stopID);
            console.log(stopName);
        });
}

function setNoFavesMsg() {
    $("#divFavorites").append("<p class='faveMessage'>You have no favorite routes or stops!<br>Find stops, plan a trip, or view a route then save it to your favorites.</p>");
}


//This function is only used for debug purposes.
//It populates the favorites list with hard coded values.
function populate() {

    cleanFavorites();
    var route1 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};
    var route2 = {num: '2', stop1: "Stop1 Data", stop2: "Stop2 Data"};
    var route3 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};
    var route4 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};

    var favorites = [
        {fname: "Home", route: route1},
        {fname: "Work", route: route2},
        {fname: "Downtown", route: route3},
        {fname: "Groceries", route: route4}
    ];
    saveFavorites(favorites);
    printFavorites(getFavorites());

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });
}