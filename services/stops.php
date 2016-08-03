<?php
//stops.php
//Audrey Henry
header('Access-Control-Allow-Origin: *');
if($_SERVER["REQUEST_METHOD"] !== "GET"){
	http_response_code(400);
	echo json_encode("Error: Bad request type");
	die();
}
$sta_id = "o-c2kx-spokanetransitauthority";
$url = "https://transit.land/api/v1/stops?served_by=" . $sta_id;
//NOTE: served by can include multiple onestop ids, for both routes and operators. because
//we're hard coding the operator id, the only served_by parameters we should get are route
//onestop ids.
if(isset($_GET["served_by"])){
	$url .= "," . $_GET["served_by"];
}
if(isset($_GET["lon"])){
	$url .= "&lon=" . $_GET["lon"];
}
if(isset($_GET["lat"])){
	$url .= "&lat=" . $_GET["lat"];
}
if(isset($_GET["r"])){
	$url .= "&r=" . $_GET["r"];
}
if(isset($_GET["bbox"])){
	$url .= "&bbox=" . $_GET["bbox"];
}
if(isset($_GET["onestop_id"])){
	$url .= "&onestop_id=" . $_GET["onestop_id"];
}


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$result = curl_exec($ch);
curl_close($ch);
echo $result;
?>