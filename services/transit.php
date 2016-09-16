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

//endregion

//region STA request functions

function getRealTimeManagerData(string $request) {
    return makeRequestThroughProxy($request, 'RealTimeManager');
}

function getInfoWebData(string $request){
    return makeRequestThroughProxy($request, 'InfoWeb');
}

function makeRequestThroughProxy(string $request, string $resource){
    $response = $proxy = "";

    do {
        $proxy = DatabaseAccessLayer::getNextProxy($proxy);
        makeSTArequest($request, $resource, $proxy);
    } while (empty($response) || $response['statusCode'] != 200);

    return $proxy;
}

function makeSTArequest(string $request, string $subdir, string $IPv4_Proxy=""){
    print('making request');
    $requestHeaders = ['Content-Type: application/json',
                       'Host: tripplanner.spokanetransit.com:8007',
                       'Origin: http://tripplanner.spokanetransit.com:8007',
                       'Referer: http://tripplanner.spokanetransit.com:8007/'];

    $ch = curl_init("http://tripplanner.spokanetransit.com:8007/$subdir");
    if (!empty($IPv4_Proxy)) {
        curl_setopt($ch, CURLOPT_PROXY, $IPv4_Proxy);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    }
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);

    $response = curl_exec($ch);
    curl_close($ch);

    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);

    print("response:");
    var_dump($response);

    return $body;
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
    print('about to make request');
    if ($resource === 'InfoWeb')
        echo getInfoWebData($request);
    if ($resource === 'RealTimeManager')
        echo getRealTimeManagerData($request);
    print('request made');
}

processRequest();
//endregion