$( document ).ready(function() {
	//PUT THESE IN CSS
	//$("#map").width('50%').height('300px').css({"float": "left"});
	//$("#stops").width('50%').height('300px').css({"float": "right"});

	$("p").css("padding","10px");
	$("#map").slideUp();
	$("h3").hide();
	//initMap();
	initForm();
	
    //console.log( "ready!" );

	$("#btnSubmit").click(submitClick);
	
});

function initForm() {
//GET CURRENT DATE/TIME
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
	$("#time").val(currentTime);
	$("#date").val(currentDate);
}

function submitClick()
{
	$("#map").slideDown(500);
	clearMarkers();
	
	var date = new Date($.now());
	var time = $("#time").val()+":"+date.getSeconds();
	var location = $("#location").val();
	var submitDate = $("#date").val();
	
	//console.log(location);
	// console.log(time);
	// console.log(submitDate);

	getGeoCoding(location, submitDate, time);
	
}
