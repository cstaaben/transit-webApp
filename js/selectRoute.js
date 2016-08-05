
function getRoutes(){
	var link = "https://transit.land/api/v1/routes?operated_by=o-c2kx-spokanetransitauthority"
	$.getJSON(link, "", getDone);
}

function getDone(data){
	var data = data.routes;
	var array = [];

	//This will iterate through the array to get all of the route numbers & Names
	
	for(var x = 0; x < data.length; x++)
	{
		var num = data[x].name;
		var longName = data[x].tags.route_long_name;
		var id = data[x].onestop_id;

		//Fills Array with all stops
		array[x] = {
			"num" : num,
			"longName" : longName,
			"id" : id
		};

	}//End For Loop

	//SORT THE ARRAY
	array.sort( function(a,b){
		return a.num - b.num;
	});

	//POPULATE THE FORM
	for(var x = 0; x < array.length; x++)
	{
		var str = "<option value = '" + array[x].id + "'>" + array[x].num + " - " + array[x].longName + "</option>";
		$("#allRoutes").append(str);
		
	}//End For Loop


}

