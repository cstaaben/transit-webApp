$( document ).ready(function() {
	//PUT THESE IN CSS

	$(".menu .item").tab();
	$("p").css("padding","10px");
	$("#map").slideUp();
	$("#routeMap").slideUp();
	$("#stops").slideUp();
	$("h3").hide();

	$(".invalid").hide();
	$(".formBody").hide();
	$("#findStops").show();
	
	//initMap();
	getRoutes();
	initForm();
	setMenu();

    //console.log( "ready!" );

	$("#btnSubmit").click(submitClick);
	$("#btnTripSubmit").click(tripSubmit);
	$("#btnRouteSubmit").click(routeSubmit);
	
});

function getDate() {
//GET CURRENT DATE/TIME
	var date = new Date($.now());

//SET TIME AND DATE DATA TO WORK FOR INPUT FIELDS	
	var month = date.getMonth()+1;
	if(month < 10)
		month = "0"+month;
	
	var day = date.getDate();
	if(day < 10)
		day = "0"+day;

//SET TIME AND DATE TO CORRECT FORMAT
	
	return date.getFullYear()+"-"+month+"-"+day;
	
}

function getTime(){
	var date = new Date($.now());
		var hour = date.getHours();
	if(hour < 10)
		hour = "0"+hour;

	var minutes = date.getMinutes();
	if(minutes < 10)
		minutes = "0"+minutes;

	return hour+":"+minutes;
}

function initForm(){
	//POPULATE FORM
	var currentTime = getTime;
	var currentDate = getDate;

	$("#time").val(currentTime);
	$("#date").val(currentDate)
}

function submitClick()
{
	if($("#location").val()=="")
	{
		console.log("empty Location");
		stopsValidation();
	}

	else{
		$(".invalid").hide();
		$("#map").slideDown(500);
		clearMarkers();
		
		var date = new Date($.now());
		var time = $("#time").val()+":"+date.getSeconds();
		var location = $("#location").val();
		var submitDate = $("#date").val();
		debugger;
		// console.log(location);
		//  console.log(time);
		//  console.log(submitDate);

		getGeoCoding(location, submitDate, time);
	}//end else	
}

function tripSubmit(){
	$(".invalid").hide();
	console.log( $("#starting").val());
	console.log( $("#destination").val());
	console.log( $("#date2").val());
	console.log( $("#time2").val());
	console.log( $("#timeType").val());

	if( $("#starting").val()=="" || $("#destination").val() == ""){
		routeValidation();
	}

	else{
		console.log("GO DO FUNCTIONS");
		$(".invalid").hide();
	}

}


function setMenu(){
	$(".findStopsMenu").click(function(){
		$("li").removeClass("active");
		$(".formBody").hide();
		$("#findStops").show();
		$(".findStopsMenu").addClass("active");
		$(".invalid").hide();
		$("#map").show();
		$("#routeMap").hide();
	});

	$(".planTripMenu").click(function(){
		$("li").removeClass("active");
		$(".formBody").hide();
		$("#planTrip").show();
		populateRouteForm();
		$(".planTripMenu").addClass("active");
		$(".invalid").hide();
		$("#map").hide();
		$("#routeMap").hide();
	});
	
	$(".favoritesMenu").click(function(){
		$("li").removeClass("active");
		$(".formbody").hide();
		$("#favorites").show();
		$(".favoritesMenu").addClass("active");
		$(".invalid").hide();
		$("#map").hide();
		$("#routeMap").show();
	});

	$(".getRouteMenu").click(function(){
		$("li").removeClass("active");
		$(".formbody").hide();
		$("#getRoute").show();
		$(".getRouteMenu").addClass("active");
		$(".invalid").hide();
		$("#map").hide();
		$("#routeMap").hide();
	});
}

function populateRouteForm(){
	console.log("Route Clicked");
	var date = new Date($.now());

//SET TIME AND DATE DATA TO WORK FOR INPUT FIELDS	
	var month = date.getMonth()+1;
	if(month < 10)
		month = "0"+month;
	
	var day = date.getDate();
	if(day < 10)
		day = "0"+day;

	var hour = date.getHours();
	if(hour < 10)
		hour = "0"+hour;

	var minutes = date.getMinutes();
	if(minutes < 10)
		minutes = "0"+minutes;

//SET TIME AND DATE TO CORRECT FORMAT

	var currentTime = hour+":"+minutes;
	var currentDate = date.getFullYear()+"-"+month+"-"+day;
	
	//POPULATE FORM
	$("#time2").val(currentTime);
	$("#date2").val(currentDate);
}


function stopsValidation(){
	console.log("stopsValidation");
	$(".invalid").show();
}

function routeValidation(){
	if($("#starting").val() == ""){
		console.log("Starting Fucked");
		$(".start").show();
	}
	else if($("#destination").val() == ""){
		$(".destination").show();
	}
	if($("#destination").val() == "" && $("#starting").val() == "")
	{
		$(".invalid").show();
	}
}

function routeSubmit(){
	var data = $("#allRoutes").val();

}