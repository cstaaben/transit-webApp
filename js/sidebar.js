$(document).ready( function (){
	/*
	$("#menuSlider").hide();
	$(".menuBar").hide();
	*/
	var width = $(window).width();
	if((width < 1023))
		$("#menu").hide();
	else
	{
		$("#menuSlider").hide();
		$(".menuBar").hide();
	}	

	$("#menuSlider").click(function(){

		$('.ui.sidebar').sidebar('setting', 'transition', 'overlay').sidebar('toggle');
		$("body").removeClass();
		$("body").addClass("background");
	});

	$("a").click(function(){
		$('.ui.sidebar').sidebar('setting', 'transition', 'overlay').sidebar('toggle');
	});
});