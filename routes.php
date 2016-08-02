<?php
//routes.php
//Audrey Henry
if($_SERVER["REQUEST_METHOD"] !== "GET"){
	http_response_code(400);
	echo json_encode("Error: Bad request type");
	die();
}
$sta_id = "o-c2kx-spokanetransitauthority";
$url = "https://transit.land/api/v1/routes?operated_by=" . $sta_id;
//I think this is the only parameter we'll have to worry about for routes
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