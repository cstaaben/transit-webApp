<?php

namespace transit_webApp;

require_once 'DatabaseAccessLayer.php';

define('CONFIG_INI', 'config.ini');

//region higher level functions

function getBusLocations(string $route_onestop_id) : callable {
    $request = buildTravelPointsRequest($route_onestop_id);
    $json = json_decode(getRealTimeManagerData($request), true);
    var_dump($json);
    return buildCoordsFromResult($json);
}


//TODO: fetch from STA
function buildTravelPointsRequest(string $route_onestop_id) : string {
    $lineDirId = DatabaseAccessLayer::convert_route_onestop_id($route_onestop_id);
    var_dump($lineDirId);
    return '{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"lineDirId":"' . $lineDirId . '","callingApp":"RMD"}],"interval":10}}';
}


function buildCoordsFromResult(string $json) : string {
    //TODO: iterate through travelPoints
    $location = $json["result"]["travelPoints"][0];
    $lat = $location["Lat"];
    $lng = $location["Lon"];
    return "{lat: $lat, lng: $lng}";
}

//endregion

//region STA request functions

function makeRequest(string $request, string $resource) : string {
    $use_proxy = parse_ini_file(CONFIG_INI, true)['general']['use_proxy'];
    if ($use_proxy)
        return makeRequestThroughProxy($request, $resource);
    else
        return makeSTArequest($request, $resource);
}

function getRealTimeManagerData(string $request) : string {
    return makeRequest($request, 'RealTimeManager');
}

function getInfoWebData(string $request) : string {
    return makeRequest($request, 'InfoWeb');
}

function makeRequestThroughProxy(string $request, string $resource) : string {
    $proxy = "";
    do {
        $proxy = DatabaseAccessLayer::getNextProxy($proxy);
        $response = makeSTArequest($request, $resource, $proxy);
    } while (empty($response) || $response['statusCode'] != 200);

    return $response;
}

function makeSTArequest(string $request, string $subdir, string $IPv4_Proxy="") : string {
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

//TODO: convert to only accept higher-level functions instead of request/resource scheme
/*
function processRequest() {
    $post = json_decode(file_get_contents('php://input'), true);
    $request = json_encode($post['request']);
    $resource = $post['resource'];

    validateRequest($request, $resource);

    header('Content-Type: application/json');
    makeRequest($request, $resource);
}*/

function processRequest(){
    //data: '{"method":"getBusLocations","params":"' + route_onestop_id + '"}',
    $post = json_decode(file_get_contents('php://input'), true);
    var_dump($post);
    $method = $post['method'];
    //TODO!: validate input
    $params = $post['params'];
    //var_dump(getBusLocations($params));
    $response = call_user_func($method, $params);

    var_dump($response);
    return $response;
}

processRequest();
//endregion

/*acceptable functions:
getBusLocations(route_onestop_id)
getRouteGeometry(route_onestop_id)

*/