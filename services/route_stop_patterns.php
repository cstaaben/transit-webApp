<?php
//route_stop_patterns.php
//Audrey Henry
header('Access-Control-Allow-Origin: *');
if($_SERVER["REQUEST_METHOD"] !== "GET"){
	http_response_code(400);
	echo json_encode("Error: Bad request type");
	die();
}

//Here we're going to require a stop or a route, because I don't think there's an "operated by"
//option, plus this service isn't very useful without one of those parameters.
$url = "https://transit.land/api/v1/route_stop_patterns?";
if(!isset($_GET["bbox"]) && !isset($_GET["traversed_by"]) && !isset($_GET["stops_visited"]) && !isset($_GET["trips"])){
	http_response_code(400);
	echo json_encode("Error: Missing required parameter(s)");
	die();
}

if(isset($_GET["bbox"])){
	$url .= "bbox=" . $_GET["bbox"];
	if(isset($_GET["traversed_by"]) || isset($_GET["stops_visited"]) || isset($_GET["trips"])){
		$url .= "&";
	}
}

if(isset($_GET["traversed_by"])){
	$url .= "traversed_by=" . $_GET["traversed_by"];
	if(isset($_GET["stops_visited"]) || isset($_GET["trips"])){
		$url .= "&";
	}
}

if(isset($_GET["stops_visited"])){
	$url .= "stops_visited=" . $_GET["stops_visited"];
	if(isset($_GET["trips"])){
		$url .= "&";
	}
}

if(isset($_GET["trips"])){
	$url .= "trips=" . $_GET["trips"];
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$result = curl_exec($ch);
curl_close($ch);
echo $result;

?>