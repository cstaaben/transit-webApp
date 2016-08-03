//Kevin Ungerecht
//Favorites with cookies!

function delBtnClick(id){
	
	var faveArr = getFavorites();
	
	if(id <= faveArr.length){ // id is valid option
	
		var newFaves = new Array();
		var i = 0;
		while(i < faveArr.length){
			if((i + 1) !== id){
				newFaves.push(faveArr[i]);
			}
			i++;
		}
		
		if(newFaves.length > 0){
			createFavorites(newFaves);
			cleanFavorites();
			printFavorites(getFavorites());
		}else{
			createFavorites(newFaves);
			cleanFavorites();
			noFavesMsg();
		}
	}
}

function cleanFavorites(){
	//cleans the favorites table
	$(" #favesDiv ").empty();
	$(" #favesDiv ").append('<table id="faves"><col width="50"><col width="150"></table>');
	return;
}

function createFavorites(faveArr){
	//Save favorites array to cookie
	if(jQuery.isEmptyObject(faveArr)){
		$.cookie('Favorites', "", -1);//kill the cookie
	}else{
		$.cookie('Favorites', JSON.stringify(faveArr), {expires: 30}); //30 days
	}
	
}

function getFavorites(){
	
	//Decode JSON string from cookie to array
	var favOut = $.parseJSON($.cookie('Favorites'));
	return favOut;
}

function printFavorites(favOut){
	
	//Creates divs from favorites objects
	makeFaves = function(favOut) {
		var div = '<tr class="favorites"><td id="buttonTd"><button class="ui icon negative button" id="delFaveBtn" onclick="delBtnClick('+(i+1)+')"><i class="small remove icon"></i></button></td><td><span class="favName">'+ favOut["fname"] + '</span></td>   ----->   <td><span class="favRoute"> ' + favOut["route"] + '<br/></span></td></tr>';
		return div;
	}

	//Print cookies to the page
	for(var i = 0; i < favOut.length; i++){
		$("#faves").append(makeFaves(favOut[i]));
	}
	
	$("#favesDiv").show();
	
	//$("#favesDiv").append('<button id="addFaveBtn">Add Favorite</button>');
}

function noFavesMsg(){
	$("#favesDiv").append("<p class='faveMessage'>You have no favorite routes!<br>Create a route then save to your favorites.</p>");
	$("#favesDiv").append("<button id='popFaves' class='ui positive button'>Populate..</button>");
}

function populate(){
	//this function is only used for debug purposes. 
	//It populates the favorites list with hard coded values..
	cleanFavorites();
	
	var favorites = new Array(
			{fname: "Home", route: "[Route Object 1]", id:1},
			{fname: "Work", route: "[Route Object 2]", id:2},
			{fname: "Downtown", route: "[Route Object 3]", id:3}
	);
	
	createFavorites(favorites);
	printFavorites(getFavorites());
		
	
}

$( document ).ready(function() {

	
	if(jQuery.isEmptyObject($.cookie('Favorites'))){ //if favorites cookie doesn't exist
		
		$.cookie('Favorites', "", -1);//kill the cookie
		noFavesMsg();
		
	}else{ //favorites cookie does already exist
	
		printFavorites(getFavorites());
		
	}
	
	$("#addFaveBtn").click(function(){
	
		//alert("You clicked me!");
		
	});
	
	$("#popFaves").click(function(){
	
		populate();
		
	});
	
	
	
});//end ready




//code snippets for later use...

/* makes a cookie for 10 seconds

	var date = new Date();
	date.setTime(date.getTime() + (0.1 * 60 * 1000));
	$.cookie('Cookie', "Values", { expires: date });

*/