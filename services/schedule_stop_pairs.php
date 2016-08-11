<?php
//schedule_stop_pairs.php
//Audrey Henry
header('Access-Control-Allow-Origin: *');
if($_SERVER["REQUEST_METHOD"] !== "GET"){
	http_response_code(400);
	echo json_encode("Error: Bad request type");
	die();
}
//Note: should pass in at least one parameter. I was running into issues trying to pull schedule_stop_pairs with just operator id
//probably too many records fit the criteria.
$sta_id = "o-c2kx-spokanetransitauthority";
$url = "https://transit.land/api/v1/schedule_stop_pairs?operator_onestop_id=" . $sta_id;
if(isset($_GET["date"])){
	$url .= "&date=" . $_GET["date"];
}
if(isset($_GET["origin_onestop_id"])){
	$url .= "&origin_onestop_id=" . $_GET["origin_onestop_id"];
}
if(isset($_GET["destination_onestop_id"])){
	$url .= "&destination_onestop_id=" . $_GET["destination_onestop_id"];
}
/*transit.land only supports time requests based on origin_departure_between.*/
if(isset($_GET["origin_departure_between"])){
	$url .= "&origin_departure_between=" . $_GET["origin_departure_between"];
}
if(isset($_GET["route_onestop_id"])){
	$url .= "&route_onestop_id=" . $_GET["route_onestop_id"];
}
if(isset($_GET["onestop_id"])){
	$url .= "&onestop_id=" . $_GET["onestop_id"];
}
if(isset($_GET["total"])) {
	$url .= "&total=" . $_GET["total"];
}
if(isset($_GET["per_page"])) {
	$url .= "&per_page=" . $_GET["per_page"];
}


$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$result = json_decode(curl_exec($ch));
curl_close($ch);

//SOO now that we have the data, make sure we handle extra functionality
if(isset($_GET["origin_arrival_between"])){
	$times = explode(",", $_GET["origin_arrival_between"]);
	if(count($times) > 1){
		$time1 = strtotime($times[0]);
		$time2 = strtotime($times[1]);
		//Test to make sure the dates were valid and parsed correctly
		if($time1 !== false && $time2 !== false){
			for($i = 0; $i < count($result->schedule_stop_pairs); $i++){
				$currentTime = strtotime($result->schedule_stop_pairs[$i]->origin_arrival_time);
				if($currentTime < $time1 || $currentTime > $time2){
					array_splice($result->schedule_stop_pairs, $i, 1);
					$i--;
				}
			}
		}
	}
	else{
		$time1 = strtotime($times[0]);
		if($time1 !== false){
			for($i = 0; $i < count($result->schedule_stop_pairs); $i++){
				$currentTime = strtotime($result->schedule_stop_pairs[$i]->origin_arrival_time);
				if($currentTime < $time1){
					array_splice($result->schedule_stop_pairs, $i, 1);
					$i--;
				}
			}
		}
	}
}

if(isset($_GET["destination_arrival_between"])){
	$times = explode(",", $_GET["destination_arrival_between"]);
	if(count($times) > 1){
		$time1 = strtotime($times[0]);
		$time2 = strtotime($times[1]);
		//Test to make sure the dates were valid and parsed correctly
		if($time1 !== false && $time2 !== false){
			for($i = 0; $i < count($result->schedule_stop_pairs); $i++){
				$currentTime = strtotime($result->schedule_stop_pairs[$i]->destination_arrival_time);
				if($currentTime < $time1 || $currentTime > $time2){
					array_splice($result->schedule_stop_pairs, $i, 1);
					$i--;
				}
			}
		}
	}
	else{
		$time1 = strtotime($times[0]);
		if($time1 !== false){
			for($i = 0; $i < count($result->schedule_stop_pairs); $i++){
				$currentTime = strtotime($result->schedule_stop_pairs[$i]->destination_arrival_time);
				if($currentTime < $time1){
					array_splice($result->schedule_stop_pairs, $i, 1);
					$i--;
				}
			}
		}
	}
}

if(isset($_GET["destination_departure_between"])){
	$times = explode(",", $_GET["destination_departure_between"]);
	if(count($times) > 1){
		$time1 = strtotime($times[0]);
		$time2 = strtotime($times[1]);
		//Test to make sure the dates were valid and parsed correctly
		if($time1 !== false && $time2 !== false){
			for($i = 0; $i < count($result->schedule_stop_pairs); $i++){
				$currentTime = strtotime($result->schedule_stop_pairs[$i]->destination_departure_time);
				if($currentTime < $time1 || $currentTime > $time2){
					array_splice($result->schedule_stop_pairs, $i, 1);
					$i--;
				}
			}
		}
	}
	else{
		$time1 = strtotime($times[0]);
		if($time1 !== false){
			for($i = 0; $i < count($result->schedule_stop_pairs); $i++){
				$currentTime = strtotime($result->schedule_stop_pairs[$i]->destination_departure_time);
				if($currentTime < $time1){
					array_splice($result->schedule_stop_pairs, $i, 1);
					$i--;
				}
			}
		}
	}
}

echo json_encode($result);
//echo $result;
?>