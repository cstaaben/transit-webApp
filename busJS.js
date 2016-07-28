$( document ).ready(function() {
	
    console.log( "ready!" );
	var date = new Date($.now());
	
	var month = date.getMonth()+1;
	if(month < 10)
		month = "0"+month;
	
	var day = date.getDate();
	if(day < 10)
		day = "0"+day;
	
	var currentTime = date.getHours()+":"+date.getMinutes();
	var currentDate = date.getFullYear()+"-"+month+"-"+day;

	$("#time").val(currentTime);
	$("#date").val(currentDate);
	
	$("#btnSubmit").click(function(){
		var time = $("#time").val()+":"+date.getSeconds();
		console.log($("#location").val());
		console.log(time);
		console.log($("#date").val());
	});
	
});