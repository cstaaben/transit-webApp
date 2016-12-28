import CookieManager from './CookieManager.js';

export default class FavoritesManager {

    constructor() {
        _bindEvents();
        _setupFavoritesTable();
    }

    static addToFavorites(routeName, routeId) {
        let favorites = this.getFavorites();
        if (favorites === undefined)
            favorites = [];

        const rid = JSON.stringify(routeId);
        const route = {id: rid, name: routeName};

        favorites.push(route);
        CookieManager.saveCookie(favorites, _FAVORITES_COOKIE_NAME);
        _render(CookieManager.loadCookie(_FAVORITES_COOKIE_NAME));
        $(".noFavesMessage").remove();

        _setupDeleteFavoriteButtons();
    }

    static favoriteExists(routeName) {
        const favorites = CookieManager.loadCookie(_FAVORITES_COOKIE_NAME);

        if (favorites === undefined) {
            return false;
        }

        for (let i = 0; i < favorites.length; i++)
            if (favorites[i]["name"] === routeName)
                return true;

        return false;
    }

    static getFavorites() {
        return CookieManager.loadCookie(_FAVORITES_COOKIE_NAME);
    }
}

const _FAVORITES_COOKIE_NAME = 'Favorites';

const _bindEvents = function(){
    $("#delFavCancelBtn").click(function() {
        $("#delFavConfirm").modal("hide");
    });

    $(".btnFave").click(_onFavoriteButtonClicked);

    _setupDeleteFavoriteButtons();
};

const _setupDeleteFavoriteButtons = function() {
    $(".btnDelFave").click(function() {
        const data = parseInt($(this).attr("value"));
        _onDeleteFavoriteButtonClicked(data);
    });
};

const _setupFavoritesTable = function() {
    const favorites = CookieManager.loadCookie(_FAVORITES_COOKIE_NAME);
    if (favorites == undefined) { 	                    //if favorites cookie doesn't exist or is empty
        $.cookie('Favorites', "", -1);					//kill the cookie
    }

    _render(favorites);
};

//TODO: implement favorites usage
const _onFavoriteButtonClicked = function() {
    const stopID = $(this).attr("data-id");
    const stopName = $(this).attr("id");
    console.log(`favorite clicked, ID: ${stopID}, name: ${stopName}`);
    alert("Favorites functionality not yet implemented - check back later!");
};

 const _onDeleteFavoriteButtonClicked = function(favoriteId) {
    const favorites = CookieManager.getFavorites();
    let newFaves = [];
    let deleting;
    let f = 0;
    do {
        if (f !== favoriteId) {
            newFaves.push(favorites[f]);
        } else {
            deleting = favorites[f];
        }
    } while (f++ < favorites.length - 1);

    $("#delFavMsg").empty().append("Are you sure you want to delete \"" + deleting["name"] + "\" from your favorites?");
    $("#delFavConfirm").modal("show");
    $("#delFavConfBtn").unbind("click").click(newFaves, function() {
        CookieManager.saveCookie(newFaves, _FAVORITES_COOKIE_NAME);
        _render(CookieManager.loadCookie(_FAVORITES_COOKIE_NAME));

        $("#delFavConfirm").modal("hide");

        _setupDeleteFavoriteButtons();
    });
};

const _render = function(favorites) {
    //clear table
    $(" #faves ").empty();

    if (favorites == undefined || $.isEmptyObject(favorites) || favorites.length == 0) {
        _setNoFavesMsg();
        return;
    }

    //TODO: remove HTML from javascript. Maybe with something like mustache.js
    const makeFavoriteRow = function(favorite, index) {
        const divRow = `<div class="faveRow row">
            <div class="one wide column">
                <button id="${favorite["name"]}" data-id="${favorite["id"]}" class="ui icon button btnFave">
                    <i class="bus icon"></i>
                </button>
            </div>
            
            <div class="one wide column">
                <button class="ui icon negative button btnDelFave" value="${index}">
                    <i class="small remove icon"></i>
                </button>
            </div>
            
            <div class="six wide column">
                <span>${favorite["name"]}</span>
            </div>
        </div>`;

        return divRow;
    };

    //Print cookies to the page
    for (let j = 0; j < favorites.length; j++) {
        $("#faves").append(makeFavoriteRow(favorites[j], j));
    }

    //bind favorites buttons
    $(".btnFave")
        .unbind("click")
        .click(function() {
            const stopID = $(this).attr("data-id");
            const stopName = $(this).attr("id");
            console.log(stopID);
            console.log(stopName);
        });
};

const _setNoFavesMsg = function() {
    if ($(".noFavesMessage").length == 0) {
        $("#divFavorites").append("<p class='noFavesMessage'>You have no favorite routes or stops!<br>Find stops, plan a trip, or view a route then save it to your favorites.</p>");
    }
};

//This function is only used for debug purposes.
//It populates the favorites list with hard coded values.
const _populate = function() {

    const route1 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};
    const route2 = {num: '2', stop1: "Stop1 Data", stop2: "Stop2 Data"};
    const route3 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};
    const route4 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};

    const favorites = [
        {fname: "Home", route: route1},
        {fname: "Work", route: route2},
        {fname: "Downtown", route: route3},
        {fname: "Groceries", route: route4}
    ];
    CookieManager.saveCookie(favorites, _FAVORITES_COOKIE_NAME);
    _render(CookieManager.loadCookie(_FAVORITES_COOKIE_NAME));

    _setupDeleteFavoriteButtons();
};
