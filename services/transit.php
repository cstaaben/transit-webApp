<?php
namespace transit_webApp;
require_once 'DatabaseAccessLayer.php';

function getLocationOfBusOnRoute(string $route_onestop_id) {
    $postBody = buildPostBody($route_onestop_id);
    $json = json_decode(getRealTimeManagerData($postBody), true);
    return buildCoordsFromResult($json);
}

function buildCoordsFromResult(string $json) {
    $location = $json["result"]["travelPoints"][0];
    $lat = $location["Lat"];
    $lon = $location["Lon"];
    return "{lat: $lat, lon: $lon}";
}

function buildPostBody(string $route_onestop_id) {
    $lineDirId = DatabaseAccessLayer::convert_route_onestop_id($route_onestop_id);
    var_dump($lineDirId);
    return '{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"lineDirId":"' . $lineDirId . '","callingApp":"RMD"}],"interval":10}}';
}

function getRealTimeManagerData(string $postBody) {
    $ch = curl_init("http://tripplanner.spokanetransit.com:8007/RealTimeManager");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postBody);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    print($result);
    return $result;
}

if (!array_key_exists("route_onestop_id", $_GET) || empty($_GET["route_onestop_id"]))
    print('missing variable: route_onestop_id');
else {
    $route_onestop_id = DatabaseAccessLayer::sanitizeStr($_GET['route_onestop_id']);
    getLocationOfBusOnRoute($route_onestop_id);
}