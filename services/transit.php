<?php
namespace transit_webApp;
require_once 'DatabaseAccessLayer.php';

//region database functions

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

//endregion

//region STA request functions

function getRealTimeManagerData(string $request) {
    return makeSTArequest($request, 'RealTimeManager');
}

function getInfoWebData(string $request){
    return makeSTArequest($request, 'InfoWeb');
}

function makeSTArequest(string $request, string $subdir){
    $ch = curl_init("http://tripplanner.spokanetransit.com:8007/$subdir");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function validateRequest($request, $resource) {
    if (!$request) {
        http_response_code(400);
        die('missing variable: request');
    }

    if (!$resource) {
        http_response_code(400);
        die('missing variable: STA_resource');
    }

    if ($resource !== 'RealTimeManager' && $resource !== 'InfoWeb') {
        http_response_code(400);
        die("invalid STA_resource: $resource");
    }
}

function processRequest() {

    $post = json_decode(file_get_contents('php://input'), true);
    $request = json_encode($post['request']);
    $resource = $post['resource'];

    validateRequest($request, $resource);

    header('Content-Type: application/json');

    if ($resource === 'InfoWeb')
        echo getInfoWebData($request);
    if ($resource === 'RealTimeManager')
        echo getRealTimeManagerData($request);
}

processRequest();
//endregion