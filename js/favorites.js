//Kevin Ungerecht
//Favorites with cookies!

function delBtnClick(id){

	var faveArr = getFavorites();

	if(id <= faveArr.length){ // id is valid option
	
		var newFaves = new Array();
		var k = 0;
		var deleting;
		while(k < faveArr.length){
			if((k + 1) !== id){
				newFaves.push(faveArr[k]);
			}else{
				deleting = faveArr[k];
			}
			k++;
		}
		console.log(newFaves);
		if(confirm("Are you sure you want to delete \""+deleting["fname"]+"\" from your favorites?")){
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
		
		
	}else{
		console.log(id);
	}
	
	$(".delfavebtn").click(function(){
		var ddata = parseInt($(this).attr("value"));
		delBtnClick(ddata);
	});

	return;
}

function cleanFavorites(){
	//cleans the favorites table
	$(" #favorites ").empty();
	$(" #favorites ").append('<table id="faves"></table>');
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
		
		var div = '<tr class="favesRow">\
						<td id="buttonTd">\
							<button class="ui icon negative button delFaveBtn" value="'+(j+1)+'" )">\
								<i class="small remove icon"></i>\
							</button>\
						</td>\
						<td class="favName"><span>'+ favOut["fname"] + '</span></td>';
		
		var numRts = favOut["route"]["num"];
		var stp;
		for(var i = 1; i <= numRts; i++){
			stop = favOut["route"]["stop"+i];
			div += ('<td class="faveTd">\
						<button class="ui icon button stopBtn" value="'+stop+'">\
							<i class="bus icon"></i>\
						</button></td>');
			if(i != numRts){
				div += '<td class="faveTd"><i id="busArrows" class="large right arrow icon"></i></td>';
			}
		}
		div+="</tr>";
		return div;
	}

	//Print cookies to the page
	for(var j = 0; j < favOut.length; j++){
		$("#faves").append(makeFaves(favOut[j]));
	}
	
}

function noFavesMsg(){
	$("#favorites").append("<p class='faveMessage'>You have no favorite routes!<br>Create a route then save to your favorites.</p>");
	$("#favorites").append("<button id='popFaves' class='ui positive button'>Populate..</button>");
	
	$("#popFaves").click(function(){
		populate();
	});
}

function populate(){
	//this function is only used for debug purposes. 
	//It populates the favorites list with hard coded values..
	cleanFavorites();
	
	var route1 = {num:'3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};

	var route2 = {num:'2', stop1: "Stop1 Data", stop2: "Stop2 Data"};
	
	var route3 = {num:'3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"}
	
	var route4 = {num:'3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"}
	
	var favorites = new Array(
			{fname: "Home", route: route1},
			{fname: "Work", route: route2},
			{fname: "Downtown", route: route3},
			{fname: "Groceries", route: route4}
	);
	createFavorites(favorites);
	printFavorites(getFavorites());
	$(".delfavebtn").click(function(){
		var ddata = parseInt($(this).attr("value"));
		delBtnClick(ddata);
	});
}


$( document ).ready(function() {
	
	if(jQuery.isEmptyObject($.cookie('Favorites'))){ //if favorites cookie doesn't exist
		
		$.cookie('Favorites', "", -1);//kill the cookie
		cleanFavorites();
		noFavesMsg();
		
	}else{ //favorites cookie does already exist
	
		cleanFavorites();
		printFavorites(getFavorites());
		
	}
	
	$("#addFaveBtn").click(function(){
	
		//alert("You clicked me!");
		
	});
	
	$("#popFaves").click(function(){
		populate();
	});
	
	$(".stopbtn").click(function(){
		var stopData = $(this).attr("value");
		alert(stopData);
	});
	
	$(".delfavebtn").click(function(){
		var ddata = parseInt($(this).attr("value"));
		delBtnClick(ddata);
	});

});


//code snippets for later use...

/* makes a cookie for 10 seconds

	var date = new Date();
	date.setTime(date.getTime() + (0.1 * 60 * 1000));
	$.cookie('Cookie', "Values", { expires: date });

*/